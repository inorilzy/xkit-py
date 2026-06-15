# X (Twitter) `x-client-transaction-id` 逆向 & 修复 SOP

> 版本：v2.0（2025-07）  
> 状态：已验证，含完整测试向量  
> 对应实现：`contrib/js/x_tid_generator.js`（JS）、`twikit/x_client_transaction/transaction.py`（Python）

---

## 一、算法核心结构

### TID 字节布局（70 字节，Base64 无填充编码）

| 字节范围 | 内容 | 说明 |
|---|---|---|
| `[0]` | `K = floor(random × 256)` | XOR 掩码密钥（0~255） |
| `[1..48]` | `keyBytes[0..47] XOR K` | 页面指纹（48字节） |
| `[49..52]` | `LE32(seconds - BUNDLE_EPOCH) XOR K` | **有符号32位**小端时间戳 |
| `[53..68]` | `SHA256(shaInput)[0:16] XOR K` | 路径/方法指纹 |
| `[69]` | `0x03 XOR K` | 版本常量 |

**关键常量：**
```
BUNDLE_EPOCH   = 1682924400   # 约 2023-05-01 00:00:00 UTC
DEFAULT_KEYWORD = "obfiowerehiring"
VERSION_BYTE   = 0x03
```

**SHA256 输入格式：**
```
method + "!" + path + "!" + (seconds - BUNDLE_EPOCH) + DEFAULT_KEYWORD + animationKey
```

---

## 二、keyBytes 来源

```html
<!-- x.com HTML 中的 meta 标签 -->
<meta name="twitter-site-verification" content="ECGgWEk3fy8f+kO2C66g...">
```

```python
import base64
keyBytes = list(base64.b64decode(meta_content))   # 必须恰好 48 字节
```

```javascript
const keyBytes = Array.from(Buffer.from(metaContent, 'base64'));  // 48 bytes
```

---

## 三、animationKey 计算流程

```
x.com HTML
  ├── twitter-site-verification meta → base64解码 → 48字节 keyBytes
  └── 4个 SVG loading 动画帧
      id=loading-x-anim-0 ~ loading-x-anim-3
      取每个 SVG 中第二个 <path> 的 d 属性

ondemand.s bundle（两步查找，见第四节）
  └── regex /\(\w{1}\[(\d{1,2})\],\s*16\)/g
      → [rowIndex, keyBytesIndices[0], keyBytesIndices[1], ...]

animationKey 计算步骤：
  1. frameIdx      = keyBytes[5] % 4
  2. frameD        = svgFrames[frameIdx]  ← 选中的 SVG 帧 d 属性
  3. arr           = get2dArray(frameD)   ← 解析为二维整数数组
                     方法：frameD[9:].split("C")，每段提取所有整数
  4. row           = keyBytes[rowIndex] % 16
  5. frameTimeRaw  = ∏(keyBytes[i] % 16 for i in keyBytesIndices)
  6. frameTime     = bankersRound(frameTimeRaw / 10) × 10  ← 银行家舍入！
  7. targetTime    = frameTime / 4096.0
  8. result        = animate(arr[row], targetTime)
                     → CubicBézier插值 → RGB + 旋转矩阵 → hex字符串
  9. animationKey  = result.replace(/[.\-]/g, '')
```

### ⚠️ bankersRound（重要！）

Python 内置 `round()` 使用**银行家舍入**（half-to-even），JS 的 `Math.round()` 不同。  
JS 必须自实现：

```javascript
function bankersRound(x) {
  const fl = Math.floor(x);
  const diff = x - fl;
  if (Math.abs(diff - 0.5) < 1e-10) return fl % 2 === 0 ? fl : fl + 1;
  return Math.round(x);
}
```

---

## 四、ondemand.s Bundle 查找（两步）

> ⚠️ 2026年3月 X 更新了 bundle 格式，不再直接存放 hash，改为先存 chunkId。

### Step 1：找 chunk_id

```python
import re
m = re.search(r'[,{](\d+):["\']ondemand\.s["\']', html)
chunk_id = m.group(1)  # 例如 '59924'
```

```javascript
const m = html.match(/[,{](\d+):["']ondemand\.s["']/);
const chunkId = m[1];
```

### Step 2：用 chunk_id 找 hash

```python
# Python：注意 str.format() 中 {{ 转义字面量大括号
ON_DEMAND_HASH_PATTERN = r'[,{{]{chunk_id}:["\']([0-9a-f]+)["\']'
pattern = ON_DEMAND_HASH_PATTERN.format(chunk_id=chunk_id)
# 展开后得到：[,{]59924:["\'](...)  ← 正确！
h = re.search(pattern, html)
hash_val = h.group(1)  # 例如 '3260c50'
```

```javascript
// JavaScript
const hashRegex = new RegExp(`,${chunkId}:"([0-9a-f]+)"`);
const hm = html.match(hashRegex);
const hashVal = hm[1];
```

### 拼接 URL

```
https://abs.twimg.com/responsive-web/client-web/ondemand.s.{hash_val}a.js
```

---

## 五、常见 Bug 与修复

### Bug 1：时间戳编码错误（LE32 vs LE16）

**症状：** TID 在当前时间（2024年以后）解码出错误时间戳  
**原因：** 用了 `LE16(0x9c90 + seconds)` + 硬编码 `[0xb0, 0x9b]`

