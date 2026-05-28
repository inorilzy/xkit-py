/**
 * X (Twitter) x-client-transaction-id Generator
 * Reverse engineered from webpack module 208932 + twikit x_client_transaction
 *
 * Algorithm summary:
 *   TID = 70 bytes, base64-encoded (no padding)
 *
 * Inputs (high-level):
 *   html     - Raw HTML of https://x.com/ (contains meta key + SVG animation frames)
 *   bundleJs - Content of ondemand.s.{hash}a.js (contains KEY_BYTE indices)
 *   method   - HTTP method string e.g. "GET"
 *   path     - URL path string e.g. "/i/api/1.1/timeline.json"
 *   nowMs    - Date.now() in milliseconds (optional, defaults to current time)
 *   random   - Math.random() value 0..1 (optional, defaults to random)
 *
 * TID byte layout (before final XOR mask):
 *   [0]      K = floor(random * 256)             <- XOR mask key
 *   [1..48]  keyBytes[0..47] XOR K               <- 48-byte page key (from twitter-site-verification meta, base64-decoded)
 *   [49..52] LE32(seconds - BUNDLE_EPOCH) XOR K  <- signed 4-byte timestamp
 *   [53..68] SHA256(shaInput).slice(0,16) XOR K  <- path/method fingerprint
 *   [69]     0x03 XOR K                           <- version constant
 *
 * SHA256 input:
 *   method + "!" + path + "!" + (seconds - BUNDLE_EPOCH) + DEFAULT_KEYWORD + animationKey
 *
 * Constants:
 *   BUNDLE_EPOCH = 1682924400  ~= 2023-05-01 00:00:00 UTC
 *   DEFAULT_KEYWORD = "obfiowerehiring"
 *   VERSION_BYTE = 0x03
 *
 * animationKey computation pipeline (ported from twikit):
 *   1. Parse twitter-site-verification meta -> 48-byte keyBytes (base64-decoded)
 *   2. Fetch ondemand.s.{hash}a.js bundle, extract key byte indices
 *      via regex /\(\w{1}\[(\d{1,2})\],\s*16\)/g -> [rowIndex, ...keyBytesIndices]
 *   3. Parse SVG loading animation frames 0..3 from HTML
 *   4. Select frame = frames[ keyBytes[5] % 4 ]
 *   5. Parse 2D array from frame second <path> d-attribute (split on "C" after [9:])
 *   6. rowIndex = keyBytes[DEFAULT_ROW_INDEX] % 16
 *   7. frameTime = product(keyBytes[i] % 16 for i in keyBytesIndices), rounded to nearest 10
 *   8. targetTime = frameTime / 4096
 *   9. animate(arr[rowIndex], targetTime) -> hex color + rotation matrix string
 *   10. Strip [.-] from result -> animationKey string
 *
 * Bug fixes from initial reverse engineering:
 *   - Bug 1: bytes[49..52] were encoded as LE16(0x9c90 + seconds) + hardcoded constants.
 *            Fix: use full LE32(seconds - BUNDLE_EPOCH) as signed 32-bit integer.
 *   - Bug 2: SHA input used hardcoded nonce suffix instead of computed animationKey.
 *            Fix: compute animationKey dynamically from SVG frames + key bytes + indices.
 *
 * twikit Issue #408/#409 (March 2026 bundle format change):
 *   X changed webpack bundle so ON_DEMAND_FILE_REGEX no longer matched.
 *   Old format: 'ondemand.s': 'hashvalue'
 *   New format: {chunkId: 'ondemand.s', ..., chunkId: 'hashvalue'}
 *   Fix: getOndemandUrl() does a two-step chunk-ID -> hash lookup.
 *   Status: fixed in inorilzy/twikit fork; PR #410/#411 pending in d60/twikit upstream.
 */

'use strict';
const { createHash } = require('crypto');

// -- Constants -----------------------------------------------------------------
const BUNDLE_EPOCH = 1682924400;        // seconds ~= 2023-05-01 00:00:00 UTC
const DEFAULT_KEYWORD = 'obfiowerehiring';
const VERSION_BYTE = 0x03;


// =============================================================================
// 1  MATH UTILITIES  (ported from twikit cubic_curve.py / interpolate.py /
//                     rotation.py / utils.py)
// =============================================================================

/**
 * Custom float -> hex string used by twikit animation_key assembly.
 * e.g. floatToHex(1.0) -> '1',  floatToHex(0.5) -> '.8',  floatToHex(0.0) -> ''
 * @param {number} x  non-negative float
 * @returns {string}
 */
