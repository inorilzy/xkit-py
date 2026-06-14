> [!NOTE]
> https://github.com/d60/twitter_login (under development)

> [!IMPORTANT]
> This repository is a maintained fork of the upstream project.
> Upstream: https://github.com/d60/twikit
> Maintained fork: https://github.com/inorilzy/twikit-ng
> If you are looking for actively maintained fixes (for example X bundle format changes), use this fork.

<img src="https://i.imgur.com/iJe6rsZ.png"  width="500">



![Number of GitHub stars](https://img.shields.io/github/stars/inorilzy/twikit-ng)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/twikit-ng)
![Version](https://img.shields.io/pypi/v/twikit-ng?label=PyPI)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=Use%20%22Twikit-NG%22%2C%20a%20maintained%20Twikit%20fork%20for%20Twitter%2FX%20automation!%20%23python%20%23twitter%20%23twikit&url=https%3A%2F%2Fgithub.com%2Finorilzy%2Ftwikit-ng)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/nCrByrr8cX)

[[日本語](https://github.com/inorilzy/twikit-ng/blob/main/README-ja.md)]
[[中文](https://github.com/inorilzy/twikit-ng/blob/main/README-zh.md)]


# Twikit-NG <img height="35"  src="https://i.imgur.com/9HSdIl4.png"  valign="bottom">

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

pip install twikit-ng

```

The distribution name is `twikit-ng`; the Python import path remains compatible with upstream:

```python
from twikit import Client
```



## Quick Example

**Define a client and log in to the account.**

```python
import asyncio
from twikit import Client

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

More Examples: [examples](https://github.com/inorilzy/twikit-ng/tree/main/examples) <br>

## Contributing

If you encounter any bugs or issues with this maintained fork, please report them on [issues](https://github.com/inorilzy/twikit-ng/issues).


If you find this library useful, consider starring this repository⭐️
