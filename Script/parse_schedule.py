"""Read and verify a G.O.T Games schedule flyer without modifying the site."""
import datetime as dt
import glob
import json
import pathlib
import re
import subprocess
import tempfile

from PIL import Image

DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
# What each icon on the image means. Change the names here if one is wrong.
LABELS = {"patreon": "Patreon", "twitch": "Twitch", "rumble": "Rumble",
          "g_gold": "G.O.T Games", "g_green": "G.O.T Games"}
ROW_H = 57  # pixels between rows when the image is 1152 px wide


def ocr(img, psm, whitelist=None, scale=3):
    big = img.resize((img.width * scale, img.height * scale), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".png") as f:
        big.save(f.name)
        cmd = ["tesseract", f.name, "stdout", "--psm", str(psm)]
        if whitelist:
            cmd += ["-c", "tessedit_char_whitelist=" + whitelist]
        return subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=20).stdout.strip()


def day_boxes(im, s):
    """Vertical spans of the yellow MON/TUE/... boxes down the left edge."""
    x, runs, start = int(26 * s), [], None
    for y in range(im.height):
        r, g, b = im.getpixel((x, y))
        yellow = r > 225 and 185 < g < 235 and b < 100
        if yellow and start is None:
            start = y
        if not yellow and start is not None:
            if y - start > 20 * s:
                runs.append((start, y - 1))
            start = None
    return runs


def classify(im, x0, x1, y0, y1):
    n = dict(black=0, purple=0, gold=0, green=0)
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = im.getpixel((x, y))
            if r < 26 and g < 26 and b < 26:
                n["black"] += 1
            elif b > r + 40 and b > g + 80:
                n["purple"] += 1
            elif r > 170 and g > 140 and b < 100 and r - b > 100:
                n["gold"] += 1
            elif g > r + 40 and g > b + 80 and g > 150:
                n["green"] += 1
    if n["purple"] > 15:
        return "twitch"
    if (n["gold"] > 15 or n["green"] > 15) and n["black"] > 10:
        return "g_gold" if n["gold"] > n["green"] else "g_green"
    if n["green"] > 15:
        return "rumble"
    if n["black"] > 10:
        return "patreon"
    return None


def icons(im, yc, s):
    """Read the platform icons at the right end of a row."""
    ys = range(int(yc - 16 * s), int(yc + 17 * s), 2)
    xs = [x for x in range(int(1000 * s), im.width)
          if any(min(im.getpixel((x, y))) > 240 for y in ys)]
    if not xs:
        return []
    x0, x1 = min(xs), max(xs)
    parts = [(x0, x1 + 1)]
    if x1 - x0 > 55 * s:
        mid = (x0 + x1) // 2
        parts = [(x0, mid), (mid, x1 + 1)]
    found = [classify(im, a, b, int(yc - 14 * s), int(yc + 15 * s)) for a, b in parts]
    return [f for f in found if f]


def monday_from_header(text, posted):
    dates = re.findall(r"\b([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b", text, re.I)
    if len(dates) != 2 or any(month.lower() not in MONTHS for month, _ in dates):
        raise ValueError("Could not verify both dates in the schedule header")
    month, day = MONTHS.index(dates[0][0].lower()) + 1, int(dates[0][1])
    target = MONTHS.index(dates[1][0].lower()) + 1, int(dates[1][1])
    choices = []
    for year in range(posted.year - 1, posted.year + 2):
        try:
            date = dt.date(year, month, day)
        except ValueError:
            continue
        end = date + dt.timedelta(days=6)
        if date.weekday() == 0 and (end.month, end.day) == target:
            choices.append(date)
    if not choices:
        raise ValueError("Schedule header is not a Monday–Sunday week")
    monday = min(choices, key=lambda date: abs((date - posted.date()).days))
    if abs((monday - posted.date()).days) > 21:
        raise ValueError("Schedule week is too far from the posting date")
    return monday


