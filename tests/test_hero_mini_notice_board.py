import unittest
import re

class TestHeroMiniNoticeBoard(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open('js/main.js', 'r', encoding='utf-8') as f:
            self.js = f.read()

    def test_hero_notice_board_elements_present(self):
        """Hero notice board must have all required structural elements and IDs."""
        self.assertIn('id="hero-notice-board"', self.html, "Must have #hero-notice-board in hero section")
        self.assertIn('id="hero-notices-container"', self.html, "Must have #hero-notices-container for dynamic cards")
        self.assertIn('id="hero-notice-counter"', self.html, "Must have #hero-notice-counter for slide indicator")
        self.assertIn('id="hero-notice-prev"', self.html, "Must have #hero-notice-prev for previous slide")
        self.assertIn('id="hero-notice-next"', self.html, "Must have #hero-notice-next for next slide")

    def test_hero_notice_board_dimensions(self):
        """Hero notice board must maintain exact container constraints (max-w-md)."""
        self.assertIn('max-w-md', self.html, "Hero notice board must maintain max-w-md width")
        self.assertIn('rounded-2xl', self.html, "Hero notice board must have rounded-2xl corners")

    def test_js_controller_configuration(self):
        """JavaScript controller must batch by 2, cycle automatically, and support modal popups."""
        self.assertIn('function initHeroMiniNoticeBoard()', self.js, "Must define initHeroMiniNoticeBoard()")
        self.assertIn('initHeroMiniNoticeBoard()', self.js, "Must call initHeroMiniNoticeBoard()")
        self.assertIn('const batchSize = 2', self.js, "Must show exactly 2 notices per batch")
        self.assertIn('4500', self.js, "Auto rotation timer must be 4.5 seconds (4500ms)")
        self.assertIn('openNoticeModal', self.js, "Must open modal on card click")

    def test_offline_integrity(self):
        """All assets and icons used must remain 100% offline without external CDNs."""
        self.assertNotIn('https://cdn.', self.html, "No CDN links allowed")
        self.assertNotIn('https://cdnjs.', self.html, "No cdnjs links allowed")

if __name__ == '__main__':
    unittest.main()
