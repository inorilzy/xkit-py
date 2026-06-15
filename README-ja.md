# XKit for Python

![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![Version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)

[[English](README.md)]
[[中文](README-zh.md)]

このライブラリを使用することで、APIキーなしで、Twitter/X の投稿や検索などの機能を使用することができます。

## 特徴

### APIキー不要

このライブラリは、ツイッターの非公式APIを使用しているため、APIキーは必要ありません。

### 無料

このライブラリは、無料で使用することができます。


## 機能

このライブラリを使用することで、

-  ツイートの投稿

-  ツイートの検索

-  トレンドの取得

などのさまざまな機能を使用することができます。



## インストール

```bash

pip install xkit-py

```

配布パッケージ名は `xkit` です。新しいコードでは `xkit` import パスを使用してください。

```python
from xkit import Client
```

従来の上流互換 import パスも既存コード向けに利用できます。

```python
from twikit import Client
```

## 使用例

**クライアントを初期化し、アカウントにログインする。**

```python
import asyncio
from xkit import Client

USERNAME = 'example_user'
EMAIL = 'email@example.com'
PASSWORD = 'password0000'

# Initialize client
client = Client('en-US')

async def main():
    # アカウントにログイン
    await client.login(
        auth_info_1=USERNAME ,
        auth_info_2=EMAIL,
        password=PASSWORD
    )

asyncio.run(main())
```

**メディア付きツイートを作成する。**

```python
# メディアをアップロードし、メディアIDを取得する。
media_ids = [
    await client.upload_media('media1.jpg'),
    await client.upload_media('media2.jpg')
]

# ツイートを投稿する
await client.create_tweet(
    text='Example Tweet',
    media_ids=media_ids
)

```

**ツイートを検索する**
```python
tweets = await client.search_tweet('python', 'Latest')

for tweet in tweets:
    print(
        tweet.user.name,
        tweet.text,
        tweet.created_at
    )
```

**ユーザーのツイートを取得する**
```python
tweets = await client.get_user_tweets('123456', 'Tweet')

for tweet in tweets:
    print(tweet.text)
```

**トレンドを取得する**
```python
await client.get_trends('trending')
```

[examples](examples)<br>