def parse_image(path, posted):
    if posted.tzinfo is None:
        raise ValueError("The posting timestamp needs a timezone")
    im = Image.open(path).convert("RGB")
    s = im.width / 1152
    boxes = day_boxes(im, s)
    if len(boxes) != 7:
        raise ValueError(f"Expected 7 weekday boxes; detected {len(boxes)}")
    top = boxes[0][0]
    header = im.crop((int(280 * s), int(top - 104 * s), int(875 * s), int(top - 24 * s)))
    header_text = ocr(header, 6)
    monday = monday_from_header(header_text, posted)
    zone_text = ocr(im.crop((int(390 * s), int(top - 58 * s), int(760 * s), int(top - 29 * s))), 7, scale=4)
    zone_match = re.search(r"\b(GMT|UTC|BST|EST|EDT)\b", zone_text.upper())
    if not zone_match:
        raise ValueError("Cannot verify the timezone printed on the schedule")
    zone = zone_match.group(1)
    tz = dt.timezone(dt.timedelta(hours={"GMT": 0, "UTC": 0, "BST": 1, "EST": -5, "EDT": -4}[zone]))

    events, no_stream, seen = [], [], set()
    for i, (y0, y1) in enumerate(boxes):
        cy = (y0 + y1) / 2
        label_img = im.crop((int(24 * s), int(cy - 24 * s), int(106 * s), int(cy + 24 * s)))
        label_img = label_img.convert("L").point(lambda value: 255 if value > 120 else 0)
        label = ocr(label_img, 7, "MONTUEWDHFRISA", 4).upper()
        if label != DAYS[i]:
            raise ValueError(f"Could not verify weekday box {i + 1} ({DAYS[i]})")
        day = monday + dt.timedelta(days=i)
        rows = max(1, round((y1 - y0 + 4) / (ROW_H * s)))
        for r in range(rows):
            yc = y0 + (r + 0.5) * (y1 - y0 + 1) / rows
            t = ocr(im.crop((int(224 * s), int(yc - 14 * s), int(288 * s), int(yc + 14 * s))),
                    7, "0123456789:", 4)
            m = re.fullmatch(r"(\d{1,2}):?(\d{2})", t)
            title = ocr(im.crop((int(290 * s), int(yc - 18 * s), int(1035 * s), int(yc + 18 * s))), 7)
            title = re.sub(r"\s+", " ", title.replace("£", "E")).strip()
            title = re.sub(r"[^\w)\]!?.]+$", "", title)
            if not m and re.match(r"^(no\s+streams?|no\s+events?|day\s+off)\b", title, re.I):
                no_stream.append(day.isoformat())
                continue
            if not m or not title or not 0 <= int(m.group(1)) <= 23 or not 0 <= int(m.group(2)) <= 59:
                raise ValueError(f"Unreadable time or title in {DAYS[i]} row {r + 1}")
            start = dt.datetime(day.year, day.month, day.day, int(m.group(1)), int(m.group(2)),
                                tzinfo=tz).astimezone(dt.timezone.utc)
            found = icons(im, yc, s)
            primary = next((k for k in ("twitch", "rumble", "patreon") if k in found),
                           "got" if found else "other")
            key = (" ".join(title.casefold().split()), start, primary)
            if key in seen:
                continue
            seen.add(key)
            events.append({
                "title": title,
                "platform": primary,
                "labels": list(dict.fromkeys(LABELS[f] for f in found)),
                "start": start.isoformat().replace("+00:00", "Z"),
                "status": "confirmed",
                "url": "",
            })

    notes_y = int(boxes[-1][1] + 15 * s)
    notes = ocr(im.crop((0, notes_y, im.width, im.height)), 6, None, 2) if notes_y < im.height else ""
    if not events and len(set(no_stream)) != 7:
        raise ValueError("No events or complete explicit no-event week found")
    return {"weekStart": monday.isoformat(), "events": sorted(events, key=lambda e: e["start"]),
            "notes": [n.strip() for n in notes.splitlines() if n.strip()], "noStreamDays": sorted(set(no_stream)),
            "sourceTimezone": zone}


if __name__ == "__main__":
    info = json.loads(pathlib.Path("schedule/message.json").read_text())
    path = sorted(glob.glob("schedule/latest.*"))[0]
    print(json.dumps(parse_image(path, dt.datetime.fromisoformat(info["posted"])), indent=2))
