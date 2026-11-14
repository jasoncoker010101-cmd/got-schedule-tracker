import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

# Channel accounts
TWITCH_USER = "gotgames_tb"       # Twitch username, without "@"
YOUTUBE_HANDLE = "@GOTGames"      # YouTube handle, with "@"
RUMBLE_CHANNEL_URL = "https://rumble.com/c/GOTGames"
RUMBLE_API_URL = "https://api.api.sh/rumble/v1/live"

# A scheduled Rumble event starts tracking Twitch at its scheduled start.
# Rumble checks begin five minutes later and then run every five minutes.
RUMBLE_FIRST_CHECK_DELAY_MINUTES = 5
RUMBLE_CHECK_INTERVAL_MINUTES = 5

# The API lists live streams 25 at a time. Check one page per workflow run
# to keep API usage predictable; the next page is checked on the next run.
RUMBLE_PAGES_PER_RUN = 1

LIVE_FILE = Path("live.json")
SCHEDULE_FILE = Path("schedule.json")


def utc_now():
    return datetime.now(timezone.utc)


def parse_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def iso_utc(value):
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path, default):
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else default
    except FileNotFoundError:
        return default
    except (OSError, json.JSONDecodeError) as error:
        print(f"Could not read {path}: {error}")
        return default


def request_json(request, timeout=20):
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"HTTP {error.code} {error.reason}: {error_body[:500]}"
        ) from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Network error: {error.reason}") from error

    try:
        result = json.loads(body)
    except json.JSONDecodeError as error:
        raise RuntimeError("The server returned invalid JSON") from error

    if not isinstance(result, dict):
        raise RuntimeError("The server returned an unexpected JSON response")
    return result


def check_twitch():
    """Return ok=False for errors so an API error is never treated as offline."""
    client_id = os.environ.get("TWITCH_CLIENT_ID")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET")

    if not client_id or not client_secret:
        return {
            "ok": False,
            "live": False,
            "error": "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET",
        }

    try:
        token_body = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        }).encode()

        token_request = urllib.request.Request(
            "https://id.twitch.tv/oauth2/token",
            data=token_body,
            method="POST",
        )
        token_data = request_json(token_request)
        access_token = token_data.get("access_token")
        if not access_token:
            raise RuntimeError("Twitch did not return an access token")

        query = urllib.parse.urlencode({"user_login": TWITCH_USER})
        streams_request = urllib.request.Request(
            f"https://api.twitch.tv/helix/streams?{query}",
            headers={
                "Client-Id": client_id,
                "Authorization": f"Bearer {access_token}",
            },
        )
        streams = request_json(streams_request).get("data", [])
        if not isinstance(streams, list):
            raise RuntimeError("Twitch returned an unexpected streams value")

        if streams:
            first_stream = streams[0]
            return {
                "ok": True,
                "live": True,
                "title": first_stream.get("title", ""),
                "url": f"https://www.twitch.tv/{TWITCH_USER}",
            }

        return {
            "ok": True,
            "live": False,
            "url": f"https://www.twitch.tv/{TWITCH_USER}",
        }

    except Exception as error:
        print("Twitch check error:", repr(error))
        return {"ok": False, "live": False, "error": str(error)}


def check_youtube():
    url = f"https://www.youtube.com/{YOUTUBE_HANDLE}/live"

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # YouTube's page markup can change, so this check may need maintenance.
        return {"ok": True, "live": '"isLive":true' in html, "url": url}

    except Exception as error:
        print("YouTube check error:", repr(error))
        return {"ok": False, "live": False, "url": url, "error": str(error)}


def normalized_channel_path(value):
    """Return a comparable Rumble channel path, e.g. /c/gotgames."""
    if not value:
        return ""

    parts = urlsplit(str(value).strip())
    host = (parts.netloc or "").lower().split(":", 1)[0]
    if host not in {"rumble.com", "www.rumble.com"}:
        return ""

    return parts.path.rstrip("/").lower()


def is_target_rumble_stream(stream):
    """Match the stream's nested channel URL to the G.O.T Games channel."""
    channel = stream.get("channel")
    if not isinstance(channel, dict):
        channel = {}

    wanted_path = normalized_channel_path(RUMBLE_CHANNEL_URL)
    returned_path = normalized_channel_path(channel.get("url"))

    if returned_path:
        return returned_path == wanted_path

    # Name fallback is used only when the API did not provide a channel URL.
    channel_name = str(channel.get("name") or "").strip().casefold()
    return channel_name in {"got games", "gotgames"}


def next_page_number(value):
    """Use API.SH's next_page value; wrap to page 1 at the end of the list."""
    if isinstance(value, int) and not isinstance(value, bool) and value >= 1:
        return value
    if isinstance(value, str) and value.isdigit() and int(value) >= 1:
        return int(value)
    return 1


