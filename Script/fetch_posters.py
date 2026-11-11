import json
import os
import re
import time
import urllib.parse
import urllib.request

SCHEDULE_FILE = "schedule.json"
SHOWS_FILE = "shows.json"
OVERRIDES_FILE = "Script/show_overrides.json"

API_BASE = "https://api.themoviedb.org/3"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

# Removes things like "Season 5 E8", "S2 E7-10", "E36-39" from the end of a title
EPISODE_PATTERN = re.compile(
    r"\s+(?:Season\s*\d+\s*)?(?:S\d+\s*)?E\d+(?:\s*-\s*\d+)?\s*$",
    re.IGNORECASE,
)


def clean_title(title):
    return EPISODE_PATTERN.sub("", title).strip()


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def tmdb_get(path, params, token):
    url = f"{API_BASE}{path}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def find_poster(name, token):
    # Try TV shows first, then movies, and take the first result that has a poster
    for kind in ("tv", "movie"):
        data = tmdb_get(
            f"/search/{kind}",
            {"query": name, "include_adult": "false", "language": "en-US"},
            token,
        )
        for result in data.get("results", []):
            if result.get("poster_path"):
                return {
                    "poster": IMAGE_BASE + result["poster_path"],
                    "tmdb_id": result["id"],
                    "tmdb_type": kind,
                    "matched_name": result.get("name") or result.get("title"),
                }
    return None


def main():
    token = os.environ.get("TMDB_READ_TOKEN")
    if not token:
        print("TMDB_READ_TOKEN is missing, skipping poster lookup.")
        return

    schedule = load_json(SCHEDULE_FILE, {"events": []})
    shows_data = load_json(SHOWS_FILE, {"shows": {}})
    overrides = load_json(OVERRIDES_FILE, {})

    shows = shows_data.get("shows", {})
    original = json.dumps(shows_data, sort_keys=True)

    names = sorted({
        clean_title(event["title"])
        for event in schedule.get("events", [])
        if event.get("title")
    })

    for name in names:
        existing = shows.get(name)
        if existing and (existing.get("poster") or existing.get("skipped")):
            continue

        override = overrides.get(name, {})
        if override.get("skip"):
            shows[name] = {"poster": None, "skipped": True}
            continue

        search_name = override.get("search", name)

        try:
            found = find_poster(search_name, token)
        except Exception as error:
            print(f"TMDB lookup failed for {name!r}: {error!r}")
            continue

        if found:
            found["searched_as"] = search_name
            shows[name] = found
            print(f"Found poster for {name!r}: {found['matched_name']}")
        else:
            shows[name] = {"poster": None, "searched_as": search_name}
            print(f"No poster found for {name!r}")

        time.sleep(0.25)

    shows_data["shows"] = shows

    if json.dumps(shows_data, sort_keys=True) != original:
        with open(SHOWS_FILE, "w", encoding="utf-8") as file:
            json.dump(shows_data, file, indent=2, ensure_ascii=False)
        print("Updated shows.json")
    else:
        print("No new show posters needed.")


if __name__ == "__main__":
    main()
