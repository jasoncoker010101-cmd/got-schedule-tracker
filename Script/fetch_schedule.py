"""Fetch the newest forwarded schedule image from Discord and save it in the repo."""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
CHANNEL = os.environ.get("DISCORD_CHANNEL_ID", "").strip()
UA = "DiscordBot (https://github.com/jasoncoker010101-cmd/got-schedule-tracker, 1.0)"
OUT = pathlib.Path("schedule")
CROSSPOSTED = 2  # Discord flag: message was forwarded by Channel Following


def fail(msg):
    print("ERROR: " + msg)
    sys.exit(1)


def get(url, auth=False):
    headers = {"User-Agent": UA}
    if auth:
        headers["Authorization"] = "Bot " + TOKEN
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        hints = {
            401: "The bot token is wrong or was reset.",
            403: "The bot can't see that channel. Give it View Channel and Read Message History.",
            404: "Channel not found. Check the DISCORD_CHANNEL_ID secret.",
        }
        fail(f"Discord returned {e.code}. {hints.get(e.code, '')}")


def set_output(value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            f.write(f"new={value}\n")


def images(m):
    found = []
    for a in m.get("attachments", []):
        if (a.get("content_type") or "").startswith("image/"):
            found.append(a["url"])
    for e in m.get("embeds", []):
        url = (e.get("image") or {}).get("url")
        if url:
            found.append(url)
    return found


def main():
    if not TOKEN or not CHANNEL:
        fail("Missing the DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID secret.")
    api = f"https://discord.com/api/v10/channels/{CHANNEL}/messages?limit=100"
    msgs = json.loads(get(api, auth=True))
    found = [
        m for m in msgs
        if (m.get("flags", 0) & CROSSPOSTED or m.get("webhook_id")) and images(m)
    ]
    if not found:
        print("No forwarded schedule image in the last 100 messages.")
        set_output("false")
        return
    m = max(found, key=lambda x: int(x["id"]))
    OUT.mkdir(exist_ok=True)
    state_file = OUT / "state.json"
    state = json.loads(state_file.read_text()) if state_file.exists() else {}
    if state.get("message_id") == m["id"]:
        print("Already up to date.")
        set_output("false")
        return
    url = images(m)[0]
    ext = pathlib.Path(urllib.parse.urlparse(url).path).suffix.lower() or ".png"
    for old in OUT.glob("latest.*"):
        old.unlink()
    (OUT / f"latest{ext}").write_bytes(get(url))
    (OUT / "message.json").write_text(json.dumps({
        "id": m["id"],
        "posted": m.get("timestamp"),
        "text": m.get("content", ""),
        "embeds": [
            {k: e.get(k) for k in ("title", "description", "url")}
            for e in m.get("embeds", [])
        ],
    }, indent=2))
    state_file.write_text(json.dumps({"message_id": m["id"]}))
    site = pathlib.Path("schedule.json")
    data = json.loads(site.read_text())
    data["image"] = f"schedule/latest{ext}?v={m['id']}"
    site.write_text(json.dumps(data, indent=2) + "\n")
    print("Saved new schedule image from message " + m["id"])
    set_output("true")


if __name__ == "__main__":
    main()