def check_rumble_page(api_key, page):
    """Check one page of live Rumble streams. Each page costs one API credit."""
    query = urllib.parse.urlencode({"page": page})
    request = urllib.request.Request(
        f"{RUMBLE_API_URL}?{query}",
        headers={"x-api-key": api_key, "Accept": "application/json"},
    )

    try:
        result = request_json(request, timeout=30)
        if result.get("success") is False:
            raise RuntimeError(result.get("error") or "API.SH returned success=false")

        streams = result.get("streams")
        if not isinstance(streams, list):
            raise RuntimeError("API.SH response did not contain a streams list")

        following_page = next_page_number(result.get("next_page"))

        for stream in streams:
            if not isinstance(stream, dict):
                continue

            status = str(stream.get("status") or "").strip().lower()
            is_live = bool(stream.get("live")) or status == "live"

            if is_live and is_target_rumble_stream(stream):
                channel = stream.get("channel")
                if not isinstance(channel, dict):
                    channel = {}
                return {
                    "ok": True,
                    "live": True,
                    "title": stream.get("title", ""),
                    "url": stream.get("url", RUMBLE_CHANNEL_URL),
                    "channel_url": channel.get("url", RUMBLE_CHANNEL_URL),
                    "viewers": stream.get("watching_now"),
                    "page_checked": page,
                    "next_page": following_page,
                }

        return {
            "ok": True,
            "live": False,
            "page_checked": page,
            "next_page": following_page,
        }

    except Exception as error:
        print("Rumble check error:", repr(error))
        return {
            "ok": False,
            "live": False,
            "page_checked": page,
            "error": str(error),
        }


def rumble_event_key(event):
    start = event.get("start") or event.get("date") or ""
    title = event.get("title") or ""
    return f"{start}|rumble|{title}"


def active_rumble_event(schedule, now):
    candidates = []
    events = schedule.get("events", [])
    if not isinstance(events, list):
        return None

    ignored_statuses = {
        "predicted", "ended", "complete", "completed", "cancelled", "canceled"
    }

    for event in events:
        if not isinstance(event, dict):
            continue
        if str(event.get("platform") or "").lower() != "rumble":
            continue
        if str(event.get("status") or "").lower() in ignored_statuses:
            continue

        start = parse_datetime(event.get("start") or event.get("date"))
        if start and start <= now:
            candidates.append((start, event))

    if not candidates:
        return None

    return max(candidates, key=lambda item: item[0])[1]


