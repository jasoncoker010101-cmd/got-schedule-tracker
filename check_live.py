import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timezone

TWITCH_USER = "gotgames"       # Twitch username, without "@"
YOUTUBE_HANDLE = "@GOTGames"   # YouTube handle, with "@"


def check_twitch():
    client_id = os.environ.get("TWITCH_CLIENT_ID")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("Twitch check error: missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET")
        return {"live": False}

    try:
        # Get an app access token.
        token_data = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        }).encode()

        token_req = urllib.request.Request(
            "https://id.twitch.tv/oauth2/token",
            data=token_data,
            method="POST",
        )

        with urllib.request.urlopen(token_req, timeout=10) as response:
            token_data = json.loads(response.read().decode("utf-8"))
            access_token = token_data["access_token"]

        # Check whether the Twitch channel is live.
        query = urllib.parse.urlencode({"user_login": TWITCH_USER})
        streams_url = f"https://api.twitch.tv/helix/streams?{query}"

        streams_req = urllib.request.Request(
            streams_url,
            headers={
                "Client-Id": client_id,
                "Authorization": f"Bearer {access_token}",
            },
        )

        with urllib.request.urlopen(streams_req, timeout=10) as response:
            streams = json.loads(response.read().decode("utf-8")).get("data", [])

        if streams:
            return {
                "live": True,
                "title": streams[0].get("title", ""),
                "url": f"https://www.twitch.tv/{TWITCH_USER}",
            }

    except Exception as error:
        print("Twitch check error:", repr(error))

    return {"live": False}


def check_youtube():
    url = f"https://www.youtube.com/{YOUTUBE_HANDLE}/live"

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"},
        )

        with urllib.request.urlopen(request, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")

        # YouTube's page markup can change, so this check may need updating
        # if YouTube changes how it marks active livestreams.
        if '"isLive":true' in html:
            return {
                "live": True,
                "url": url,
            }

    except Exception as error:
        print("YouTube check error:", repr(error))

    return {"live": False}


def main():
    twitch = check_twitch()
    youtube = check_youtube()

    data = {
        "updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "live": twitch["live"] or youtube["live"],
        "twitch": twitch,
        "youtube": youtube,
    }

    with open("live.json", "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)

    print("Wrote live.json:", data)


if __name__ == "__main__":
    main()
