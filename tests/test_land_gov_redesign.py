import unittest
import re
import os

class TestLandGovRedesign(unittest.TestCase):
    def setUp(self):
        self.html_path = 'index.html'
        with open(self.html_path, 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            self.lang_js = f.read()

    def test_pure_white_sticky_header_without_dark_topbar(self):
        """Header must be a single sticky white bar with no dark topbar."""
        # No dark aside topbar
        self.assertNotIn('<aside aria-label="Quick contact & controls" class="bg-slate-900', self.html, "Dark aside topbar must be removed")
        # Must have sticky white nav
        self.assertTrue(re.search(r'<nav[^>]*class="[^"]*bg-white[^"]*sticky[^"]*top-0', self.html), "Must have a sticky white nav bar")

    def test_topbar_helpline_and_identity_present(self):
        """Topbar must have 16122 land helpline, shop hotline, and approved LSFC badge."""
        self.assertIn('16122', self.html, "Land services 16122 helpline must be in topbar/header")
        self.assertIn('01717-101919', self.html, "Shop hotline 01717-101919 must be in topbar/header")
        self.assertIn('এলএসএসএফসি', self.html, "Government approved LSFC identification must be present in header")

    def test_land_gov_pill_and_action_buttons(self):
        """Header must have exact land.gov.bd [বাং | EN] pill button and bottle-green rounded action button."""
        self.assertIn('id="lang-btn-bn"', self.html, "Must have #lang-btn-bn")
        self.assertIn('id="lang-btn-en"', self.html, "Must have #lang-btn-en")
        self.assertIn('বাং', self.html, "Must contain বাং text")
        self.assertIn('EN', self.html, "Must contain EN text")

    def test_gov_style_navbar_structure(self):
        """Navbar must feature clean gov-portal navigation links with 18px text and dropdowns."""
        expected_nav_items = [
            'nav_home', 'nav_land', 'nav_applications', 'nav_converter',
            'nav_print_studio', 'nav_notices', 'nav_contact'
        ]
        for item in expected_nav_items:
            self.assertIn(f'data-i18n="{item}"', self.html, f"Nav item {item} must be in navbar")

    def test_hero_helpline_callout(self):
        """Hero section must have the land.gov.bd style dedicated 16122 helpline callout card."""
        self.assertIn('১৬১২২', self.html, "Giant 16122 helpline must be in hero section")
        self.assertIn('01717-101919', self.html, "Shop phone must be in hero section")

    def test_services_grid_has_eight_clean_cards(self):
        """Services section must contain 8 structured clean service card boxes with top color stripes."""
        cards = re.findall(r'class="[^"]*service-card[^"]*"', self.html)
        self.assertEqual(len(cards), 8, f"Must have exactly 8 structured service cards, found {len(cards)}")
        
        # Verify color stripes are present
        self.assertIn('#227ca5', self.html, "E-mutation sky blue stripe must be present")
        self.assertIn('#0414c3', self.html, "LD Tax royal blue stripe must be present")
        self.assertIn('#00dfdf', self.html, "Porcha cyan stripe must be present")
        self.assertIn('#db0f66', self.html, "Jobs magenta stripe must be present")

        # Verify essential service titles are present
        required_services = [
            'service_mutation',       # ই-নামজারি
            'service_ldtax',          # ভূমি উন্নয়ন কর
            'service_porcha',         # খতিয়ান ও মৌজা ম্যাপ
            'service_jobs',           # অনলাইন চাকরির আবেদন
            'service_converter',      # বাংলা কনভার্টার
            'service_photostat',      # ছবি প্রিন্ট ও ফটোকপি
            'service_registration',   # জন্ম-মৃত্যু নিবন্ধন
            'service_results'         # পরীক্ষার রেজাল্ট
        ]
        for s in required_services:
            self.assertIn(f'data-i18n="{s}_title"', self.html, f"Service card {s} must be present")

    def test_bilingual_dictionary_coverage_for_new_items(self):
        """All new navbar and service keys must exist in both Bengali and English in theme-lang.js."""
        required_keys = [
            'topbar_helpline', 'topbar_timing',
            'nav_applications', 'nav_converter', 'nav_print_studio',
            'search_placeholder',
            'service_mutation_title', 'service_mutation_desc',
            'service_ldtax_title', 'service_ldtax_desc',
            'service_porcha_title', 'service_porcha_desc',
            'service_jobs_title', 'service_jobs_desc',
            'service_converter_title', 'service_converter_desc',
            'service_photostat_title', 'service_photostat_desc',
            'service_registration_title', 'service_registration_desc',
            'service_results_title', 'service_results_desc'
        ]
        for k in required_keys:
            self.assertIn(f"{k}:", self.lang_js, f"Key {k} must exist in theme-lang.js")

if __name__ == '__main__':
    unittest.main()
