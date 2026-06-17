# XKit for Python

![GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![PyPI version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)
![License](https://img.shields.io/github/license/inorilzy/xkit-py)

XKit for Python 是一个持续维护的 Twitter/X Web API Python 客户端。

它可以在没有官方 Developer API Key 的情况下，使用常见的 Twitter/X Web 功能，例如登录、搜索、读取推文正文、时间线、趋势、私信和媒体处理。

## 适用场景

- 需要在 Python 中调用 Twitter/X Web 端功能，但不想依赖付费官方 API。
- 需要读取搜索结果、时间线、推文正文、长文、趋势、私信或媒体。
- 需要在 MCP server、agent 工具或本地自动化脚本中复用 Twitter/X 登录态。

不适合：

- 需要官方 SLA、合规审计或稳定商业接口的生产系统。
- 高频批量采集、绕过平台限制或违反 Twitter/X 条款的用途。

## 为什么维护这个项目

Twitter/X 的 Web API、GraphQL query ID、前端 bundle 格式、transaction ID 逻辑和返回结构经常变化。XKit for Python 的目标是把这些常用流程继续维护到可用状态。

近期维护内容包括：

- 更新当前 X bundle 格式下的 `ondemand.s` 查找逻辑。
- 更新 SearchTimeline query ID、variables 和 feature flags。
- 增强 user、tweet、trend、cursor 等返回结构的兼容解析。
- 为 `429` 限流处理增加递归保护。
- 支持登录和 onboarding 流程中的 Castle Token。
- 增加 X client transaction ID 生成逻辑的 JavaScript 参考实现。

## 安装

```bash
pip install xkit-py
```

新项目推荐使用 `xkit` import 路径：

```python
from xkit import Client
```

为了兼容旧代码，`twikit` import 路径仍然可用：

```python
from twikit import Client
```

## Authentication

推荐把登录得到的 cookies 保存到本地文件，并在后续运行中复用：

```python
await client.login(
    auth_info_1=USERNAME,
    auth_info_2=EMAIL,
    password=PASSWORD,
    cookies_file="cookies.json",
)
```

`cookies.json` 等价于账号凭据，不要提交到 Git，也不要贴到 issue、日志或聊天工具里。

## 快速开始

### 登录

```python
import asyncio
from xkit import Client

USERNAME = "example_user"
EMAIL = "email@example.com"
PASSWORD = "password0000"

client = Client("zh-CN")

async def main():
    await client.login(
        auth_info_1=USERNAME,
        auth_info_2=EMAIL,
        password=PASSWORD,
        cookies_file="cookies.json",
    )

asyncio.run(main())
```

`cookies_file` 会在登录成功后保存 cookie；下次文件存在时会优先加载 cookie，减少重复登录。

### 搜索

```python
import asyncio
from xkit import Client

client = Client("zh-CN")

async def main():
    await client.login(
        auth_info_1="example_user",
        auth_info_2="email@example.com",
        password="password0000",
        cookies_file="cookies.json",
    )

    tweets = await client.search_tweet("python", "Latest", count=20)

    for tweet in tweets:
        print(tweet.id, tweet.user.name, tweet.full_text)

    more_tweets = await tweets.next()
    for tweet in more_tweets:
        print(tweet.id, tweet.full_text)

asyncio.run(main())
```

`search_tweet` 的第二个参数支持：

- `Top`
- `Latest`
- `Media`

### 获取正文

```python
import asyncio
from xkit import Client

client = Client("zh-CN")

async def main():
    await client.login(
        auth_info_1="example_user",
        auth_info_2="email@example.com",
        password="password0000",
        cookies_file="cookies.json",
    )

    tweet = await client.get_tweet_by_id("1234567890123456789")

    print(tweet.id)
    print(tweet.user.screen_name)
    print(tweet.full_text)

asyncio.run(main())
```

读取推文正文时，优先使用 `tweet.full_text`。它会兼容普通推文和长文内容；只需要普通字段时也可以使用 `tweet.text`。

## 安全提醒

本项目使用 Twitter/X Web 端点。过高频率请求、异常自动化行为、账号环境不稳定等情况，都可能触发限流、验证、临时锁定或账号风险。

自动化使用前建议阅读 [ToProtectYourAccount.md](ToProtectYourAccount.md)。

## Troubleshooting

### 登录失败怎么办？

先确认账号是否需要浏览器验证、二次验证或安全挑战。已有 `cookies.json` 时，可以删除后重新登录生成。

### 搜索或时间线突然不可用怎么办？

Twitter/X 会频繁调整 Web API、GraphQL query ID 和返回结构。请先升级到最新版本，再确认是否有相关 issue 或维护说明。

### 为什么建议低频使用？

这个库走的是 Web 端行为，不是官方 Developer API。高频请求更容易触发限流、验证或账号风控。

## 文档

XKit for Python 维护说明：

- [MAINTENANCE_NOTES.md](MAINTENANCE_NOTES.md)
- [X_TID_SOP.md](X_TID_SOP.md)

## 兼容性

当前项目仍保留原来的 `twikit` 实现包，并额外暴露新的 `xkit` 公开 import 路径。

新代码推荐：

```python
from xkit import Client
```

旧代码仍可继续使用：

```python
from twikit import Client
```

## Credits and License

XKit for Python derived from [d60/twikit](https://github.com/d60/twikit), originally licensed under the MIT License.

The original copyright notice required by the MIT License is preserved in [LICENSE](LICENSE).

## 贡献

欢迎在 [issues](https://github.com/inorilzy/xkit-py/issues) 提交 bug report、兼容性问题和修复 PR。
