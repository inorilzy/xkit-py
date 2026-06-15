# XKit for Python

![GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![PyPI version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)
![License](https://img.shields.io/github/license/inorilzy/xkit-py)

XKit for Python 是一个持续维护的 Twitter/X Web API Python 客户端。

它可以在没有官方 Developer API Key 的情况下，使用常见的 Twitter/X Web 功能，例如登录、搜索、读取推文正文、时间线、趋势、私信和媒体处理。

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

自动化使用前建议阅读 [ToProtectYourAccount.md](https://github.com/inorilzy/xkit-py/blob/main/ToProtectYourAccount.md)。

## 文档

继承的 API 表面仍可参考上游文档：

- [Upstream Twikit documentation](https://twikit.readthedocs.io/en/latest/twikit.html)

XKit for Python 维护说明：

- [MAINTENANCE_NOTES.md](https://github.com/inorilzy/xkit-py/blob/main/MAINTENANCE_NOTES.md)
- [X_TID_SOP.md](https://github.com/inorilzy/xkit-py/blob/main/X_TID_SOP.md)

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

The original copyright notice and MIT License are preserved in [LICENSE](https://github.com/inorilzy/xkit-py/blob/main/LICENSE).

## 贡献

欢迎在 [issues](https://github.com/inorilzy/xkit-py/issues) 提交 bug report、兼容性问题和修复 PR。