def main():
    now = utc_now()
    previous = read_json(LIVE_FILE, {})
    schedule = read_json(SCHEDULE_FILE, {})
    old_platforms = previous.get("platforms") or {}
    old_session = previous.get("rumble_session") or {}
    if not isinstance(old_platforms, dict):
        old_platforms = {}
    if not isinstance(old_session, dict):
        old_session = {}

    # These are checked on every five-minute GitHub Actions run.
    twitch = check_twitch()
    youtube = check_youtube()

    # Keep the last known website value during an API error, but do not use an
    # errored check as proof that Twitch went offline.
    twitch_live = (
        twitch["live"] if twitch.get("ok")
        else bool(old_platforms.get("twitch", False))
    )
    youtube_live = (
        youtube["live"] if youtube.get("ok")
        else bool(old_platforms.get("youtube", False))
    )

    event = active_rumble_event(schedule, now)
    session = dict(old_session)
    rumble_check = {
        "ok": True,
        "live": False,
        "skipped": "No active scheduled Rumble event",
    }

    if event:
        event_start = parse_datetime(event.get("start") or event.get("date"))
        event_key = rumble_event_key(event)

        # Start a new tracker when a different scheduled Rumble event begins.
        if session.get("event_key") != event_key:
            first_check_at = event_start + timedelta(
                minutes=RUMBLE_FIRST_CHECK_DELAY_MINUTES
            )
            session = {
                "event_key": event_key,
                "title": event.get("title", "Rumble stream"),
                "scheduled_start": iso_utc(event_start),
                "state": "waiting",
                "twitch_seen_live": False,
                "rumble_seen_live": False,
                "rumble_page": 1,
                "next_rumble_check_at": iso_utc(first_check_at),
                "message": "Waiting for the scheduled stream.",
            }

        # An ended session stays ended. It cannot be changed back to live by a
        # later API response during the same scheduled event.
        if session.get("state") == "ended":
            rumble_check = {
                "ok": True,
                "live": False,
                "skipped": "This scheduled Rumble session has already ended",
            }

        else:
            if twitch.get("ok") and twitch.get("live"):
                session["twitch_seen_live"] = True

            # Only a successful Twitch offline response can end the session,
            # and only after Twitch was previously confirmed live.
            if (
                twitch.get("ok")
                and not twitch.get("live")
                and session.get("twitch_seen_live")
            ):
                session["state"] = "ended"
                session["ended_at"] = iso_utc(now)
                session["message"] = (
                    "The Twitch stream ended, so this Rumble event is marked ended."
                )
                session["next_rumble_check_at"] = None
                rumble_check = {
                    "ok": True,
                    "live": False,
                    "skipped": "Twitch stream ended",
                }

            else:
                first_rumble_check_at = event_start + timedelta(
                    minutes=RUMBLE_FIRST_CHECK_DELAY_MINUTES
                )
                next_check_at = parse_datetime(
                    session.get("next_rumble_check_at")
                )

                if now >= first_rumble_check_at and (
                    next_check_at is None or now >= next_check_at
                ):
                    api_key = os.environ.get("APISH_KEY")

                    if not api_key:
                        rumble_check = {
                            "ok": False,
                            "live": False,
                            "error": "Missing APISH_KEY GitHub Actions secret",
                        }
                        print("Rumble check skipped: APISH_KEY is not set")
                    else:
                        page = session.get("rumble_page", 1)
                        if not isinstance(page, int) or page < 1:
                            page = 1

                        # One page per run keeps usage predictable. The next
                        # page is saved and checked on the following run.
                        rumble_check = check_rumble_page(api_key, page)

                        if rumble_check.get("ok"):
                            session["rumble_page"] = rumble_check.get(
                                "next_page", 1
                            )
                            session.pop("last_rumble_error", None)

                            if rumble_check.get("live"):
                                session["rumble_seen_live"] = True
                                session["state"] = "live"
                                session["message"] = "Rumble is live."
                                session["rumble_stream_url"] = rumble_check.get("url")
                                session["rumble_stream_title"] = rumble_check.get("title", "")
                            elif session.get("rumble_seen_live"):
                                # Do not mark Rumble offline because a later
                                # API page no longer lists the already-found stream.
                                session["state"] = "live"
                                session["message"] = "Rumble is live."
                            elif session.get("twitch_seen_live"):
                                session["state"] = "waiting"
                                session["message"] = (
                                    "GOT Games is live on Twitch. "
                                    "Rumble is expected to start soon."
                                )
                            else:
                                session["state"] = "waiting"
                                session["message"] = "Waiting for the Twitch stream to start."
                        else:
                            session["last_rumble_error"] = rumble_check.get("error", "Unknown API error")
                            print("Rumble status was not changed because the API check failed.")

                    # Retry on the next five-minute workflow run, including
                    # after a missing key or temporary API failure.
                    session["next_rumble_check_at"] = iso_utc(
                        now + timedelta(minutes=RUMBLE_CHECK_INTERVAL_MINUTES)
                    )

                # Set the correct explanatory message even on runs when the
                # next Rumble API check is not due yet.
                if session.get("rumble_seen_live"):
                    session["state"] = "live"
                    session["message"] = "Rumble is live."
                elif session.get("twitch_seen_live"):
                    session["state"] = "waiting"
                    session["message"] = (
                        "GOT Games is live on Twitch. Rumble is expected to start soon."
                    )
                elif now < first_rumble_check_at:
                    session["state"] = "waiting"
                    session["message"] = (
                        "Twitch is checked at the scheduled time. "
                        "Rumble checks begin five minutes later."
                    )
                elif not session.get("last_rumble_error"):
                    session["state"] = "waiting"
                    session["message"] = "Waiting for the Twitch stream to start."

    rumble_session_ended = session.get("state") == "ended"
    rumble_live = bool(
        event is not None
        and session.get("rumble_seen_live")
        and not rumble_session_ended
    )

    rumble_details = {
        **rumble_check,
        "live": rumble_live,
        "url": rumble_check.get("url") or session.get("rumble_stream_url") or RUMBLE_CHANNEL_URL,
        "channel_url": RUMBLE_CHANNEL_URL,
        "session_state": session.get("state"),
        "message": session.get("message", ""),
    }

    data = {
        "updated": iso_utc(now),
        "platforms": {
            "twitch": bool(twitch_live),
            "youtube": bool(youtube_live),
            "rumble": bool(rumble_live),
        },
        "details": {
            "twitch": twitch,
            "youtube": youtube,
            "rumble": rumble_details,
        },
        "rumble_session": session,
    }

    temp_file = LIVE_FILE.with_suffix(".json.tmp")
    with temp_file.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
    temp_file.replace(LIVE_FILE)

    print("Wrote live.json:", json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
