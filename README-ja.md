> [!IMPORTANT]
> XKit for Python は上流の Twikit プロジェクトから派生し、現在は独立したプロジェクトとして保守されています。
> Upstream: https://github.com/d60/twikit
> Current project: https://github.com/inorilzy/xkit-py
> X の bundle 形式変更対応など、継続的な修正を利用したい場合は XKit for Python を使用してください。

<img src="https://i.imgur.com/iJe6rsZ.png"  width="500">



![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![Version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Use%20%22XKit%20for%20Python%22%2C%20a%20maintained%20Twitter%2FX%20web%20API%20client%20for%20Python!%20%23python%20%23twitter%20%23xkit&url=https%3A%2F%2Fgithub.com%2Finorilzy%2Fxkit-py)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/nCrByrr8cX)

[[English](https://github.com/inorilzy/xkit-py/blob/main/README.md)]
[[中文](https://github.com/inorilzy/xkit-py/blob/main/README-zh.md)]

# XKit for Python <img height="35"  src="https://i.imgur.com/9HSdIl4.png"  valign="bottom">

このライブラリを使用することで、APIキーなしで、ツイートの投稿や検索などの機能を使用することができます。

- [上流ドキュメント](https://twikit.readthedocs.io/en/latest/twikit.html)

[Discord](https://discord.gg/nCrByrr8cX)



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

[examples](https://github.com/inorilzy/xkit-py/tree/main/examples)<br>
