# inorilzy/xkit-py — Upstream PR & Issue Triage

Fork base: `d60/twikit` v2.4.0
Current project version: **v2.6.2** (prepared for PyPI as `xkit-py`)

## Pull Requests Ported

### ✅ Cherry-picked cleanly
| Upstream PR | Description |
|---|---|
| #334 | (small fix) |
| #365 | (small fix) |
| #308 | (small fix) |
| #369 | (small fix) |
| #337 | (small fix) |
| #340 | (small fix) |
| #393 | Castle Token support for login |
| #418 / #419 | Defensive `.get()` for `User.__init__` + error response parsing |

### 🔧 Manually ported (conflicts resolved)
| Upstream PR | Reason for conflict |
|---|---|
| #284 — Non-interactive login (`input_for_login=False`) | Login signature already extended by `enable_ui_metrics` (PR #340) |
| #367 — `Client.get_user_mentions(handle, search_count)` | Net-new method; inserted before `search_user` |
| #383 — `User.notifications` field | User.__init__ already rewritten by PR #418 to defensive `.get()` |
| #390 — `get_trends` rewritten for new `GenericTimelineById` GQL endpoint | Both legacy v11.guide path and new path are kept (forward/backward compat). Trend class accepts both snake_case and camelCase payloads. |

### ⏭ Already covered (no port needed)
- #341, #377, #405 — equivalent fixes already present after #418/#419 merges

### ❌ Skipped (stale / duplicates / docs / features beyond scope)
- #290 (16-month-old, superseded endpoint hashes)
- #410, #411, #412 — all duplicates of the same `ON_DEMAND_FILE_REGEX` fix, which our base already includes
- #324, #386, #398, #427 — docs / non-actionable
- #407 — defensive fallbacks for `transaction.py`; our atomic-init rewrite already covers the failure modes

## Issue Triage (132 open upstream issues)

### ✅ Already fixed in this fork
| Issue | How it's fixed |
|---|---|
| #417 — `KeyError` in `User.__init__` / `Client.request` | PR #418 (cherry-picked) |
| #425 — `KeyError: 'pinned_tweet_ids_str'` since Apr 2026 | PR #418 (cherry-picked) |
| #420 — `urls` / `pinned_tweet_ids_str` / `withheld_in_countries` KeyError | PR #418 (cherry-picked) |
| #350 — `KeyError: 'legacy'` in `get_latest_timeline` | PR #418 defensive parsing |
| #408 / #409 — `Couldn't get KEY_BYTE indices` / `ClientTransaction` broken (Mar 2026) | New 2-step chunk-id regex + atomic `init()` already in base |
| #304 — `ClientTransaction has no attribute 'key'` | Atomic `init()` resets partial state on failure |
| #332 — `KeyError: 'itemContent'` in `_get_more_replies` cursor | Defensive cursor parsing already in base |
| #389 — `get_trends` deprecated / empty | PR #390 port (new `GenericTimelineById` endpoint) |

### ❌ Not fixable in client code
| Issue | Reason |
|---|---|
| #402, #385 — `GuestClient` 404 (code 34) | Twitter removed `guest/activate.json` endpoint server-side |
| #413, #392, #311 — `Authorization 226` / "automated activity" | Account/IP heuristic by Twitter |
| #396, #406 — Cloudflare 403 | IP-level block |
| #310, #306, #359 — Account suspended | Server-side enforcement |
| #414, #366, #205 — Login confirmation code interactive prompt | Partially eased by #284 port (non-interactive mode) and #393 (Castle Token) |
| #381 — New IP-based rate limits | Server policy |

### 📝 Feature requests (deferred)
| Issue | |
|---|---|
| #403 — Article type support | New tweet type, large surface |
| #404 — Custom HFT (paid) | Out of scope |
| #117 — Real-time DM notifications | Architectural feature |
| #370 — Sync version restore | Reverts deprecation |
| #373 — `is_following` check | Add-on |
| #349 — Pinned tweets in `get_user_tweets` | API filter behaviour |

### ⚠️ Edge cases (low ROI / would require invasive changes)
- #363 — `KeyError 'value'` in `get_user_tweets`: when account has no tweets/replies the `items[-1]['content']['value']` next-cursor access fails. Defensive fix would require touching ~20+ cursor sites across `client.py`. Deferred — workaround is try/except at call site.
- #335 — `next()` cursor stuck on `get_bookmark_folders`
- #346 — Unexpected record count
- #364 — `count` parameter ignored
- #357 — Latest hashtag tweets empty
- #339 — Intermittent `TwitterException`
- #387 — `TweetNotAvailable: Unspecified`
- #358 — `get_favoriters` always empty
- #376 — `media_url` not source resolution
- #293 — `Event loop is closed` cleanup
- #330 — `proxy` kwarg unsupported (user is on outdated httpx)
- #333 — `_ui_metrix` AttributeError (already removed in our base)
- #352, #380 — Install errors (user-env)

## Downstream

Downstream packages should depend on the maintained PyPI package `xkit-py`.
