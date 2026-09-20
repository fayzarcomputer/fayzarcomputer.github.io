import unittest
import re
import os

class TestI18nDictionary(unittest.TestCase):
    def setUp(self):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        with open(os.path.join(base_dir, 'js', 'theme-lang.js'), 'r', encoding='utf-8') as f:
            content = f.read()

        bn_section = content[content.find('bn: {'):content.find('en: {')]
        en_section = content[content.find('en: {'):content.find('// =========================================================================\n  // 2. State Management')]

        self.bn_keys = set(re.findall(r'(\w+):\s*[\'"`]', bn_section))
        self.en_keys = set(re.findall(r'(\w+):\s*[\'"`]', en_section))
        self.base_dir = base_dir

    def test_bn_en_key_coverage(self):
        self.assertGreater(len(self.bn_keys), 150)
        self.assertGreater(len(self.en_keys), 150)

    def test_pages_have_i18n_and_defined_keys(self):
        pages = ['index.html', 'results.html', 'notices.html', 'services.html', 'portal.html', 'converter.html', 'tools.html', 'contact.html']
        for page in pages:
            with open(os.path.join(self.base_dir, page), 'r', encoding='utf-8') as f:
                html = f.read()
            tags = re.findall(r'data-i18n=["\']([^"\']+)["\']', html)
            placeholders = re.findall(r'data-i18n-placeholder=["\']([^"\']+)["\']', html)
            page_keys = set(tags + placeholders)
            
            # Each page must have at least 25 i18n tags
            self.assertGreaterEqual(len(page_keys), 25, f"{page} has too few i18n tags ({len(page_keys)})")

            # All keys must be present in both bn and en
            for k in page_keys:
                self.assertIn(k, self.bn_keys, f"Key '{k}' in {page} is missing from bn dictionary")
                self.assertIn(k, self.en_keys, f"Key '{k}' in {page} is missing from en dictionary")

if __name__ == '__main__':
    unittest.main()
