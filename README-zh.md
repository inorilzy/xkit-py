> [!IMPORTANT]
> XKit for Python 源自上游 Twikit 项目，现在作为独立项目维护。
> 上游仓库：https://github.com/d60/twikit
> 当前项目：https://github.com/inorilzy/xkit-py
> 如果你希望使用包含最新修复（例如 X bundle 格式变更修复）的版本，请优先使用 XKit for Python。

<img src="https://i.imgur.com/iJe6rsZ.png"  width="500">



![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![Version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Use%20%22XKit%20for%20Python%22%2C%20a%20maintained%20Twitter%2FX%20web%20API%20client%20for%20Python!%20%23python%20%23twitter%20%23xkit&url=https%3A%2F%2Fgithub.com%2Finorilzy%2Fxkit-py)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/nCrByrr8cX)

[[English](https://github.com/inorilzy/xkit-py/blob/main/README.md)]
[[日本語](https://github.com/inorilzy/xkit-py/blob/main/README-ja.md)]

# XKit for Python <img height="35"  src="https://i.imgur.com/9HSdIl4.png"  valign="bottom">

一个简单的爬取 Twitter API 的客户端。

本库提供的函数允许你进行对推特的操作，如发布或搜索推文，并且无需开发者 API 密钥。

- [上游文档（英文）](https://twikit.readthedocs.io/en/latest/twikit.html)

[Discord 服务器](https://discord.gg/nCrByrr8cX)



## 特性

### 无需开发者 API 密钥

本库直接爬取推特的公共 API 进行请求，无需申请官方开发者密钥。

### 免费

本库无需付费。


## 功能

使用 Twikit，你可以：

-  创建推文

-  搜索推文

-  检索热门话题

- 等等...



## 安装

```bash

pip install xkit-py

```

发布包名是 `xkit`，新代码请使用 `xkit` import 路径：

```python
from xkit import Client
```

旧的上游兼容 import 路径仍然可用：

```python
from twikit import Client
```

## 使用样例

**定义一个客户端并登录**

```python
import asyncio
from xkit import Client

USERNAME = 'example_user'
EMAIL = 'email@example.com'
PASSWORD = 'password0000'

# 初始化客户端
client = Client('en-US')

async def main():
    await client.login(
        auth_info_1=USERNAME ,
        auth_info_2=EMAIL,
        password=PASSWORD
    )

asyncio.run(main())
```

**创建一条附带媒体的推文**

```python
# 上传媒体文件并获取媒体ID
media_ids = [
    await client.upload_media('media1.jpg'),
    await client.upload_media('media2.jpg')
]

# 创建一条带有提供的文本和附加媒体的推文
await client.create_tweet(
    text='Example Tweet',
    media_ids=media_ids
)

```

**搜索推文**
```python
tweets = await client.search_tweet('python', 'Latest')

for tweet in tweets:
    print(
        tweet.user.name,
        tweet.text,
        tweet.created_at
    )
```

**检索用户的推文**
```python
tweets = await client.get_user_tweets('123456', 'Tweet')

for tweet in tweets:
    print(tweet.text)
```

**获取趋势**
```python
await client.get_trends('trending')
```

[更多样例...](https://github.com/inorilzy/xkit-py/tree/main/examples)<br>
