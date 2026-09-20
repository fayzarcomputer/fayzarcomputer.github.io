import unittest
import re

class TestBilingualAndCleanHome(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            self.lang_js = f.read()

    def test_homepage_is_clean_no_19_service_dump(self):
        """Homepage must be clean and not contain the heavy #all-services 19-item catalog."""
        self.assertNotIn('id="all-services"', self.html, "Heavy #all-services section must be removed from homepage")
        self.assertNotIn('আমাদের ১৯টি ডিজিটাল সেবার তালিকা', self.html, "Heavy 19-service title must not be on homepage")

    def test_shop_title_matches_user_requirement(self):
        """Shop title must be Fayzar Computer & Photostat in both BN and EN, not domain."""
        self.assertIn("hero_title: 'ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট'", self.lang_js)
        self.assertIn("hero_title: 'Fayzar Computer & Photostat'", self.lang_js)

    def test_bilingual_keys_parity(self):
        """All keys defined in Bengali dictionary must have an English translation."""
        bn_block_match = re.search(r'bn:\s*\{(.*?)\},\s*en:\s*\{', self.lang_js, re.DOTALL)
        en_block_match = re.search(r'en:\s*\{(.*?)\}\s*\};', self.lang_js, re.DOTALL)
        self.assertIsNotNone(bn_block_match, "bn dictionary must be found")
        self.assertIsNotNone(en_block_match, "en dictionary must be found")
        
        bn_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+)\s*:\s*[\'"`]', bn_block_match.group(1), re.MULTILINE))
        en_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+)\s*:\s*[\'"`]', en_block_match.group(1), re.MULTILINE))

        missing_in_en = bn_keys - en_keys
        self.assertEqual(len(missing_in_en), 0, f"Keys missing in English translation: {missing_in_en}")

    def test_all_nav_items_have_i18n(self):
        """All navigation menu items must have data-i18n tags."""
        expected_nav_keys = [
            'nav_home', 'nav_land', 'nav_services', 'nav_notices', 
            'nav_tools', 'nav_results', 'nav_links', 'nav_contact'
        ]
        for key in expected_nav_keys:
            self.assertIn(f'data-i18n="{key}"', self.html, f"Nav key {key} must be present in index.html")

    def test_footer_has_bilingual_coverage(self):
        """Footer must have proper data-i18n tags for bilingual display."""
        expected_footer_keys = ['footer_desc', 'footer_rights', 'footer_approval', 'footer_proprietor']
        for key in expected_footer_keys:
            self.assertIn(f'data-i18n="{key}"', self.html, f"Footer key {key} must be present in index.html")

if __name__ == '__main__':
    unittest.main()
