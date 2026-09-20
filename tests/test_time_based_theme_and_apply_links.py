import unittest
import re

class TestTimeBasedThemeAndApplyLinks(unittest.TestCase):
    def setUp(self):
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            self.theme_js = f.read()
        with open('js/main.js', 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open('js/results-public.js', 'r', encoding='utf-8') as f:
            self.results_pub_js = f.read()
        with open('js/results-admin.js', 'r', encoding='utf-8') as f:
            self.results_adm_js = f.read()

    def test_time_based_theme_engine_present(self):
        """theme-lang.js must implement time-based day/night mode (6am-6pm day, 6pm-6am night)."""
        self.assertIn('function getTimeBasedTheme()', self.theme_js)
        self.assertIn('hour >= 6 && hour < 18', self.theme_js)
        self.assertIn('function determineInitialTheme()', self.theme_js)
        self.assertIn('getTimeBasedTheme', self.theme_js)

    def test_results_scripts_no_rogue_dark_mode(self):
        """results-public.js and results-admin.js must not force dark mode via prefers-color-scheme."""
        self.assertNotIn('prefers-color-scheme', self.results_pub_js, "results-public.js must not override theme via matchMedia")
        self.assertNotIn('prefers-color-scheme', self.results_adm_js, "results-admin.js must not override theme via matchMedia")
        self.assertNotIn('localStorage.theme', self.results_pub_js, "results-public.js must not use rogue localStorage.theme")
        self.assertNotIn('localStorage.theme', self.results_adm_js, "results-admin.js must not use rogue localStorage.theme")

    def test_direct_application_links_in_modals_and_cards(self):
        """Notice modal and notice cards must include direct application / circular links."""
        # 1. In openNoticeModal
        self.assertIn('অনলাইনে সরাসরি আবেদন / সার্কুলার লিংক', self.main_js)
        # 2. In hero mini notice board
        self.assertIn('আবেদন লিংক', self.main_js)
        # 3. In notices page feed
        self.assertIn('অনলাইনে সরাসরি আবেদন / সার্কুলার', self.main_js)

    def test_ticker_only_on_index(self):
        """Live notice ticker must strictly exist ONLY in index.html and nowhere else."""
        with open('index.html', 'r', encoding='utf-8') as f:
            index_html = f.read()
        self.assertIn('bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900', index_html, "index.html must have live ticker")

        subpages = ['services.html', 'portal.html', 'converter.html', 'tools.html', 'results.html', 'notices.html', 'contact.html']
        for p in subpages:
            with open(p, 'r', encoding='utf-8') as f:
                html = f.read()
            self.assertNotIn('bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900', html, f"{p} must not have live ticker")

if __name__ == '__main__':
    unittest.main()