function floatToHex(x) {
  const result = [];
  let quotient = Math.trunc(x);
  const fraction = x - quotient;

  while (quotient > 0) {
    const newQuotient = Math.trunc(x / 16);
    const remainder = Math.trunc(x - newQuotient * 16);
    result.unshift(remainder > 9 ? String.fromCharCode(remainder + 55) : String(remainder));
    x = newQuotient;
    quotient = newQuotient;
  }

  if (fraction === 0) return result.join('');

  result.push('.');
  let frac = fraction;
  while (frac > 0) {
    frac *= 16;
    const integer = Math.trunc(frac);
    frac -= integer;
    result.push(integer > 9 ? String.fromCharCode(integer + 55) : String(integer));
  }
  return result.join('');
}

/** Returns true if n is odd. Used as minVal for Bezier control point solve(). */
function isOdd(n) {
  return n % 2 !== 0;
}

/**
 * Map an integer value (0..255) to a float in [minVal, maxVal].
 * @param {number} value    integer 0..255
 * @param {number} minVal   range minimum (0 or 1)
 * @param {number} maxVal   range maximum (typically 1.0)
 * @param {boolean} rounding  true -> floor, false -> round to 2 decimal places
 */
function solve(value, minVal, maxVal, rounding) {
  const result = value * (maxVal - minVal) / 255 + minVal;
  return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
}

/**
 * Cubic Bezier easing function solver.
 * Finds t such that x-Bezier(t) ~= time, then returns y-Bezier(t).
 * Control points: P0=(0,0), P1=(curves[0],curves[1]), P2=(curves[2],curves[3]), P3=(1,1)
 */
class CubicBezier {
  constructor(curves) {
    this.curves = curves;
  }

  /** Bezier polynomial: 3*a*(1-m)^2*m + 3*b*(1-m)*m^2 + m^3 */
  static calculate(a, b, m) {
    return 3.0 * a * (1 - m) * (1 - m) * m + 3.0 * b * (1 - m) * m * m + m * m * m;
  }

  getValue(time) {
    const [c0, c1, c2, c3] = this.curves;
    let startGradient = 0, endGradient = 0, start = 0, end = 1, mid = 0;

    if (time <= 0.0) {
      if (c0 > 0.0) startGradient = c1 / c0;
      else if (c1 === 0.0 && c2 > 0.0) startGradient = c3 / c2;
      return startGradient * time;
    }
    if (time >= 1.0) {
      if (c2 < 1.0) endGradient = (c3 - 1.0) / (c2 - 1.0);
      else if (c2 === 1.0 && c0 < 1.0) endGradient = (c1 - 1.0) / (c0 - 1.0);
      return 1.0 + endGradient * (time - 1.0);
    }

    while (start < end) {
      mid = (start + end) / 2;
      const xEst = CubicBezier.calculate(c0, c2, mid);
      if (Math.abs(time - xEst) < 0.00001) return CubicBezier.calculate(c1, c3, mid);
      if (xEst < time) start = mid;
      else end = mid;
    }
    return CubicBezier.calculate(c1, c3, mid);
  }
}

/**
 * Linear interpolation between two same-length arrays.
 */
function interpolate(from, to, f) {
  return from.map((v, i) => v * (1 - f) + to[i] * f);
}

/**
 * Convert degrees rotation to a 2D rotation matrix [cos, -sin, sin, cos].
 */
function convertRotationToMatrix(degrees) {
  const rad = degrees * Math.PI / 180;
  return [Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)];
}

/**
 * Python-compatible banker's rounding (round half to even).
 * Used so frameTime rounding matches Python built-in round().
 */
function bankersRound(x) {
  const fl = Math.floor(x);
  const diff = x - fl;
  if (Math.abs(diff - 0.5) < 1e-10) return fl % 2 === 0 ? fl : fl + 1;
  return Math.round(x);
}


// =============================================================================
// 2  ANIMATION KEY COMPUTATION
// =============================================================================

/**
 * Run the animation simulation for one SVG path row at a given target time.
 * @param {number[]} frames     Integer array from one "C" segment of SVG path
 * @param {number}   targetTime Float 0..1
 * @returns {string}            Animation key fragment (hex, no dots/dashes)
 */
