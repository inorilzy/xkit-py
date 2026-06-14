> [!IMPORTANT]
> このリポジトリは上流プロジェクトのメンテナンス fork（maintained fork）です。
> Upstream: https://github.com/d60/twikit
> Maintained fork: https://github.com/inorilzy/twikit-ng
> X の bundle 形式変更対応など、継続的な修正を利用したい場合はこの fork を使用してください。

<img src="https://i.imgur.com/iJe6rsZ.png"  width="500">



![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/twikit-ng)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/twikit-ng)
![Version](https://img.shields.io/pypi/v/twikit-ng?label=PyPI)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Use%20%22Twikit-NG%22%2C%20a%20maintained%20Twikit%20fork%20for%20Twitter%2FX%20automation!%20%23python%20%23twitter%20%23twikit&url=https%3A%2F%2Fgithub.com%2Finorilzy%2Ftwikit-ng)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/nCrByrr8cX)

[[English](https://github.com/inorilzy/twikit-ng/blob/main/README.md)]
[[中文](https://github.com/inorilzy/twikit-ng/blob/main/README-zh.md)]

# Twikit-NG <img height="35"  src="https://i.imgur.com/9HSdIl4.png"  valign="bottom">

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

pip install twikit-ng

```

配布パッケージ名は `twikit-ng` です。Python の import パスは上流互換のままです。

```python
from twikit import Client
```


## 使用例

**クライアントを初期化し、アカウントにログインする。**

```python
import asyncio
from twikit import Client

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

[examples](https://github.com/inorilzy/twikit-ng/tree/main/examples)<br>
