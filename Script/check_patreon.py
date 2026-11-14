"""Verify Rumble schedule entries against G.O.T Games' public Patreon sitemap."""
from __future__ import annotations

import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEDULE = ROOT / "schedule.json"
STATE = ROOT / "patreon-state.json"
SITEMAP_URL = "https://www.patreon.com/cw/gotgames/sitemap"
USER_AGENT = "Mozilla/5.0 (compatible; GOTGamesScheduleTracker/1.0)"


class PostLinkParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.posts = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            href = dict(attrs).get("href", "")
            if "/posts/" in href:
                self._href = href
                self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            title = re.sub(r"\s+", " ", html.unescape(" ".join(self._text))).strip()
            absolute = urllib.parse.urljoin("https://www.patreon.com", self._href)
            parsed = urllib.parse.urlparse(absolute)
            if parsed.scheme == "https" and parsed.hostname and parsed.hostname.endswith("patreon.com") and title:
                self.posts.append({"title": title, "url": absolute})
            self._href = None
            self._text = []


def fetch_posts():
    request = urllib.request.Request(
        SITEMAP_URL,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html", "Accept-Language": "en-US,en;q=0.9"},
    )
    with urllib.request.urlopen(request, timeout=35) as response:
        if response.status != 200:
            raise RuntimeError(f"Patreon sitemap returned HTTP {response.status}")
        body = response.read().decode("utf-8", errors="replace")
    parser = PostLinkParser()
    parser.feed(body)
    unique = {}
    for post in parser.posts:
        unique[post["url"].split("?")[0]] = post
    posts = list(unique.values())
    if len(posts) < 5:
        raise RuntimeError(f"Patreon sitemap returned only {len(posts)} readable post links; refusing to overwrite check results")
    return posts


