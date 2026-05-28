# x_tid_generator.js — JavaScript Reference Implementation

A standalone Node.js port of `twikit/x_client_transaction/transaction.py`.

Generates the `x-client-transaction-id` header required by X (Twitter) private APIs.

## Requirements

- Node.js ≥ 18 (uses built-in `crypto.createHash`)
- No npm dependencies

## Quick Start

```js
const { ClientTransaction } = require('./x_tid_generator');

const ct = new ClientTransaction();
await ct.init();                    // fetches x.com + ondemand.s bundle
const tid = ct.generateTransactionId('GET', '/i/api/graphql/.../SearchTimeline');
```

Supply pre-fetched content to avoid extra HTTP round-trips:

```js
const htmlText    = await fetchSomehow('https://x.com/');
const bundleText  = await fetchSomehow(getOndemandUrl(htmlText));
await ct.init(htmlText, bundleText);
```

## Self-Tests

```
node x_tid_generator.js
```

Runs 4 deterministic test vectors (E2E TID, LE32 timestamp fix, animationKey, floatToHex).

## Algorithm Notes

See [X_TID_SOP.md](../../X_TID_SOP.md) for a full reverse-engineering walk-through
including the two-step webpack chunk lookup, animationKey pipeline, and SHA-256 input
construction.

## Status

- Tracks `twikit` Python implementation
- Verified against live `x.com` (version byte `0x03`, timestamp ±0s)
- Implements the March 2026 webpack bundle format fix (issues #408/#409)
