import unittest

from check_patreon import PostLinkParser, match_event


class PatreonVerificationTests(unittest.TestCase):
    def test_sitemap_parser_extracts_public_post_links(self):
        parser = PostLinkParser()
        parser.feed('<a href="/gotgames/posts/example-123"> <b>One Piece</b> Episodes 36-39 </a>')
        self.assertEqual(len(parser.posts), 1)
        self.assertIn("One Piece Episodes 36-39", parser.posts[0]["title"])
        self.assertEqual(parser.posts[0]["url"], "https://www.patreon.com/gotgames/posts/example-123")

    def test_range_is_verified_and_extra_episode_is_recorded(self):
        event = {"title": "ONE PIECE E36-39", "platform": "rumble"}
        posts = [{
            "title": "ONE PIECE EPISODES 36-40 FULL REACTION",
            "url": "https://www.patreon.com/gotgames/posts/one-piece-36-40",
        }]
        result = match_event(event, posts)
        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["extra_episodes"], [40])

    def test_season_must_match(self):
        event = {"title": "My Hero Academia Season 5 E10", "platform": "rumble"}
        posts = [{
            "title": "MY HERO ACADEMIA EPISODE 10 SEASON 4 REACTION",
            "url": "https://www.patreon.com/gotgames/posts/mha-s4-10",
        }]
        self.assertEqual(match_event(event, posts)["status"], "pending")

    def test_partial_range_is_not_marked_verified(self):
        event = {"title": "Hell's Paradise S2 E7-10", "platform": "rumble"}
        posts = [{
            "title": "HELL'S PARADISE SEASON 2 EPISODES 7-8",
            "url": "https://www.patreon.com/gotgames/posts/hp-s2-7-8",
        }]
        result = match_event(event, posts)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["missing_episodes"], [9, 10])

    def test_movie_title_can_match_without_episode_numbers(self):
        event = {"title": "The Bodyguard", "platform": "rumble"}
        posts = [{
            "title": "THE BODYGUARD FULL MOVIE REACTION",
            "url": "https://www.patreon.com/gotgames/posts/bodyguard",
        }]
        self.assertEqual(match_event(event, posts)["status"], "verified")


if __name__ == "__main__":
    unittest.main()
