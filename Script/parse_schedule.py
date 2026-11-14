"""Read the schedule image and write its events into schedule.json."""
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
        return subprocess.run(cmd, capture_output=True, text=True).stdout.strip()


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
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})", text)
    if m and m.group(1).lower() in MONTHS:
        month, day = MONTHS.index(m.group(1).lower()) + 1, int(m.group(2))
        years = [posted.year - 1, posted.year, posted.year + 1]
        dates = [dt.date(y, month, day) for y in years]
        return min(dates, key=lambda d: abs((d - posted.date()).days))
    d = posted.date()
    return d - dt.timedelta(days=d.weekday())


def main():
    path = sorted(glob.glob("schedule/latest.*"))[0]
    im = Image.open(path).convert("RGB")
    s = im.width / 1152
    try:
        info = json.loads(pathlib.Path("schedule/message.json").read_text())
        posted = dt.datetime.fromisoformat(info["posted"].replace("Z", "+00:00"))
    except Exception:
        posted = dt.datetime.now(dt.timezone.utc)

    boxes = day_boxes(im, s)
    if not boxes:
        print("WARNING: no day boxes found; schedule.json left unchanged.")
        return
    top = boxes[0][0]
    header = im.crop((int(300 * s), int(top - 96 * s), int(850 * s), int(top - 56 * s)))
    monday = monday_from_header(ocr(header, 7), posted)

    events, prev = [], -1
    for i, (y0, y1) in enumerate(boxes):
        label = ocr(im.crop((int(20 * s), y0, int(110 * s), y1 + 1)), 7,
                    "MONTUEWDHFRISA").upper()[:3]
        idx = DAYS.index(label) if label in DAYS else prev + 1
        prev = idx
        day = monday + dt.timedelta(days=idx)
        rows = max(1, round((y1 - y0 + 4) / (ROW_H * s)))
        for r in range(rows):
            yc = y0 + (r + 0.5) * (y1 - y0 + 1) / rows
            t = ocr(im.crop((int(224 * s), int(yc - 14 * s), int(288 * s), int(yc + 14 * s))),
                    7, "0123456789:", 4)
            m = re.search(r"(\d{1,2}):?(\d{2})", t)
            title = ocr(im.crop((int(290 * s), int(yc - 18 * s), int(1035 * s), int(yc + 18 * s))), 7)
            title = re.sub(r"\s+", " ", title.replace("£", "E")).strip()
            title = re.sub(r"[^\w)\]!?.]+$", "", title)
            if not m or not title:
                print(f"WARNING: could not read a row on {DAYS[idx]} (time={t!r}, title={title!r})")
                continue
            start = dt.datetime(day.year, day.month, day.day, int(m.group(1)), int(m.group(2)),
                                tzinfo=dt.timezone.utc)
            found = icons(im, yc, s)
            primary = next((k for k in ("twitch", "rumble", "patreon") if k in found),
                           "got" if found else "other")
            events.append({
                "title": title,
                "platform": primary,
                "labels": list(dict.fromkeys(LABELS[f] for f in found)),
                "start": start.isoformat().replace("+00:00", "Z"),
                "status": "confirmed",
                "url": "",
            })

    notes = ocr(im.crop((0, int(boxes[-1][1] + 15 * s), im.width, im.height)), 6, None, 2)
    site = pathlib.Path("schedule.json")
    data = json.loads(site.read_text())
    data.update({
        "weekStart": monday.isoformat(),
        "events": sorted(events, key=lambda e: e["start"]),
        "notes": [n.strip() for n in notes.splitlines() if n.strip()],
        "updated": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
    })
    site.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Wrote {len(events)} events for the week of {monday}.")


if __name__ == "__main__":
    main()