function animate(frames, targetTime) {
  const fromColor = [...frames.slice(0, 3).map(Number), 1];
  const toColor   = [...frames.slice(3, 6).map(Number), 1];
  const fromRotation = [0.0];
  const toRotation   = [solve(frames[6], 60.0, 360.0, true)];
  const rest = frames.slice(7);

  const curves = rest.map((item, counter) =>
    solve(item, isOdd(counter) ? 1 : 0, 1.0, false));
  const cubic = new CubicBezier(curves);
  const val = cubic.getValue(targetTime);

  const color    = interpolate(fromColor, toColor, val).map(v => v > 0 ? v : 0);
  const rotation = interpolate(fromRotation, toRotation, val);
  const matrix   = convertRotationToMatrix(rotation[0]);

  const strArr = color.slice(0, 3).map(v => Math.round(v).toString(16));

  for (const value of matrix) {
    const rounded = Math.abs(Math.round(value * 100) / 100);
    const hexVal  = floatToHex(rounded);
    strArr.push(hexVal.startsWith('.') ? ('0' + hexVal).toLowerCase()
                                       : hexVal || '0');
  }
  strArr.push('0', '0');

  return strArr.join('').replace(/[.\-]/g, '');
}

/**
 * Parse a 2D array from one SVG frame animation path data.
 * @param {string} frameD  "d" attribute of the animation <path>
 * @returns {number[][]}   Array of int-arrays, one per "C" segment
 */
function get2dArray(frameD) {
  const segments = frameD.slice(9).split('C');
  return segments.map(seg => {
    const nums = seg.replace(/[^\d]+/g, ' ').trim();
    if (!nums) return [];
    return nums.split(' ').filter(Boolean).map(Number);
  });
}

/**
 * Compute the animation key string.
 * Matches twikit ClientTransaction.get_animation_key().
 *
 * @param {number[]} keyBytes          48-byte array (base64-decoded meta)
 * @param {string[]} svgFrameDs        4-element array of "d" attribute strings
 * @param {number}   rowIndex          DEFAULT_ROW_INDEX from bundle
 * @param {number[]} keyBytesIndices   DEFAULT_KEY_BYTES_INDICES from bundle
 * @returns {string}
 */
function computeAnimationKey(keyBytes, svgFrameDs, rowIndex, keyBytesIndices) {
  const frameIdx = keyBytes[5] % 4;
  const arr = get2dArray(svgFrameDs[frameIdx]);

  const row = keyBytes[rowIndex] % 16;

  const frameTimeRaw = keyBytesIndices.reduce(
    (acc, idx) => acc * (keyBytes[idx] % 16), 1);
  const frameTime = bankersRound(frameTimeRaw / 10) * 10;
  const targetTime = frameTime / 4096.0;

  return animate(arr[row], targetTime);
}


// =============================================================================
// 3  HTML / BUNDLE PARSING
// =============================================================================

/**
 * Extract the twitter-site-verification meta content from raw HTML.
 */
function extractMetaKey(htmlText) {
  const m = htmlText.match(/name="twitter-site-verification"[^>]*content="([^"]+)"/);
  if (m) return m[1];
  const m2 = htmlText.match(/content="([^"]+)"[^>]*name="twitter-site-verification"/);
  if (m2) return m2[1];
  throw new Error('twitter-site-verification meta not found');
}

/**
 * Parse the 4 SVG loading animation "d" attribute values from x.com HTML.
 * Returns array of 4 "d" attribute strings from loading-x-anim-{0..3}.
 *
 * SVG structure:
 *   <svg id="loading-x-anim-{i}" ...>
 *     <g>
 *       <path d="M18.244..."/>   <- X logo (skip)
 *       <path d="M 10,30 C ..."/> <- animation data (take)
 *     </g>
 *   </svg>
 */
function parseSvgFrames(htmlText) {
  const frames = [];
  for (let i = 0; i < 4; i++) {
    const svgStart = htmlText.indexOf(`id="loading-x-anim-${i}"`);
    if (svgStart < 0) throw new Error(`loading-x-anim-${i} not found in HTML`);
    const svgTagStart = htmlText.lastIndexOf('<svg', svgStart);
    const svgEnd = htmlText.indexOf('</svg>', svgTagStart) + 6;
    const svgContent = htmlText.slice(svgTagStart, svgEnd);

    const pathRegex = /<path\b[^>]*\bd="([^"]+)"[^>]*>/g;
    const paths = [];
    let m;
    while ((m = pathRegex.exec(svgContent)) !== null) paths.push(m[1]);
    if (paths.length < 2) throw new Error(`loading-x-anim-${i}: fewer than 2 path elements`);
    frames.push(paths[1]);
  }
  return frames;
}