def normalized(text):
    text = html.unescape(str(text or "")).lower()
    text = re.sub(r"\bseason\s*\d+\b|\bs\s*\d+\b", " ", text)
    text = re.sub(r"\bepisodes?\s*(?:#|:)?\s*\d+(?:\s*(?:-|–|—|to|x|&|and)\s*\d+)?", " ", text)
    text = re.sub(r"\b(?:ep|e)\s*\.?\s*\d+(?:\s*(?:-|–|—|to|x)\s*\d+)?", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def episode_spans(text):
    text = str(text or "")
    spans = []
    occupied = []
    patterns = [
        re.compile(r"\bepisodes?\s*(?:#|:)?\s*(\d{1,4})\s*(?:-|–|—|to|x|&|and)\s*(\d{1,4})\b", re.I),
        re.compile(r"\b(?:ep|e)\s*\.?\s*(\d{1,4})\s*(?:-|–|—|to|x)\s*(\d{1,4})\b", re.I),
        re.compile(r"\b(?:episode|ep|e)\s*\.?\s*(\d{1,4})\b", re.I),
    ]
    for pattern in patterns:
        for match in pattern.finditer(text):
            if any(match.start() < end and match.end() > start for start, end in occupied):
                continue
            first = int(match.group(1))
            last = int(match.group(2)) if match.lastindex and match.lastindex >= 2 and match.group(2) else first
            if first <= last and last - first <= 100:
                spans.append(set(range(first, last + 1)))
                occupied.append((match.start(), match.end()))
    return spans


def season_numbers(text):
    return {int(value) for value in re.findall(r"\b(?:season\s*|s\s*)(\d{1,2})\b", str(text or ""), re.I)}


def is_rumble(event):
    return str(event.get("platform", "")).lower() == "rumble" or any(
        "rumble" in str(label).lower() for label in event.get("labels", [])
    )


def event_key(event):
    return (str(event.get("start") or event.get("date") or "") + "|" + normalized(event.get("title"))).strip("|")


def match_event(event, posts):
    title = str(event.get("title") or "")
    expected_spans = episode_spans(title)
    expected = set().union(*expected_spans) if expected_spans else set()
    show = normalized(title)
    event_seasons = season_numbers(title)
    if not show:
        return {"status": "pending", "message": "Could not identify the scheduled title; awaiting a clearer Patreon match."}

    matched = []
    covered = set()
    extras = set()
    for post in posts:
        post_title = post["title"]
        post_normalized = normalized(post_title)
        if not re.search(r"(?:^|\s)" + re.escape(show) + r"(?:$|\s)", post_normalized):
            continue
        post_seasons = season_numbers(post_title)
        if event_seasons and (not post_seasons or not event_seasons.intersection(post_seasons)):
            continue
        spans = episode_spans(post_title)
        if expected:
            for span in spans:
                overlap = span & expected
                if overlap:
                    covered.update(overlap)
                    extras.update(span - expected)
                    matched.append({"title": post_title, "url": post["url"], "episodes": sorted(span)})
                    break
        elif not spans:
            matched.append({"title": post_title, "url": post["url"], "episodes": []})

    unique = {}
    for item in matched:
        unique[item["url"]] = item
    matched = list(unique.values())

    if expected and expected.issubset(covered):
        return {
            "status": "verified",
            "message": "All announced episodes were found on Patreon.",
            "url": matched[0]["url"],
            "posts": matched,
            "covered_episodes": sorted(covered),
            "extra_episodes": sorted(extras),
        }
    if expected and covered:
        return {
            "status": "partial",
            "message": "Some announced episodes were found; the remaining episodes are still being checked.",
            "url": matched[0]["url"],
            "posts": matched,
            "covered_episodes": sorted(covered),
            "missing_episodes": sorted(expected - covered),
            "extra_episodes": sorted(extras),
        }
    if not expected and matched:
        return {
            "status": "verified",
            "message": "A matching Patreon post was found.",
            "url": matched[0]["url"],
            "posts": matched,
            "covered_episodes": [],
            "extra_episodes": [],
        }
    return {
        "status": "pending",
        "message": "No matching Patreon post found yet. The tracker will check again automatically.",
        "covered_episodes": sorted(covered),
        "missing_episodes": sorted(expected),
    }


def main():
    if not SCHEDULE.exists():
        raise RuntimeError("schedule.json was not found")
    data = json.loads(SCHEDULE.read_text(encoding="utf-8"))
    if not isinstance(data.get("events"), list):
        raise RuntimeError("schedule.json does not contain an events array")

    posts = fetch_posts()
    now = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    previous = {}
    if STATE.exists():
        try:
            previous = json.loads(STATE.read_text(encoding="utf-8")).get("checks", {})
        except (OSError, ValueError, AttributeError):
            previous = {}
    checks = dict(previous)
    checked_count = verified_count = partial_count = pending_count = 0
    current_keys = set()

    for event in data["events"]:
        if not isinstance(event, dict) or not is_rumble(event):
            continue
        key = event_key(event)
        current_keys.add(key)
        result = match_event(event, posts)
        old = checks.get(key, {})
        if result["status"] == "pending" and old.get("status") == "verified":
            result = dict(old)
            result["message"] = "Previously verified on Patreon; retaining the saved confirmation."
        result.update({"checked_at": now, "source": SITEMAP_URL})
        event["patreon_check"] = result
        checks[key] = result
        checked_count += 1
        if result["status"] == "verified":
            verified_count += 1
        elif result["status"] == "partial":
            partial_count += 1
        else:
            pending_count += 1

    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=90)
    retained = {}
    for key, value in checks.items():
        stamp = str(value.get("checked_at", ""))
        try:
            parsed = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        except ValueError:
            parsed = dt.datetime.now(dt.timezone.utc)
        if parsed >= cutoff or key in current_keys:
            retained[key] = value

    data["patreonChecked"] = now
    data["patreonCheckSummary"] = {
        "source": SITEMAP_URL,
        "posts_scanned": len(posts),
        "events_checked": checked_count,
        "verified": verified_count,
        "partial": partial_count,
        "pending": pending_count,
    }
    SCHEDULE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    STATE.write_text(json.dumps({"updated": now, "checks": retained}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Patreon check complete: scanned {len(posts)} public posts; checked {checked_count} Rumble events; {verified_count} verified, {partial_count} partial, {pending_count} pending.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, urllib.error.URLError) as error:
        print(f"WARNING: Patreon check could not complete: {error}", file=sys.stderr)
        # A temporary Patreon outage must not fail or erase the schedule.
        sys.exit(0)