**验证方法：**
```javascript
// 期望：2024-01-01 的 timeNow = 21142800 = 0x01429D10
// LE32 小端字节应为 [0x10, 0x9D, 0x42, 0x01]
const testMs = 1704067200000;
const tid = generateTransactionId(keyBytes, animKey, 'GET', '/test', testMs, 0);
const buf = Buffer.from(tid, 'base64');
const K = buf[0];
console.log([buf[49]^K, buf[50]^K, buf[51]^K, buf[52]^K]);
// → [ 16, 157, 66, 1 ] = [ 0x10, 0x9D, 0x42, 0x01 ] ✓
```

**修复（JS）：**
```javascript
const timeNow = seconds - BUNDLE_EPOCH;   // 有符号整数
const t = timeNow >>> 0;                   // 转无符号32位
tid[49] = (t         & 0xFF) ^ K;
tid[50] = ((t >>>  8) & 0xFF) ^ K;
tid[51] = ((t >>> 16) & 0xFF) ^ K;
tid[52] = ((t >>> 24) & 0xFF) ^ K;
```

---

### Bug 2：animationKey 硬编码

**症状：** TID 结构正确，但服务器返回 403/签名失效  
**原因：** SHA 输入用了抓包捕获的静态字符串  
**修复：** 动态计算 animationKey（实现完整流程，见第三节）

---

### Bug 3：Python format-string 转义

**症状：** `re.search()` 永远返回 None，无法找到 hash  
**诊断：**
```python
pattern = ON_DEMAND_HASH_PATTERN.format(chunk_id='59924')
print(pattern)   # 如果输出含 {chunk_id} 或 {59924}，则 Bug 确认
```

**错误示例（旧代码）：**
```python
# r'[,{{{chunk_id}}}]{{chunk_id}}:["\']([0-9a-f]+)["\']'
# format 后 → [,{59924}]{chunk_id}:...   ← 永远不匹配
```

**正确写法：**
```python
ON_DEMAND_HASH_PATTERN = r'[,{{]{chunk_id}:["\']([0-9a-f]+)["\']'
# format 后 → [,{]59924:["'](...)        ← 正确匹配
```

> **规则：** Python `str.format()` 中，`{{` → `{`，`}}` → `}`，`{name}` → 被替换

---

## 六、快速调试流程

### 1. 验证 TID 结构
```javascript
const buf = Buffer.from(tid, 'base64');
assert(buf.length === 70);
const K = buf[0];
const version = buf[69] ^ K;
assert(version === 0x03);
const timeNow = (buf[49]^K) | ((buf[50]^K)<<8) | ((buf[51]^K)<<16) | ((buf[52]^K)<<24);
const recoveredTs = timeNow + 1682924400;
console.log('timeDiff:', recoveredTs - Math.floor(Date.now()/1000), 'seconds');  // 应 < 5
```

### 2. 验证 animationKey
```python
# 用已知测试向量
from twikit.x_client_transaction.transaction import ClientTransaction
ct = ClientTransaction.__new__(ClientTransaction)
# 对比 Python 和 JS 计算结果是否一致
```

### 3. 验证 Bundle 查找
```python
import re, requests
html = requests.get('https://x.com/').text
m = re.search(r'[,{](\d+):["\']ondemand\.s["\']', html)
print('chunk_id:', m.group(1))
pattern = r'[,{{]{chunk_id}:["\']([0-9a-f]+)["\']'.format(chunk_id=m.group(1))
print('pattern:', pattern)  # 检查展开是否正确
```

---

## 七、测试向量

### 已验证的 E2E 测试向量

| 参数 | 值 |
|---|---|
| `nowMs` | `5000000`（5000秒） |
| `randomVal` | `0.5`（K = 0x80） |
| `animationKey` | `53e4ea1007ae147ae147ae007ae147ae147ae100` |
| `keyBytes` (base64) | `ECGgWEk3fy8f+kO2C66gUIUlLLE8Qbq5Be8Yr6zr5rUjlzbmm56ZgpvtsnFIQrhX` |

| method | path | 期望 TID |
|---|---|---|
| GET | `/a` | `gJChINjJt/+vn3rDNosuINAFpawxvME6OYVvmC8sa2Y1oxe2ZhseGQIbbTLxyMI415gwMBuFBPaojccVUO9m5FMG1FTIgw` |
| POST | `/i/api/1.1/friends/following/list.json` | `gJChINjJt/+vn3rDNosuINAFpawxvME6OYVvmC8sa2Y1oxe2ZhseGQIbbTLxyMI415gwMBsrCD2GHQzBvx5lBpSGf56ygw` |

### LE32 时间戳验证（Bug 1）

| testMs | timeNow | 期望字节（bytes[49..52] XOR K） |
|---|---|---|
| `1704067200000`（2024-01-01） | `21142800 = 0x01429D10` | `[0x10, 0x9D, 0x42, 0x01]` |

### animationKey 验证（Bug 2）

| META (base64) | rowIndex | keyBytesIndices | 期望 animationKey |
|---|---|---|---|
| `HxeAUy2o24jRiWwIOir8sbm6...` | 15 | [26, 43, 38] | `8066f100100` |

---

## 八、相关文件

| 文件 | 说明 |
|---|---|
| `contrib/js/x_tid_generator.js` | 完整 JS 实现（含自测，`node x_tid_generator.js`） |
| `twikit/x_client_transaction/transaction.py` | Python 实现 |
| `X_TID_SOP.md` | 当前维护说明 |

---

## 九、已知限制

- `keyBytes` 和 SVG 帧数据来自 x.com HTML，**每次 X 更新 bundle 时可能变化**
- `ondemand.s` 的 chunk_id 和 hash **随 bundle 版本变化**，需实时获取
- 如果 X 修改 animationKey 计算逻辑，需重新逆向 `get_animation_key()` 函数