/**
 * Parse KEY_BYTE indices from the ondemand.s bundle.
 * Returns [rowIndex, keyBytesIndices] matching twikit DEFAULT_ROW_INDEX
 * and DEFAULT_KEY_BYTES_INDICES.
 *
 * Uses updated twikit regex (post March 2026):
 *   /\(\w{1}\[(\d{1,2})\],\s*16\)/g
 */
function parseOndemandIndices(bundleText) {
  const regex = /\(\w{1}\[(\d{1,2})\],\s*16\)/g;
  const indices = [];
  let m;
  while ((m = regex.exec(bundleText)) !== null) indices.push(parseInt(m[1], 10));
  if (indices.length === 0) throw new Error("Couldn't find KEY_BYTE indices in bundle");
  return [indices[0], indices.slice(1)];
}

/**
 * Find the ondemand.s bundle URL from x.com HTML.
 * Implements the two-step chunk-ID -> hash lookup required after March 2026
 * (fixes twikit issues #408/#409).
 *
 * Old format: 'ondemand.s': 'hashvalue'
 * New format: {chunkId: 'ondemand.s', ..., chunkId: 'hashvalue'}
 */
function getOndemandUrl(htmlText) {
  const chunkMatch = htmlText.match(/[,{](\d+):["']ondemand\.s["']/);
  if (!chunkMatch) throw new Error("ondemand.s chunk ID not found");
  const chunkId = chunkMatch[1];

  const hashRegex = new RegExp(`,${chunkId}:"([0-9a-f]+)"`);
  const hashMatch = htmlText.match(hashRegex);
  if (!hashMatch) throw new Error(`ondemand.s hash for chunk ${chunkId} not found`);

  return `https://abs.twimg.com/responsive-web/client-web/ondemand.s.${hashMatch[1]}a.js`;
}


// =============================================================================
// 4  CORE TID GENERATION
// =============================================================================

/**
 * Generate x-client-transaction-id value.
 *
 * @param {number[]|Buffer|Uint8Array} keyBytes   48-byte key (base64-decoded twitter-site-verification)
 * @param {string}  animationKey   Computed animation key (from computeAnimationKey)
 * @param {string}  method         HTTP method e.g. "GET"
 * @param {string}  path           URL path e.g. "/i/api/graphql/..."
 * @param {number}  [nowMs]        Current time ms (default: Date.now())
 * @param {number}  [randomVal]    Random 0..1 (default: Math.random())
 * @returns {string}               TID (base64, no padding)
 */
function generateTransactionId(keyBytes, animationKey, method, path, nowMs, randomVal) {
  if (keyBytes.length !== 48) throw new Error(`keyBytes must be 48 bytes, got ${keyBytes.length}`);

  const ts   = nowMs     !== undefined ? nowMs     : Date.now();
  const rand = randomVal !== undefined ? randomVal : Math.random();

  const seconds = Math.floor(ts / 1000);
  const K = Math.floor(rand * 256) & 0xFF;
  const timeNow = seconds - BUNDLE_EPOCH;  // signed 32-bit int

  // SHA-256 over "method!path!timeNow<DEFAULT_KEYWORD><animationKey>"
  const shaInput = `${method}!${path}!${timeNow}${DEFAULT_KEYWORD}${animationKey}`;
  const sha256 = createHash('sha256').update(shaInput, 'latin1').digest();

  const tid = Buffer.alloc(70);
  tid[0] = K;

  for (let i = 0; i < 48; i++) tid[1 + i] = (keyBytes[i] ^ K) & 0xFF;

  // Bug 1 fix: LE32(timeNow) -- was LE16(0x9c90+seconds) + hardcoded [0xb0, 0x9b]
  const t = timeNow >>> 0;  // unsigned 32-bit view
  tid[49] = (t         & 0xFF) ^ K;
  tid[50] = ((t >>>  8) & 0xFF) ^ K;
  tid[51] = ((t >>> 16) & 0xFF) ^ K;
  tid[52] = ((t >>> 24) & 0xFF) ^ K;

  for (let i = 0; i < 16; i++) tid[53 + i] = (sha256[i] ^ K) & 0xFF;

  tid[69] = VERSION_BYTE ^ K;

  return tid.toString('base64').replace(/=/g, '');
}


// =============================================================================
// 5  ClientTransaction CLASS (async, full pipeline)
// =============================================================================

/**
 * Full async pipeline matching twikit ClientTransaction class.
 *
 * Usage:
 *   const ct = new ClientTransaction();
 *   await ct.init();                          // fetches x.com + ondemand.s bundle
 *   const tid = ct.generateTransactionId('GET', '/i/api/...');
 *
 * Or supply pre-fetched content to avoid extra network round-trips:
 *   await ct.init(htmlContent, bundleContent);
 */
class ClientTransaction {
  constructor() {
    this.keyBytes = null;
    this.animationKey = null;
    this._initialized = false;
  }

  async init(htmlText, bundleText) {
    if (!htmlText) htmlText = await fetchUrl('https://x.com/');

    const metaKey = extractMetaKey(htmlText);
    this.keyBytes = Array.from(Buffer.from(metaKey, 'base64'));
    if (this.keyBytes.length !== 48) throw new Error('Unexpected key length');

    if (!bundleText) {
      const bundleUrl = getOndemandUrl(htmlText);
      bundleText = await fetchUrl(bundleUrl);
    }

    const [rowIndex, keyBytesIndices] = parseOndemandIndices(bundleText);
    const svgFrameDs = parseSvgFrames(htmlText);
    this.animationKey = computeAnimationKey(this.keyBytes, svgFrameDs, rowIndex, keyBytesIndices);
    this._initialized = true;
  }

  generateTransactionId(method, path, nowMs, randomVal) {
    if (!this._initialized) throw new Error('Call init() first');
    return generateTransactionId(this.keyBytes, this.animationKey, method, path, nowMs, randomVal);
  }
}


// =============================================================================
// 6  HTTP HELPER
// =============================================================================

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    }).on('error', reject);
  });
}


