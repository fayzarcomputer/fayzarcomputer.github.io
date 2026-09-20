import unittest
import os
import json
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

class TestFullBilingualCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = [
            'index.html',
            'services.html',
            'portal.html',
            'converter.html',
            'tools.html',
            'results.html',
            'notices.html',
            'contact.html'
        ]
        with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
            cls.dictionary = json.load(f)

    def test_cache_coverage(self):
        """Verify that every unique Bengali string across all 8 pages has an English translation in the dictionary."""
        bengali_regex = re.compile(r'[\u0980-\u09FF]')
        
        class SimpleTextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.tag_stack = []
                self.texts = []
                self.in_script_or_style = False

            def handle_starttag(self, tag, attrs):
                attrs_dict = dict(attrs)
                has_i18n = 'data-i18n' in attrs_dict
                if tag in ('script', 'style'):
                    self.in_script_or_style = True
                self.tag_stack.append((tag, has_i18n))

            def handle_endtag(self, tag):
                if tag in ('script', 'style'):
                    self.in_script_or_style = False
                if self.tag_stack:
                    self.tag_stack.pop()

            def handle_data(self, data):
                if self.in_script_or_style:
                    return
                t = data.strip()
                if t and bengali_regex.search(t):
                    covered = any(h for _, h in self.tag_stack)
                    if not covered:
                        self.texts.append(t)

        all_missing = {}
        for p in self.pages:
            self.assertTrue(os.path.exists(p), f"Page {p} must exist")
            with open(p, 'r', encoding='utf-8') as f:
                html = f.read()
            ext = SimpleTextExtractor()
            ext.feed(html)
            
            missing_in_page = [txt for txt in ext.texts if txt not in self.dictionary]
            if missing_in_page:
                all_missing[p] = missing_in_page

        self.assertEqual(len(all_missing), 0, f"Missing translations for: {all_missing}")

    def test_theme_lang_integration(self):
        """Verify that js/theme-lang.js contains bilingualContentDict and tree walker translation."""
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        self.assertIn('bilingualContentDict', content, "js/theme-lang.js must include bilingualContentDict")
        self.assertIn('createTreeWalker', content, "js/theme-lang.js must include DOM text-node tree walker")
        self.assertIn('__orig_text', content, "js/theme-lang.js must support reversible text storage")

if __name__ == '__main__':
    unittest.main()
