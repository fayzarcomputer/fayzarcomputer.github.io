import unittest
import json
import re

class TestSEOAndReviews(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            self.lang_js = f.read()

    def test_open_graph_meta_tags_present(self):
        """Must have Open Graph tags for Facebook/WhatsApp link sharing."""
        self.assertIn('<meta property="og:title"', self.html)
        self.assertIn('<meta property="og:description"', self.html)
        self.assertIn('<meta property="og:image"', self.html)
        self.assertIn('<meta property="og:url"', self.html)
        self.assertIn('<meta property="og:type" content="website"', self.html)
        self.assertIn('<meta name="twitter:card"', self.html)

    def test_json_ld_schema_validity(self):
        """Must have valid JSON-LD LocalBusiness schema with address and coordinates."""
        match = re.search(r'<script type="application/ld\+json">(.*?)</script>', self.html, re.DOTALL)
        self.assertIsNotNone(match, "JSON-LD script tag must be present in index.html")
        data = json.loads(match.group(1))
        self.assertIn(data.get('@type'), ['LocalBusiness', 'ProfessionalService'])
        self.assertIn('address', data)
        self.assertIn('geo', data)
        self.assertEqual(data['geo'].get('latitude'), 25.49824)
        self.assertIn('01717-101919', data.get('telephone', ''))

    def test_reviews_section_present_and_bilingual(self):
        """Reviews/Testimonials section must be present with high contrast and bilingual tags."""
        self.assertIn('id="reviews"', self.html, "Section #reviews must exist on homepage")
        self.assertIn('data-i18n="reviews_title"', self.html)
        self.assertIn('data-i18n="reviews_subtitle"', self.html)
        # Check theme-lang.js has the keys
        self.assertIn('reviews_title:', self.lang_js)
        self.assertIn('reviews_subtitle:', self.lang_js)

    def test_converter_quick_action_present(self):
        """Card 3 must feature a prominent quick action to the Unicode ⇄ Bijoy converter."""
        self.assertIn('data-i18n="card3_btn_quick"', self.html)

if __name__ == '__main__':
    unittest.main()