// =============================================================================
// 7  PUBLIC API
// =============================================================================

module.exports = {
  generateTransactionId,
  computeAnimationKey,
  parseSvgFrames,
  parseOndemandIndices,
  extractMetaKey,
  getOndemandUrl,
  ClientTransaction,
};


// =============================================================================
// 8  SELF-TESTS  (run with: node x_tid_generator.js)
// =============================================================================

if (require.main === module) {
  let allPass = true;

  // -- Test 1: E2E vectors (captured from live browser) ----------------------
  //
  // Captured with:
  //   animKey = 'ECGgWEk3fy8f+kO2C66gUIUlLLE8Qbq5Be8Yr6zr5rUjlzbmm56ZgpvtsnFIQrhX'
  //   ts = 5000000 ms (5000 seconds), rand = 0.5  -> K = 0x80
  //   animationKey = '53e4ea1007ae147ae147ae007ae147ae147ae100'
  //
  // Note: at ts=5000s the LE32 timestamp bytes coincidentally match the old
  // buggy LE16 encoding, so these vectors validate both the SHA and key-byte
  // XOR logic independent of the Bug 1 fix.
  console.log('=== Test 1: E2E vectors (ts=5000s, known animationKey) ===');
  {
    const keyBytes = Array.from(Buffer.from(
      'ECGgWEk3fy8f+kO2C66gUIUlLLE8Qbq5Be8Yr6zr5rUjlzbmm56ZgpvtsnFIQrhX', 'base64'));
    const ANIM_KEY = '53e4ea1007ae147ae147ae007ae147ae147ae100';
    const cases = [
      { method: 'GET',  path: '/a',
        expected: 'gJChINjJt/+vn3rDNosuINAFpawxvME6OYVvmC8sa2Y1oxe2ZhseGQIbbTLxyMI415gwMBuFBPaojccVUO9m5FMG1FTIgw' },
      { method: 'POST', path: '/i/api/1.1/friends/following/list.json',
        expected: 'gJChINjJt/+vn3rDNosuINAFpawxvME6OYVvmC8sa2Y1oxe2ZhseGQIbbTLxyMI415gwMBsrCD2GHQzBvx5lBpSGf56ygw' },
    ];
    for (const c of cases) {
      const got  = generateTransactionId(keyBytes, ANIM_KEY, c.method, c.path, 5000000, 0.5);
      const pass = got === c.expected;
      if (!pass) allPass = false;
      console.log(`${pass ? 'PASS' : 'FAIL'} ${c.method} ${c.path}`);
      if (!pass) { console.log('  expected:', c.expected); console.log('  got:     ', got); }
    }
  }

  // -- Test 2: Bug 1 -- LE32 timestamp encoding at real 2024 timestamp --------
  console.log('\n=== Test 2: Bug 1 -- LE32 timestamp ===');
  {
    const keyBytes = Array.from(Buffer.from(
      'ECGgWEk3fy8f+kO2C66gUIUlLLE8Qbq5Be8Yr6zr5rUjlzbmm56ZgpvtsnFIQrhX', 'base64'));
    // 2024-01-01 00:00:00 UTC = 1704067200s
    // timeNow = 1704067200 - 1682924400 = 21142800 = 0x01429D10
    const testMs = 1704067200000;
    const tid = generateTransactionId(keyBytes, 'testkey', 'GET', '/test', testMs, 0);
    const raw = Buffer.from(tid, 'base64');
    const K   = raw[0];
    const bytes = [raw[49]^K, raw[50]^K, raw[51]^K, raw[52]^K];
    const expected = [0x10, 0x9D, 0x42, 0x01];  // LE32(0x01429D10)
    const pass = bytes.every((b, i) => b === expected[i]);
    if (!pass) allPass = false;
    console.log(`${pass ? 'PASS' : 'FAIL'} LE32(21142800) = [${bytes.map(x=>'0x'+x.toString(16).padStart(2,'0'))}]`);
    if (!pass) console.log('  expected:', expected.map(x=>'0x'+x.toString(16).padStart(2,'0')));
  }

  // -- Test 3: animation key computation (verified against Python twikit) -----
  console.log('\n=== Test 3: computeAnimationKey (live x.com data, Python-verified) ===');
  {
    const META = 'HxeAUy2o24jRiWwIOir8sbm6jDjgqAltY+GdyvDPYfr5fpEQHobA4HUciKJHWRrI';
    const kb   = Array.from(Buffer.from(META, 'base64'));
    // Frame 0 d-attribute captured from live x.com
    const FRAME0 = 'M 10,30 C 173,76 101,102 123,17 h 50 s 98,117 237,133 C 128,6 111,211 236,28 h 203 s 39,95 73,238 C 181,135 187,64 1,193 h 139 s 155,160 125,210 C 141,246 119,93 77,32 h 151 s 79,12 108,10 C 28,67 73,214 169,143 h 183 s 205,189 152,131 C 47,56 89,229 167,143 h 57 s 216,201 230,234 C 233,147 42,185 48,50 h 108 s 10,154 43,73 C 80,227 158,122 251,5 h 199 s 221,85 235,115 C 145,229 109,14 159,123 h 183 s 136,59 102,105 C 112,255 161,46 27,146 h 64 s 21,21 27,104 C 29,25 40,98 122,121 h 65 s 159,152 98,98 C 182,144 107,222 125,29 h 42 s 117,225 140,116 C 182,147 23,16 88,219 h 162 s 30,33 89,9 C 202,106 12,157 155,181 h 100 s 23,49 192,149 C 51,141 12,2 90,107 h 38 s 140,99 40,60 C 8,252 131,119 143,85 h 196 s 135,47 222,101';
    // kb[5]=168 -> frameIdx=0; rowIndex=15, keyBytesIndices=[26,43,38]
    // kb[26]%16=13, kb[43]%16=2, kb[38]%16=0 -> frameTimeRaw=0 -> animKey='8066f100100'
    const animKey = computeAnimationKey(kb, [FRAME0, '', '', ''], 15, [26, 43, 38]);
    const expected = '8066f100100';
    const pass = animKey === expected;
    if (!pass) allPass = false;
    console.log(`${pass ? 'PASS' : 'FAIL'} animKey='${animKey}' (expected '${expected}')`);
  }

  // -- Test 4: floatToHex edge cases -----------------------------------------
  console.log('\n=== Test 4: floatToHex edge cases ===');
  {
    const cases = [
      [0.0, ''],
      [1.0, '1'],
      [16.0, '10'],
      [255.0, 'FF'],
      [0.5, '.8'],
    ];
    for (const [input, expected] of cases) {
      const got  = floatToHex(input);
      const pass = got === expected;
      if (!pass) allPass = false;
      console.log(`${pass ? 'PASS' : 'FAIL'} floatToHex(${input}) = '${got}' (expected '${expected}')`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(allPass ? 'ALL TESTS PASS' : 'SOME TESTS FAILED');
  process.exit(allPass ? 0 : 1);
}