# got-schedule-tracker
Automatic G.O.T Games weekly schedule tracker

## What this site does
- Tracks the weekly G.O.T Games schedule from Discord and updates the site automatically.
- Parses the posted schedule image into structured event data for the agenda view.
- Shows live stream status for Twitch/Rumble and publishes it to the site.
- Hosts a fanbase directory and player profiles for the community.
- Provides anime search and browser-local favorites using the public AniList GraphQL API.

## Main pages
- `index.html` — weekly schedule, live status, account login, and general navigation
- `player-directory.html` — searchable community directory and staff/member lists
- `profile.html` — public profile card with editable bio, links, and avatar/banner upload
- `anime.html` — anime catalog search, pagination, and locally saved favorites

## Anime feature
Open `anime.html` to search the AniList anime catalog and save favorites. No API key is required; favorites are stored in the browser's local storage and do not sync between devices.

## Local preview
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in a browser.

## GitHub automation
The repository includes scheduled GitHub Actions workflows that:
- fetch the latest schedule image from Discord
- OCR the image into structured schedule data
- update the public schedule JSON
- check Twitch/Rumble live status and write `live.json`

### Discord setup and recovery

Use a dedicated announcement or following channel. Set the repository's Actions secrets
`DISCORD_BOT_TOKEN` and `DISCORD_CHANNEL_ID`; allow the bot to view the channel and read its history.
If history is readable but attachments are missing, check Discord's Message Content setting in
the Developer Portal and confirm that the latest flyer actually arrived in the configured channel.
On a channel that also accepts normal posts, set the optional Actions variable
`DISCORD_TRUSTED_AUTHOR_IDS` to a comma-separated list of approved Discord user IDs to restrict
ordinary direct posts. Forwarded or webhook posts are accepted from the configured channel.

Run **Update schedule** manually with **dry_run** enabled first. Enter **message_id** to validate one
specific Discord post instead of scanning the channel. Enable **reparse** instead to validate the
checked-in flyer without Discord. No candidate or duplicate content is a no-op. A candidate with
unreadable dates, timezone, weekday labels or rows does not replace the existing schedule. An OCR
failure that needs correction is visible in the workflow log. The Actions cron is best-effort
and may run later than requested.

If the upstream flyer does not arrive in Discord, use the actual original flyer and its timezone-aware
posting timestamp. Review the parsed output using `python3 Script/parse_schedule.py` for the checked-in
flyer, or use the local recovery command below. Never substitute a guessed schedule.

```bash
python3 -m unittest discover -s Script -p 'test_*.py'
python3 Script/fetch_schedule.py --reparse --dry-run
python3 Script/fetch_schedule.py --local-image /path/to/original.png --posted 'ISO-8601 timestamp with offset' --dry-run
```

Pillow and Tesseract are required. Once verified, omit `--dry-run` and review the staged data before
committing. `schedule.json`, the archive, image and ingestion state must travel in the same commit.
The public site checks GitHub's published branch data alongside Pages so bot commits can reach
the calendar even when a Pages rebuild is delayed. Older archive weeks don't show the current
flyer in place of a missing historical image.

## Notes
This is an unofficial fan-made site and is intentionally focused on schedule tracking, community profiles, live stream awareness, and anime discovery.
