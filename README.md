> [!NOTE]
> https://github.com/d60/twitter_login (under development)

> [!IMPORTANT]
> X-Kit is derived from the upstream Twikit project and is now maintained as an independent project.
> Upstream: https://github.com/d60/twikit
> Current project: https://github.com/inorilzy/x-kit
> If you are looking for actively maintained fixes (for example X bundle format changes), use X-Kit.

<img src="https://i.imgur.com/iJe6rsZ.png"  width="500">



![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/x-kit)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/x-kit)
![Version](https://img.shields.io/pypi/v/xkit?label=PyPI)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Use%20%22X-Kit%22%2C%20a%20maintained%20Twitter%2FX%20web%20API%20client%20for%20Python!%20%23python%20%23twitter%20%23xkit&url=https%3A%2F%2Fgithub.com%2Finorilzy%2Fx-kit)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/nCrByrr8cX)

[[日本語](https://github.com/inorilzy/x-kit/blob/main/README-ja.md)]
[[中文](https://github.com/inorilzy/x-kit/blob/main/README-zh.md)]


# X-Kit <img height="35"  src="https://i.imgur.com/9HSdIl4.png"  valign="bottom">

A Simple Twitter API Scraper

You can use functions such as posting or searching for tweets without an API key using this library.

- [Upstream documentation (English)](https://twikit.readthedocs.io/en/latest/twikit.html)


🔵 [Discord](https://discord.gg/nCrByrr8cX)

> [!NOTE]
> Released twikit_grok an extension for using Grok AI with Twikit.  
> For more details, visit: https://github.com/d60/twikit_grok.




## Features

### No API Key Required

This library uses scraping and does not require an API key.

### Free

This library is free to use.


## Functionality

By using Twikit, you can access functionalities such as the following:

-  Create tweets

-  Search tweets

-  Retrieve trending topics

- etc...



## Installing

```bash

pip install xkit

```

The distribution name is `xkit`; use the `xkit` import path for new code:

```python
from xkit import Client
```

The legacy upstream-compatible import path is still available for existing code:

```python
from twikit import Client
```


## Quick Example

**Define a client and log in to the account.**

```python
import asyncio
from xkit import Client

USERNAME = 'example_user'
EMAIL = 'email@example.com'
PASSWORD = 'password0000'

# Initialize client
client = Client('en-US')

async def main():
    await client.login(
        auth_info_1=USERNAME,
        auth_info_2=EMAIL,
        password=PASSWORD,
        cookies_file='cookies.json'
    )

asyncio.run(main())
```

**Create a tweet with media attached.**

```python
# Upload media files and obtain media_ids
media_ids = [
    await client.upload_media('media1.jpg'),
    await client.upload_media('media2.jpg')
]

# Create a tweet with the provided text and attached media
await client.create_tweet(
    text='Example Tweet',
    media_ids=media_ids
)

```

**Search the latest tweets based on a keyword**
```python
tweets = await client.search_tweet('python', 'Latest')

for tweet in tweets:
    print(
        tweet.user.name,
        tweet.text,
        tweet.created_at
    )
```

**Retrieve user tweets**
```python
tweets = await client.get_user_tweets('123456', 'Tweets')

for tweet in tweets:
    print(tweet.text)
```

**Send a dm**
```python
await client.send_dm('123456789', 'Hello')
```

**Get trends**
```python
await client.get_trends('trending')
```

More Examples: [examples](https://github.com/inorilzy/x-kit/tree/main/examples) <br>

## Contributing

If you encounter any bugs or issues with X-Kit, please report them on [issues](https://github.com/inorilzy/x-kit/issues).


If you find this library useful, consider starring this repository⭐️
