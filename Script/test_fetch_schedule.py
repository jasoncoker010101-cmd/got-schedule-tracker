import argparse
import datetime as dt
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fetch_schedule import decode_flyer, image_urls, publish, read_json, run
from parse_schedule import monday_from_header, parse_image

ROOT = Path(__file__).resolve().parent.parent
FLYER = ROOT / "schedule/images/3ff91a6ea083304740d91afb.png"


class ScheduleIngestionTests(unittest.TestCase):
    def test_forward_direct_and_embed_support(self):
        direct = "https://cdn.discordapp.com/attachments/direct.png"
        forwarded = "https://media.discordapp.net/attachments/forward.webp"
        embed = "https://cdn.discordapp.com/attachments/embed.png"
        self.assertEqual(image_urls({
            "attachments": [{"filename": "direct.png", "url": direct},
                            {"filename": "bad.png", "url": "https://example.org/x.png"}],
            "message_snapshots": [{"message": {"attachments": [{"filename": "forward.webp", "url": forwarded}]}}],
            "embeds": [{"image": {"proxy_url": embed, "url": direct}}],
        }), [direct, embed, forwarded])

    def test_real_flyer_matches_published_events(self):
        parsed = parse_image(FLYER, dt.datetime.fromisoformat("2026-11-16T20:00:00+00:00"))
        self.assertEqual(parsed["weekStart"], "2026-11-16")
        self.assertEqual(parsed["sourceTimezone"], "GMT")
        self.assertEqual(parsed["noStreamDays"], ["2026-11-19"])
        self.assertEqual([(e["title"], e["start"], e["platform"]) for e in parsed["events"]], [
            ("My Hero Academia Season 5 E11", "2026-11-16T18:30:00Z", "got"),
            ("Wuthering Waves 2.5", "2026-11-17T20:30:00Z", "twitch"),
            ("My Hero Academia Season 5 E12", "2026-11-18T18:30:00Z", "patreon"),
            ("ONE PIECE E41-44", "2026-11-18T20:30:00Z", "rumble"),
            ("TBD", "2026-11-20T18:30:00Z", "patreon"),
            ("Jojo's P7 (SBR) E10", "2026-11-20T18:30:00Z", "patreon"),
            ("Charlotte E9-13", "2026-11-20T20:30:00Z", "rumble"),
            ("My Hero Academia Season 5 E13", "2026-11-21T18:30:00Z", "patreon"),
            ("Hell's Paradise S2 E10-12", "2026-11-21T20:30:00Z", "rumble"),
            ("Anime Tournament", "2026-11-22T20:30:00Z", "twitch"),
        ])
        self.assertIn("Saturday slot is flexible.", parsed["notes"])

    def test_year_boundary_and_invalid_date_range(self):
        posted = dt.datetime(2025, 12, 28, tzinfo=dt.timezone.utc)
        self.assertEqual(monday_from_header("Dec 29th - Jan 4th", posted), dt.date(2025, 12, 29))
        with self.assertRaises(ValueError):
            monday_from_header("Dec 29 - Jan 3", posted)

    def test_failed_candidate_does_not_change_published_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            current = root / "schedule.json"
            original = b'{"weekStart":"2026-11-16","events":[]}\n'
            current.write_bytes(original)
            bad = root / "unreadable.png"
            bad.write_bytes(b"not an image")
            args = argparse.Namespace(reparse=False, local_image=str(bad), posted="2026-11-16T00:00:00Z",
                                      dry_run=False, message_id=None)
            with self.assertRaisesRegex(RuntimeError, "last good schedule"):
                run(args, root)
            self.assertEqual(current.read_bytes(), original)
            self.assertFalse((root / "schedule").exists())

    def test_publish_preserves_previous_flyer_and_archive(self):
        old = FLYER.read_bytes()
        new = decode_flyer(old)
        digest = hashlib.sha256(new).hexdigest()
        original = {"weekStart": "2026-11-16", "events": [], "image": "schedule/latest.png?v=1"}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "schedule").mkdir()
            (root / "schedule/latest.png").write_bytes(old)
            publish(root, original, {"weekStart": "2026-11-23", "events": []},
                    new, {"id": "123456789012345678"}, digest)
            prior = read_json(root / "schedule/archive/2026-11-16.json")
            self.assertEqual((root / prior["image"]).read_bytes(), old)
            latest = read_json(root / "schedule.json")
            self.assertEqual((root / latest["image"]).read_bytes(), new)
            self.assertEqual(read_json(root / "schedule/state.json")["image_sha256"], digest)

    def test_discord_discovery_checks_edits_and_continues_after_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "schedule").mkdir()
            (root / "schedule.json").write_text('{"weekStart":"2026-11-16","events":[]}')
            (root / "schedule/state.json").write_text('{"message_id":"123456789012345678","image_sha256":"known"}')
            def mock_download(url, token=None):
                if "/messages" in url:
                    return b'''[
                      {"id":"123456789012345679","timestamp":"2026-11-17T00:00:00Z","attachments":[{"filename":"a.png","url":"https://cdn.discordapp.com/a.png"}]},
                      {"id":"123456789012345678","timestamp":"2026-11-16T00:00:00Z","edited_timestamp":"2026-11-18T00:00:00Z","attachments":[{"filename":"b.png","url":"https://cdn.discordapp.com/b.png"}]}
                    ]'''
                if token:
                    return b'{"id":"123456789012345670","name":"weekly-schedule"}'
                return b"fixture"
            args = argparse.Namespace(reparse=False, local_image=None, posted=None, dry_run=True, message_id=None)
            with patch.dict("os.environ", {"DISCORD_BOT_TOKEN": "mock", "DISCORD_CHANNEL_ID": "123456789012345670"}), \
                 patch("fetch_schedule.download", side_effect=mock_download) as downloader, \
                 patch("fetch_schedule.decode_flyer", return_value=b"fixture"), \
                 patch("fetch_schedule.hashlib.sha256") as hash_fn, \
                 patch("fetch_schedule.parse_image", return_value={"weekStart": "2026-11-16", "sourceTimezone": "GMT", "events": []}) as parse:
                hash_fn.return_value.hexdigest.side_effect = ["known", "new"]
                run(args, root)
            self.assertIn("https://cdn.discordapp.com/b.png", [call.args[0] for call in downloader.call_args_list])
            parse.assert_called_once()


if __name__ == "__main__":
    unittest.main()
