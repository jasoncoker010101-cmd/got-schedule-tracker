import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timezone

TWITCH_USER = "gotgames"       # Change if the Twitch username is different
YOUTUBE_HANDLE = "@GOTGames"   # Change if the YouTube @handle is different

def check_twitch():
    client_id = os.environ.get("TWITCH_CLIENT_ID")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET")
    if not client_id or not client_secret:
        return {"live": False}

    try:
        # 1. Get App Access Token
        token_data = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials"
        }).encode()
        req = urllib.request.Request("https://twitch.tv", data=token_data, method="POST")
        with urllib.request.urlopen(req, timeout=10) as res:
            token = json.loads(res.read().decode())["access_token"]

        # 2. Check if channel is live
        url = f"https://twitch.tv{TWITCH_USER}"
        req = urllib.request.Request(url, headers={
            "Client-ID": client_id,
            "Authorization": f"Bearer {token}"
        })
        with urllib.request.urlopen(req, timeout=10) as res:
            streams = json.loads(res.read().decode()).get("data", [])

        if streams:
            return {
                "live": True,
                "title": streams[0].get("title", ""),
                "url": f"https://twitch.tv{TWITCH_USER}"
            }
    except Exception as e:
        print("Twitch check error:", e)
    return {"live": False}

def check_youtube():
    try:
        url = f"https://youtube.com{YOUTUBE_HANDLE}/live"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as res:
            html = res.read().decode("utf-8", errors="ignore")
            # YouTube embeds "isLive":true when an active stream is running
            if '"isLive":true' in html:
                return {
                    "live": True,
                    "url": url
                }
    except Exception as e:
        print("YouTube check error:", e)
    return {"live": False}

def main():
    twitch = check_twitch()
    youtube = check_youtube()
    data = {
        "updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "live": twitch["live"] or youtube["live"],
        "twitch": twitch,
        "youtube": youtube
    }
    with open("live.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("Wrote live.json:", data)

if __name__ == "__main__":
    main()
