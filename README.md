# got-schedule-tracker
Automatic G.O.T. Games weekly schedule tracker

## What this site does
- Tracks the weekly G.O.T. Games schedule from Discord and updates the site automatically.
- Parses the posted schedule image into structured event data for the agenda view.
- Shows live stream status for Twitch/Rumble and publishes it to the site.
- Hosts a fanbase directory and player profiles for the community.

## Main pages
- `index.html` — weekly schedule, live status, account login, and general navigation
- `player-directory.html` — searchable community directory and staff/member lists
- `profile.html` — public profile card with editable bio, links, and avatar/banner upload

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

## Notes
This is an unofficial fan-made site and is intentionally focused on schedule tracking, community profiles, and live stream awareness.
