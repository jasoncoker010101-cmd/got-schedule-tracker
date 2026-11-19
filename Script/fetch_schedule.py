"""Find, validate and publish the weekly Discord flyer as one Git changeset."""
import argparse
import datetime as dt
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image
from parse_schedule import parse_image

API = "https://discord.com/api/v10"
CDN = {"cdn.discordapp.com", "media.discordapp.net"}
UA = "DiscordBot (https://github.com/jasoncoker010101-cmd/got-schedule-tracker, 2.0)"
MAX_BYTES = 12 * 1024 * 1024
SNOWFLAKE = re.compile(r"[0-9]{16,22}\Z")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        return None


def download(url, token=None):
    parsed = urllib.parse.urlsplit(url)
    hosts = {"discord.com"} if token else CDN
    if parsed.scheme != "https" or parsed.netloc not in hosts:
        raise ValueError("Unexpected Discord attachment host")
    headers = {"User-Agent": UA}
    if token:
        headers["Authorization"] = "Bot " + token
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.build_opener(NoRedirect).open(request, timeout=20) as response:
                payload = response.read(MAX_BYTES + 1)
            if len(payload) > MAX_BYTES:
                raise ValueError("Discord response exceeds the download limit")
            return payload
        except urllib.error.HTTPError as error:
            if (error.code == 429 or error.code >= 500) and attempt < 2:
                try:
                    delay = min(12, max(1, float(error.headers.get("Retry-After", 2 ** attempt))))
                except ValueError:
                    delay = 2 ** attempt
                time.sleep(delay)
                continue
            hint = {401: "check the bot token", 403: "grant View Channel and Read Message History",
                    404: "verify the channel/message ID or refresh an expired Discord attachment"}.get(error.code, "check the Actions log")
            raise RuntimeError(f"Discord {'API' if token else 'attachment'} HTTP {error.code}; {hint}") from None
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise RuntimeError("Discord connection failed after three attempts") from None
            time.sleep(2 ** attempt)


def image_urls(message):
    entries = [message, *(s.get("message") or {} for s in message.get("message_snapshots", []))]
    result = []
    for entry in entries:
        for attachment in entry.get("attachments", []):
            name = str(attachment.get("filename", "")).lower()
            if str(attachment.get("content_type") or "").startswith("image/") or name.endswith((".png", ".jpeg", ".jpg", ".webp")):
                result.append(attachment.get("url"))
        for embed in entry.get("embeds", []):
            image = embed.get("image") or {}
            result.extend([image.get("proxy_url"), image.get("url")])
    return list(dict.fromkeys(url for url in result if isinstance(url, str) and
                              urllib.parse.urlsplit(url).scheme == "https" and
                              urllib.parse.urlsplit(url).netloc in CDN))


def decode_flyer(payload):
    if len(payload) > MAX_BYTES:
        raise ValueError("Schedule attachment exceeds the file size limit")
    with Image.open(io.BytesIO(payload)) as image:
        width, height = image.size
        if not (450 <= width <= 3000 and 450 <= height <= 5000 and width * height <= 8_000_000):
            raise ValueError("The attachment has unexpected flyer dimensions")
        if image.format not in {"PNG", "JPEG", "WEBP"} or getattr(image, "n_frames", 1) != 1:
            raise ValueError("The attachment must be a static PNG, JPEG, or WebP")
        output = io.BytesIO()
        image.convert("RGB").save(output, "PNG")
        return output.getvalue()


def read_json(path, default=None):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def write_atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not isinstance(value, bytes):
        value = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        handle.write(value)
    tmp = Path(handle.name)
    try:
        tmp.chmod(0o644)
        tmp.replace(path)
    finally:
        tmp.unlink(missing_ok=True)


def timestamp(value):
    result = dt.datetime.fromisoformat(value or "")
    if result.tzinfo is None:
        raise ValueError("A timezone-aware posting date is required")
    return result


def publish(root, current, parsed, flyer, meta, digest):
    schedule = root / "schedule"
    week = parsed["weekStart"]
    previous = current.get("weekStart", "")
    if dt.date.fromisoformat(week) < dt.date.fromisoformat(previous):
        raise ValueError("An older schedule cannot replace the current published week")
    archive = schedule / "archive"
    # Older snapshots originally pointed to the mutable latest.png. Preserve the
    # last known matching version before latest.png is replaced.
    legacy = schedule / "latest.png"
    if previous != week and legacy.exists() and current.get("image", "").startswith("schedule/latest.png"):
        old_image = f"schedule/images/{hashlib.sha256(legacy.read_bytes()).hexdigest()[:24]}.png"
        write_atomic(root / old_image, legacy.read_bytes())
        current = {**current, "image": old_image}
    if previous and previous != week:
        write_atomic(archive / f"{previous}.json", current)
    image_path = f"schedule/images/{digest[:24]}.png"
    keys = {(e["title"], e.get("start"), e.get("platform")): e for e in current["events"]}
    if week == previous:
        for row in parsed["events"]:
            match = keys.get((row["title"], row["start"], row["platform"]), {})
            if match.get("patreon_check"):
                row["patreon_check"] = match["patreon_check"]
            if match.get("url"):
                row["url"] = match["url"]
    now = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    updated = {**parsed, "image": image_path, "sourceUrl": current.get("sourceUrl", ""), "updated": now}
    if week == previous and keys.keys() == {(e["title"], e.get("start"), e.get("platform")) for e in parsed["events"]}:
        for field in ("patreonChecked", "patreonCheckSummary"):
            if field in current:
                updated[field] = current[field]
    write_atomic(root / image_path, flyer)
    write_atomic(legacy, flyer)
    write_atomic(archive / f"{week}.json", updated)
    write_atomic(root / "schedule.json", updated)
    write_atomic(schedule / "message.json", meta)
    write_atomic(schedule / "state.json", {
        "message_id": meta["id"], "edited": meta.get("edited"), "image_sha256": digest
    })


