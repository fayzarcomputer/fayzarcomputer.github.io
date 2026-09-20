import unittest
import os
import re

class TestAllPagesUnifiedUI(unittest.TestCase):
    def check_unified_nav_and_ticker(self, filename, active_label):
        with open(filename, 'r', encoding='utf-8') as f:
            html = f.read()

        # 1. Must NOT have old dark aside topbar
        self.assertNotIn('<aside class="bg-slate-900', html, f"Old dark aside topbar must be removed from {filename}")
        self.assertNotIn('<header class="sticky top-0 z-40 glass-header', html, f"Old glass header must be replaced in {filename}")

        # 2. Must have unified sticky nav
        self.assertIn('<nav class="bg-white dark:bg-[#080d1a] shadow-md sticky w-full z-50 top-0', html, f"Unified sticky nav must be present in {filename}")

        # 3. Logo and brand text
        self.assertIn('data-i18n="brand_name">ফয়জার কম্পিউটার</span>', html, f"Brand name must be present in {filename}")
        self.assertIn('সরকার অনুমোদিত ডিজিটাল ও ভূমিসেবা কেন্দ্র', html, f"Gov approved center tagline must be present in {filename}")

        # 4. Top micro-capsule
        self.assertIn('bg-gradient-to-r from-emerald-600 to-teal-600', html, f"Top micro capsule must be present in {filename}")
        self.assertIn('data-i18n="topbar_status"', html, f"topbar_status must be present in {filename}")
        self.assertIn('id="lang-btn-bn"', html, f"lang-btn-bn must be present in {filename}")
        self.assertIn('id="lang-btn-en"', html, f"lang-btn-en must be present in {filename}")
        self.assertIn('id="theme-toggle-btn"', html, f"theme-toggle-btn must be present in {filename}")

        # 5. Desktop nav links
        self.assertIn('id="desktop-nav-links"', html, f"#desktop-nav-links must be present in {filename}")
        for label in ['হোম', 'সার্ভিস', 'জব', 'কনভার্টার', 'টুলস', 'রেজাল্ট', 'কন্টাক্ট']:
            self.assertIn(label, html, f"Short link '{label}' must be present in {filename}")

        # 6. Active pill check
        if active_label:
            # Active item must have font-extrabold and emerald pill styling
            active_pattern = rf'<a[^>]*class="[^"]*text-\[#075e24\][^"]*bg-emerald-50[^"]*font-extrabold[^"]*"[^>]*>.*?{re.escape(active_label)}'
            self.assertTrue(re.search(active_pattern, html, re.DOTALL), f"Active link '{active_label}' in {filename} must have active pill class")

        # 7. Live notice ticker: strictly ONLY in index.html, absent in other pages per user instruction
        if filename == 'index.html':
            self.assertIn('bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900', html, f"Live notice ticker must be present on {filename}")
        else:
            self.assertNotIn('bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900', html, f"Live notice ticker must NOT be present on {filename}")

        # 8. Offline compliance
        self.assertNotIn('https://cdn.tailwindcss.com', html, f"CDN tailwind must not be in {filename}")
        self.assertNotIn('https://cdnjs.cloudflare.com', html, f"CDN icons must not be in {filename}")

    def test_index_unified_ui(self):
        self.check_unified_nav_and_ticker('index.html', 'হোম')

    def test_services_unified_ui(self):
        self.check_unified_nav_and_ticker('services.html', 'সার্ভিস')

    def test_converter_unified_ui(self):
        self.check_unified_nav_and_ticker('converter.html', 'কনভার্টার')

    def test_portal_unified_ui(self):
        self.check_unified_nav_and_ticker('portal.html', 'জব')

    def test_tools_unified_ui(self):
        self.check_unified_nav_and_ticker('tools.html', 'টুলস')

    def test_results_unified_ui(self):
        self.check_unified_nav_and_ticker('results.html', 'রেজাল্ট')

    def test_notices_unified_ui(self):
        self.check_unified_nav_and_ticker('notices.html', None)

    def test_contact_unified_ui(self):
        self.check_unified_nav_and_ticker('contact.html', 'কন্টাক্ট')

if __name__ == '__main__':
    unittest.main()
