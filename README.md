# XKit for Python

![GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/inorilzy/xkit-py)
![PyPI version](https://img.shields.io/pypi/v/xkit?label=PyPI)
![License](https://img.shields.io/github/license/inorilzy/xkit-py)

XKit for Python is a maintained Twitter/X web API client. It supports common Twitter/X actions such as login, posting, searching, timelines, trends, DMs, and media handling without an official developer API key.

## Why XKit

Twitter/X keeps changing its web API, GraphQL query IDs, bundle formats, transaction ID logic, and response shapes. XKit focuses on keeping these workflows usable with active fixes for current Twitter/X behavior.

Recent maintenance work includes:

- Updated `ondemand.s` webpack bundle lookup for current X bundle formats.
- Refreshed SearchTimeline query ID, variables, and feature flags.
- Defensive parsing for changed user, tweet, trend, and cursor payloads.
- Rate-limit recursion guard for safer `429` handling.
- Castle Token support for login and onboarding flows.
- A JavaScript reference implementation for X client transaction ID generation.

## Installation

```bash
pip install xkit
```

Use the `xkit` import path for new code:

```python
from xkit import Client
```

The upstream-compatible `twikit` import path is still available for existing code:

```python
from twikit import Client
```

## Quick Start

```python
import asyncio
from xkit import Client

USERNAME = "example_user"
EMAIL = "email@example.com"
PASSWORD = "password0000"

client = Client("en-US")

async def main():
    await client.login(
        auth_info_1=USERNAME,
        auth_info_2=EMAIL,
        password=PASSWORD,
        cookies_file="cookies.json",
    )

    tweets = await client.search_tweet("python", "Latest")
    for tweet in tweets:
        print(tweet.user.name, tweet.text, tweet.created_at)

asyncio.run(main())
```

## Common Tasks

Create a tweet:

```python
await client.create_tweet(text="Hello from XKit")
```

Create a tweet with media:

```python
media_ids = [
    await client.upload_media("media1.jpg"),
    await client.upload_media("media2.jpg"),
]

await client.create_tweet(
    text="Example tweet",
    media_ids=media_ids,
)
```

Get user tweets:

```python
tweets = await client.get_user_tweets("123456", "Tweets")

for tweet in tweets:
    print(tweet.text)
```

Send a DM:

```python
await client.send_dm("123456789", "Hello")
```

Get trends:

```python
await client.get_trends("trending")
```

More examples are available in [examples](https://github.com/inorilzy/xkit-py/tree/main/examples).

## Compatibility

XKit currently keeps the original `twikit` package as the implementation package and exposes `xkit` as the new public import path. This keeps old code working while giving new projects a clean package name.

Recommended for new code:

```python
from xkit import Client
```

Still supported for compatibility:

```python
from twikit import Client
```

## Safety

This library uses Twitter/X web endpoints. Sending too many requests, automating suspicious actions, or using poor account hygiene may trigger rate limits, verification challenges, temporary locks, or account suspension.

Read [ToProtectYourAccount.md](https://github.com/inorilzy/xkit-py/blob/main/ToProtectYourAccount.md) before using automation-heavy workflows.

## Documentation

The upstream API documentation is still useful for the inherited API surface:

- [Upstream Twikit documentation](https://twikit.readthedocs.io/en/latest/twikit.html)

XKit-specific maintenance notes:

- [MAINTENANCE_NOTES.md](https://github.com/inorilzy/xkit-py/blob/main/MAINTENANCE_NOTES.md)
- [X_TID_SOP.md](https://github.com/inorilzy/xkit-py/blob/main/X_TID_SOP.md)

## Credits and License

XKit for Python is derived from [d60/twikit](https://github.com/d60/twikit), originally licensed under the MIT License.

The original copyright notice and MIT License are preserved in [LICENSE](https://github.com/inorilzy/xkit-py/blob/main/LICENSE).

## Contributing

Bug reports and fixes are welcome in [issues](https://github.com/inorilzy/xkit-py/issues).
