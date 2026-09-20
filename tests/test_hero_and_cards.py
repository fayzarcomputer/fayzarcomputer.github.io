import unittest
import urllib.request
import re

class TestHeroAndCards(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()

    def test_hero_is_two_column(self):
        """Hero section should have side-by-side 2-column grid layout matching reference mockup."""
        self.assertIn('id="home"', self.html)
        # Should have a grid with column spans for side-by-side text & illustration
        self.assertTrue(
            ('lg:grid-cols-12' in self.html or 'lg:grid-cols-2' in self.html) and
            ('col-span' in self.html or 'lg:w-' in self.html),
            "Hero section should use a 2-column responsive layout"
        )

    def test_cards_have_no_gradient_box_containers(self):
        """Card illustrations should float directly on card background without heavy colored boxes."""
        # Find the services-grid section
        grid_match = re.search(r'<section id="services-grid".*?</section>', self.html, re.DOTALL)
        self.assertIsNotNone(grid_match, "services-grid section must exist")
        grid_content = grid_match.group(0)

        # None of the cards should wrap illustrations in heavy colored gradient box containers
        self.assertNotIn('from-emerald-50', grid_content, "Card 1 should not have an emerald gradient box container")
        self.assertNotIn('from-blue-50', grid_content, "Card 2 should not have a blue gradient box container")
        self.assertNotIn('from-indigo-50', grid_content, "Card 3 should not have an indigo gradient box container")
        self.assertNotIn('from-amber-50', grid_content, "Card 4 should not have an amber gradient box container")

    def test_cards_have_rich_vector_illustrations(self):
        """All 4 cards must have detailed vector illustrations matching reference mockup."""
        grid_match = re.search(r'<section id="services-grid".*?</section>', self.html, re.DOTALL)
        self.assertIsNotNone(grid_match)
        grid_content = grid_match.group(0)

        # Card 1 must have map, house, certificate deed
        self.assertIn('data-i18n="card1_title"', grid_content)
        # Card 2 must have online applications
        self.assertIn('data-i18n="card2_title"', grid_content)
        # Card 3 must have document typing
        self.assertIn('data-i18n="card3_title"', grid_content)
        # Card 4 must have printing & photostat
        self.assertIn('data-i18n="card4_title"', grid_content)

    def test_server_status(self):
        """Offline local server should respond with 200 OK."""
        try:
            req = urllib.request.urlopen('http://localhost:3000/index.html', timeout=5)
            self.assertEqual(req.getcode(), 200)
        except Exception as e:
            self.fail(f"Server request failed: {e}")

if __name__ == '__main__':
    unittest.main()