def run(args, root=Path(".")):
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    channel = os.environ.get("DISCORD_CHANNEL_ID", "").strip()
    state = read_json(root / "schedule/state.json", {})
    current = read_json(root / "schedule.json")
    if not isinstance(current, dict) or not isinstance(current.get("events"), list):
        raise ValueError("The published schedule is invalid; refusing to replace it")
    if args.reparse or args.local_image:
        meta = read_json(root / "schedule/message.json", {})
        image = Path(args.local_image) if args.local_image else root / "schedule/latest.png"
        if args.local_image and not args.posted:
            raise ValueError("--local-image requires --posted with an explicit timezone")
        local = {"id": meta.get("id", state.get("message_id")), "posted": args.posted or meta.get("posted"),
                 "edited": meta.get("edited", state.get("edited"))}
        candidates = [(local, [image])]
    else:
        if not token or not SNOWFLAKE.fullmatch(channel):
            raise ValueError("Configure DISCORD_BOT_TOKEN and a numeric DISCORD_CHANNEL_ID")
        details = json.loads(download(f"{API}/channels/{channel}", token))
        if not isinstance(details, dict) or details.get("id") != channel:
            raise ValueError("Discord did not confirm the configured channel")
        print(f"Discord connected to #{details.get('name', 'unnamed')} (configured channel).")
        if details.get("name") != "weekly-schedule":
            print("NOTICE: configured channel is not named #weekly-schedule; verify it is the intended following channel.")
        if args.message_id and not SNOWFLAKE.fullmatch(args.message_id):
            raise ValueError("The Discord message ID must be numeric")
        endpoint = f"{API}/channels/{channel}/messages"
        messages = ([json.loads(download(f"{endpoint}/{args.message_id}", token))] if args.message_id
                    else json.loads(download(f"{endpoint}?limit=100", token)))
        if not isinstance(messages, list):
            raise ValueError("Discord messages response was not a list")
        print(f"Discord returned {len(messages)} message(s).")
        if messages and not any(message.get("content") or image_urls(message) for message in messages if isinstance(message, dict)):
            print("NOTICE: Discord returned no visible text or image attachments; verify Message Content access and that the relay posts here.")
        candidates = []
        last_id = int(state.get("message_id") or 0)
        trusted = set(re.findall(r"\d{16,22}", os.environ.get("DISCORD_TRUSTED_AUTHOR_IDS", "")))
        for message in sorted((m for m in messages if isinstance(m, dict) and SNOWFLAKE.fullmatch(str(m.get("id", "")))),
                              key=lambda m: int(m["id"]), reverse=True):
            message_id = int(message["id"])
            edited = message.get("edited_timestamp")
            if not args.message_id and message_id < last_id:
                break
            if not args.message_id and message_id == last_id and (not edited or edited == state.get("edited")):
                continue
            forwarded = bool(message.get("message_snapshots") or message.get("webhook_id") or
                             int(message.get("flags") or 0) & 2)
            if trusted and not args.message_id and not forwarded and str((message.get("author") or {}).get("id")) not in trusted:
                continue
            urls = image_urls(message)
            if urls:
                candidates.append(({"id": message["id"], "posted": message.get("timestamp"), "edited": edited}, urls[:4]))
        if not candidates:
            print("No newer Discord image found. The current schedule and archive were left unchanged.")
            return
    duplicate = False
    for meta, urls in candidates[:8]:
        for url in urls:
            try:
                flyer = decode_flyer(url.read_bytes() if isinstance(url, Path) else download(url))
                digest = hashlib.sha256(flyer).hexdigest()
                if digest == state.get("image_sha256") and not (args.reparse or (args.message_id and args.dry_run)):
                    duplicate = True
                    continue
                with tempfile.TemporaryDirectory() as folder:
                    incoming = Path(folder) / "candidate.png"
                    incoming.write_bytes(flyer)
                    parsed = parse_image(incoming, timestamp(meta["posted"]))
                if parsed["weekStart"] < current["weekStart"]:
                    raise ValueError("Flyer is older than the current schedule")
                if args.message_id and int(meta["id"]) < int(state.get("message_id") or 0) and parsed["weekStart"] == current["weekStart"]:
                    raise ValueError("An older message cannot replace a newer revision of the same week")
                print(f"Validated week {parsed['weekStart']}: {len(parsed['events'])} events; {parsed['sourceTimezone']} converted to UTC.")
                if args.dry_run:
                    print("Dry run: no schedule files changed.")
                    return
                publish(root, current, parsed, flyer, meta, digest)
                return
            except (ValueError, OSError, RuntimeError, subprocess.SubprocessError) as error:
                print(f"Rejected candidate {meta.get('id')}: {error}", file=sys.stderr)
    if duplicate:
        print("Only the already published flyer passed validation; the schedule was left unchanged.")
        return
    raise RuntimeError("No new image passed validation. The last good schedule was retained.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--message-id", help="Read a specific message in the configured Discord channel")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--reparse", action="store_true")
    parser.add_argument("--local-image")
    parser.add_argument("--posted")
    try:
        run(parser.parse_args())
    except (ValueError, RuntimeError, OSError, KeyError) as error:
        parser.exit(1, f"Schedule update failed: {error}\n")


if __name__ == "__main__":
    main()
