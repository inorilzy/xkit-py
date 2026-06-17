# XKit for Python

[![GitHub stars](https://img.shields.io/github/stars/inorilzy/xkit-py)](https://github.com/inorilzy/xkit-py)
[![PyPI version](https://img.shields.io/pypi/v/xkit-py?label=PyPI)](https://pypi.org/project/xkit-py/)
[![License](https://img.shields.io/github/license/inorilzy/xkit-py)](LICENSE)

> A maintained Twitter/X Web API Python client — no official Developer API key required.

[中文](README.md) | [English](README.en.md) | [日本語](README-ja.md)

## What it is for

- Search, read, post, or interact with Twitter/X from Python without paying for the official API.
- Read search results, timelines, tweet text, threads, trends, DMs, and media.
- Reuse login state across MCP servers, agent tools, or local scripts.

Not suitable for:

- Production systems requiring SLA, compliance audits, or stable commercial interfaces.
- High-frequency scraping or violating Twitter/X terms of service.

## Installation

```bash
pip install xkit-py
```

New projects are recommended to use `xkit` import paths:

```python
from xkit import Client
```

Old code using `twikit` import paths is still supported:

```python
from twikit import Client
```

## Quick Start

### Login

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

asyncio.run(main())
```

`cookies_file` saves cookies after a successful login; on subsequent runs the saved cookies are reused.

For more examples see the [examples directory](examples).

## Authentication

Store and reuse cookies:

```python
await client.login(
    auth_info_1=USERNAME,
    auth_info_2=EMAIL,
    password=PASSWORD,
    cookies_file="cookies.json",
)
```

`cookies.json` is equivalent to account credentials. Do not commit it to Git or share it in issues, logs, or chat tools.

## Security Notes

This project uses Twitter/X Web endpoints. High-frequency requests, unusual automation patterns, or unstable account environments may trigger rate limits, verification challenges, temporary locks, or account risks.

Read [ToProtectYourAccount.md](ToProtectYourAccount.md) before automating.

## Troubleshooting

### Login fails

Check whether the account needs browser verification, 2FA, or a security challenge. If `cookies.json` already exists, delete it and re-login.

### Search or timeline suddenly stops working

Twitter/X frequently changes Web API, GraphQL query IDs, and response shapes. Upgrade to the latest version and check relevant issues.

### Why low frequency is recommended

This library uses Web endpoints, not the official Developer API. High frequency is more likely to trigger rate limits, verification, or account flags.

## Documentation

- [MAINTENANCE_NOTES.md](MAINTENANCE_NOTES.md)
- [X_TID_SOP.md](X_TID_SOP.md)

## Compatibility

Both `xkit` and `twikit` import paths are available:

```python
from xkit import Client   # recommended
from twikit import Client # legacy
```

## Credits and License

Derived from [d60/twikit](https://github.com/d60/twikit), originally licensed under MIT. See [LICENSE](LICENSE).

## Contributing

Bug reports, compatibility fixes, and pull requests are welcome via [issues](https://github.com/inorilzy/xkit-py/issues).
