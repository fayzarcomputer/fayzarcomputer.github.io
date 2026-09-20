import unittest
import re

class TestV2SyncAndShortNav(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
            self.lang_js = f.read()

    def test_short_nav_items_present(self):
        """Navbar text must be concise (Short) like v2: হোম, সার্ভিস, জব, কনভার্টার, টুলস, রেজাল্ট, কন্টাক্ট, লগইন."""
        nav_match = re.search(r'<div[^>]*id="desktop-nav-links"[^>]*>(.*?)</div>', self.html, re.DOTALL)
        if not nav_match:
            nav_match = re.search(r'<div class="[^"]*items-center[^>]*text-\[[^"]*font-medium[^>]*>(.*?)</div>', self.html, re.DOTALL)
        self.assertIsNotNone(nav_match, "Main desktop nav container must exist")
        nav_text = nav_match.group(1)

        # Check short labels
        short_labels = ['হোম', 'সার্ভিস', 'জব', 'কনভার্টার', 'টুলস', 'রেজাল্ট', 'কন্টাক্ট']
        for label in short_labels:
            self.assertIn(label, nav_text, f"Short nav label '{label}' must be in desktop menubar")

        # Login button must be removed per user request
        self.assertNotIn('>লগইন<', nav_text, "Login button must be removed from desktop menubar")

        # Verbose labels must NOT be in top-level nav links
        verbose_labels = ['আমাদের সম্পর্কে', 'অনলাইন আবেদন', 'বাংলা কনভার্টার', 'প্রিন্ট ও স্টুডিও', 'নোটিশ সমূহ']
        for verbose in verbose_labels:
            self.assertNotIn(f'>{verbose}<', nav_text, f"Verbose nav label '{verbose}' should not be top-level text in menubar")

    def test_v2_real_address_and_timings(self):
        """Homepage must have real address, timings, postal code, and proprietor from v2."""
        self.assertIn('ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে', self.html)
        self.assertIn('৫২৬০', self.html)
        self.assertIn('মোঃ ফয়জার আলী', self.html)
        self.assertIn('fayzar.computer@gmail.com', self.html)

    def test_v2_live_ticker_and_autofill_present(self):
        """Must have v2 live notice ticker and 1-click AutoFill extension download."""
        self.assertIn('চলমান সরকারি চাকরি ও স্কুল-কলেজ সংক্রান্ত নোটিশ', self.html)
        self.assertIn('Fayzar-AutoFill-Setup.exe', self.html)

    def test_v2_tools_and_checklist_present(self):
        """Must have the 4 digital self-service tools on index.html; checklist is moved to services.html."""
        self.assertIn('অফিস ও প্রশ্নপত্র কনভার্টার', self.html)
        self.assertIn('টেলিটক ছবি ও স্বাক্ষর', self.html)
        self.assertIn('চাকরির বয়স ক্যালকুলেটর', self.html)
        self.assertIn('জমি ও দলিল ফি হিসাব', self.html)
        # Checklist has been moved from index.html to services.html per user instruction
        self.assertNotIn('id="home-checklist-section"', self.html, "Checklist section must be removed from index.html")

    def test_no_dropdown_under_services_nav(self):
        """In index.html, 'সার্ভিস' must be a direct link without dropdown options."""
        self.assertNotIn('১৯টি প্রধান নাগরিক সেবা', self.html, "Service dropdown item should be removed")
        self.assertNotIn('সেবামূল্য ও চেকলিস্ট ক্যালকুলেটর', self.html, "Service dropdown item should be removed")
        self.assertIn('href="services.html"', self.html)

    def test_services_page_checklist_and_master_rate_table(self):
        """services.html must have checklist at top, categorized sections, and single master rate table at end."""
        with open('services.html', 'r', encoding='utf-8') as f:
            services_html = f.read()

        # Checklist at top with pre-rendered options and initial card
        self.assertIn('id="home-checklist-section"', services_html, "Checklist section must be placed on services.html")
        self.assertIn('calc-service-select', services_html)
        self.assertIn('calc-result-display', services_html)
        self.assertIn('<option value="e-mutation"', services_html, "Checklist select must have pre-rendered options")
        self.assertIn('ই-নামজারি ও রেকর্ড খারিজ', services_html, "Checklist must have pre-rendered initial card")

        # Navbar matches homepage (single sticky nav with top right capsule)
        self.assertIn('bg-gradient-to-r from-emerald-600 to-teal-600', services_html, "Services nav must have top right micro-capsule like homepage")
        self.assertNotIn('<aside class="bg-[#f0f2f5]', services_html, "Old two-tier aside must be removed")

        # Categorized service sections (3 categories)
        self.assertIn('ডিজিটাল ভূমিসেবা', services_html)
        self.assertIn('অনলাইন নাগরিক', services_html)
        self.assertIn('কম্পিউটার ও স্টুডিও', services_html)

        # Unified single table rate chart at the bottom
        self.assertIn('id="rate-chart"', services_html)
        self.assertIn('id="master-rate-table"', services_html)
        self.assertIn('বাংলা অথবা ইংরেজি: প্রতি পৃষ্ঠা', services_html)
        self.assertIn('A4 পেজ প্রতি পৃষ্ঠা', services_html)
        self.assertIn('পাসপোর্ট / স্ট্যাম্প সাইজ', services_html)
        self.assertIn('ই-নামজারি', services_html)

    def test_v2_location_map_and_feedback_present(self):
        """Must have Google Map iframe and customer feedback form from v2."""
        self.assertIn('maps.google.com', self.html)
        self.assertIn('contactFeedbackForm', self.html)
        self.assertIn('https://wa.me/8801717101919', self.html)

    def test_compact_header_and_colored_topbar_specs(self):
        """Header must have compact padding, colored green top strip, shop status, and no LSFC badge next to logo."""
        # Colored top strip
        self.assertIn('#075e24', self.html, "Top strip must have government green color")
        self.assertIn('rounded-l-full', self.html, "Top-right green strip must have authentic rounded-l-full shape")
        self.assertIn('data-i18n="topbar_status"', self.html, "Top strip must have topbar_status i18n key")
        self.assertIn('দোকান খোলা আছে (রাত ৯টা পর্যন্ত)', self.html, "Shop open status must be present in top strip")

        # Old tagline should not be in the top strip
        top_strip = re.search(r'data-i18n="topbar_status"[^>]*>(.*?)</span>', self.html)
        self.assertIsNotNone(top_strip)
        self.assertEqual(top_strip.group(1).strip(), 'দোকান খোলা আছে (রাত ৯টা পর্যন্ত)')

        # Logo brand container must NOT have [এলএসএসএফসি] badge box
        logo_match = re.search(r'<a href="#home"[^>]*>(.*?)</a>', self.html, re.DOTALL)
        self.assertIsNotNone(logo_match, "Logo container must exist")
        self.assertNotIn('এলএসএসএফসি', logo_match.group(1), "LSFC badge must be deleted from next to Fayzar Computer logo")

        # theme-lang.js dictionary coverage
        self.assertIn("topbar_status:", self.lang_js)

    def test_compact_service_cards_and_gov_links(self):
        """services.html category cards must be compact with official government links."""
        with open('services.html', 'r', encoding='utf-8') as f:
            html = f.read()

        cat_section = html[html.find('id="categorized-services"'):html.find('id="rate-chart"')]
        self.assertTrue(len(cat_section) > 0, "Categorized services section must exist")

        # 3 Category titles
        self.assertIn('ডিজিটাল ভূমিসেবা ও রেকর্ড ব্যবস্থাপনা', cat_section)
        self.assertIn('অনলাইন নাগরিক ও ক্যারিয়ার আবেদন', cat_section)
        self.assertIn('কম্পিউটার, কম্পোজ, প্রিন্ট ও স্টুডিও সেবা', cat_section)

        # Essential government portal links
        gov_urls = [
            'mutation.land.gov.bd',
            'ldtax.gov.bd',
            'eporcha.gov.bd',
            'dlrs.gov.bd',
            'alljobs.teletalk.com.bd',
            'epassport.gov.bd',
            'pcc.police.gov.bd',
            'gd.police.gov.bd',
            'services.nidw.gov.bd',
            'bdris.gov.bd',
            'incometax.gov.bd',
            'etaxnbr.gov.bd',
            'etradelicense.gov.bd',
            'bsp.brta.gov.bd',
            'converter.html',
            'tools.html'
        ]
        for url in gov_urls:
            self.assertIn(url, cat_section, f"Government / tool URL {url} must be present on a service card")

        # Ensure cards have external target blank
        self.assertIn('target="_blank" rel="noopener"', cat_section)

        # Ensure cards are neat with top color bar and no detailed fee tables inside the cards
        self.assertIn('style="background:#', cat_section)
        self.assertNotIn('প্রয়োজনীয় কাগজপত্র:', cat_section, "Cards should not contain bulky document checklists")


if __name__ == '__main__':
    unittest.main()
