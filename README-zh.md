# XKit for Python

![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![Version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)

[[English](README.md)]
[[日本語](README-ja.md)]

一个持续维护的 Twitter/X Web API Python 客户端。

本库提供的函数允许你进行对 Twitter/X 的操作，如发布或搜索推文，并且无需开发者 API 密钥。

## 特性

### 无需开发者 API 密钥

本库直接爬取推特的公共 API 进行请求，无需申请官方开发者密钥。

### 免费

本库无需付费。


## 功能

使用 XKit for Python，你可以：

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

[更多样例...](examples)<br>
