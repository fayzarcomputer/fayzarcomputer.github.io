import re

NOTICES_PATH = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\notices.html'

with open(NOTICES_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove meta refresh and instant redirect script so notices.html can display its UI
content = re.sub(r'<!-- Instant Redirect to Job Sector / Portal Notice Board -->\s*<meta http-equiv="refresh"[^>]*>\s*<script>\s*window\.location\.replace\([^)]*\);\s*</script>', '', content)

# 2. Add theme-lang.js in head
if 'js/theme-lang.js' not in content:
    content = content.replace(
        '<script src="js/offline-data.js"></script>',
        '<script src="js/offline-data.js"></script>\n  <script src="js/theme-lang.js"></script>'
    )

# 3. Replace old aside and header
old_nav_pattern = re.compile(
    r'<!-- Top Announcement Bar -->\s*<aside class="bg-slate-900.*?</header>',
    re.DOTALL
)

unified_nav = '''  <!-- ========================================================================= -->
  <!-- 1. AUTHENTIC land.gov.bd STYLE STICKY WHITE NAVIGATION BAR                -->
  <!-- ========================================================================= -->
  <nav class="bg-white dark:bg-[#080d1a] shadow-md sticky w-full z-50 top-0 transition-colors border-b border-slate-100 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center py-1.5 lg:py-1">
      
      <!-- Left: Official Logo + Title (Clean, Spacious, NO background card, NO LSFC badge) -->
      <a href="index.html" class="py-0.5 flex items-center gap-2 sm:gap-3 group shrink-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-base sm:text-lg lg:text-xl shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
          <i class="fa-solid fa-landmark text-base sm:text-lg lg:text-xl"></i>
        </div>
        <div>
          <span class="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white block leading-tight">
            <span data-i18n="brand_name">ফয়জার কম্পিউটার</span>
          </span>
          <span class="hidden sm:block text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
            সরকার অনুমোদিত ডিজিটাল ও ভূমিসেবা কেন্দ্র
          </span>
        </div>
      </a>

      <!-- Right: Two-Tier Layout (Subtle Top Micro-Bar + Auto-Adjusting Nav Links Always Visible on Top) -->
      <div class="flex flex-col justify-end items-end shrink-0 ml-2 sm:ml-4 xl:ml-8">
        
        <!-- Top Tier: Compact Sleek Micro-Capsule (Softer Light-Emerald Gradient, Crisp White Text, Radiant Amber Theme Icon) -->
        <div class="w-full flex justify-end mb-0.5">
          <div class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-l-full shadow-2xs border border-emerald-500/30">
            
            <!-- Live Status -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-200 animate-pulse shrink-0"></span>
              <span class="text-white font-bold text-[10px] sm:text-[11px] lg:text-[11.5px] tracking-wide whitespace-nowrap" data-i18n="topbar_status">দোকান খোলা আছে (রাত ৯টা পর্যন্ত)</span>
            </div>

            <!-- [ বাং | EN ] Pill + Radiant Theme Toggle -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              <div class="flex border border-white/60 rounded overflow-hidden text-[10px] sm:text-[10.5px] font-bold shadow-2xs">
                <button type="button" id="lang-btn-bn" onclick="setLanguage('bn')" class="px-1.5 sm:px-2 py-0.2 bg-emerald-800 text-white font-bold cursor-pointer transition">বাং</button>
                <button type="button" id="lang-btn-en" onclick="setLanguage('en')" class="px-1.5 sm:px-2 py-0.2 bg-white text-emerald-800 font-bold hover:bg-emerald-50 cursor-pointer transition">EN</button>
              </div>

              <!-- Day/Night Mode Toggle (Bright Amber Glow Icon, 100% visible on green) -->
              <button type="button" id="theme-toggle-btn" class="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-amber-300 hover:text-amber-200 transition cursor-pointer shadow-xs" title="Switch Theme">
                <i id="theme-icon" class="fa-solid fa-moon text-xs text-amber-300"></i>
              </button>
            </div>

          </div>
        </div>

        <!-- Bottom Tier: Main Navigation Links (Always on Top, Auto-Adjusts font size and gap when resized) -->
        <div id="desktop-nav-links" class="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2.5 xl:gap-3 py-0.5 sm:py-1 text-[11.5px] sm:text-[12.5px] md:text-[13.5px] lg:text-[14.5px] xl:text-[15.5px] font-medium text-[#121212] dark:text-slate-100 whitespace-nowrap">
          <!-- 1. হোম -->
          <a href="index.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_home">হোম</a>

          <!-- 2. সার্ভিস -->
          <a href="services.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_services_short">সার্ভিস</a>

          <!-- 3. জব -->
          <a href="portal.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_jobs_short">জব</a>

          <!-- 4. কনভার্টার -->
          <a href="converter.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_converter_short">কনভার্টার</a>

          <!-- 5. টুলস -->
          <a href="tools.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_tools_short">টুলস</a>

          <!-- 6. রেজাল্ট -->
          <a href="results.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_results_short">রেজাল্ট</a>

          <!-- 7. কন্টাক্ট -->
          <a href="contact.html" class="py-0.5 px-1.5 sm:px-2 lg:px-2.5 rounded-md hover:text-[#075e24] hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition font-bold" data-i18n="nav_contact_short">কন্টাক্ট</a>
        </div>

      </div>

    </div>

    <!-- Hidden i18n Tags for SEO & Multi-Language Compatibility -->
    <div class="hidden" aria-hidden="true">
      <span data-i18n="nav_land">নাগরিক ভূমিসেবা</span>
      <span data-i18n="nav_applications">অনলাইন আবেদন</span>
      <span data-i18n="nav_converter">বাংলা কনভার্টার</span>
      <span data-i18n="nav_print_studio">প্রিন্ট ও স্টুডিও</span>
      <span data-i18n="nav_notices">নোটিশ ও সার্কুলার</span>
      <span data-i18n="nav_links">প্রয়োজনীয় ওয়েবলিংক</span>
      <span data-i18n="nav_services">অন্যান্য সেবাসমূহ</span>
      <span data-i18n="nav_tools">টুলস</span>
      <span data-i18n="nav_results">ফলাফল</span>
      <span data-i18n="nav_contact">যোগাযোগ</span>
    </div>
  </nav>

  <!-- ========================================================================= -->
  <!-- 2. LIVE NOTICE & INFORMATION TICKER (v2 Sync - Ultra Slim)                -->
  <!-- ========================================================================= -->
  <div class="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white text-[11px] sm:text-xs py-0.5 sm:py-1 px-3 sm:px-4 shadow-2xs flex items-center gap-2 sm:gap-3 overflow-hidden border-b border-emerald-700/40 min-h-0">
    <div class="flex items-center gap-1 shrink-0 bg-emerald-600 text-white px-2 py-0.2 rounded-full text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider shadow-xs">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
      <span>লাইভ নোটিশ</span>
    </div>
    <div class="overflow-hidden whitespace-nowrap grow font-medium text-slate-100 text-[11px] sm:text-[11.5px] leading-tight">
      <span class="inline-block">ই-নামজারি, খাজনা দাখিলা, ই-পাসপোর্ট, চাকরির আবেদন ও কম্পোজ-প্রিন্ট সেবা প্রতিদিন সকাল ৮টা থেকে রাত ৯টা পর্যন্ত সচল — হেল্পলাইন: 01717-101919 | ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর</span>
    </div>
  </div>'''

match = old_nav_pattern.search(content)
if not match:
    raise ValueError("Could not find old header in notices.html")

content = content[:match.start()] + unified_nav + content[match.end():]

# 4. Standard modern 4-column footer
old_footer_pattern = re.compile(
    r'<!-- Footer -->\s*<footer class="bg-slate-900.*?</footer\s*>',
    re.DOTALL
)

unified_footer = '''  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400 border-t-4 border-emerald-600 pt-12 pb-8 text-xs mt-12">
    <div class="container mx-auto max-w-6xl px-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
        <div class="space-y-2">
          <div class="text-base font-black text-white">
            ফয়জার <span class="text-emerald-400">কম্পিউটার</span>
          </div>
          <p class="text-amber-400 font-bold">প্রোপ্রাইটর: মোঃ ফয়জার আলী</p>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            সরকার অনুমোদিত ডিজিটাল ভূমিসেবা, সরকারি চাকরির আবেদন, টেলিটক ছবি রিসাইজ ও ইউনিকোড-বিজয় কনভার্টার কেন্দ্র।
          </p>
        </div>
        <div>
          <div class="text-white font-bold mb-2">দ্রুত লিংক</div>
          <ul class="space-y-1.5 text-[11px]">
            <li><a href="index.html" class="text-slate-300 hover:text-emerald-400">হোম</a></li>
            <li><a href="services.html" class="text-slate-300 hover:text-emerald-400">সার্ভিস</a></li>
            <li><a href="portal.html" class="text-slate-300 hover:text-emerald-400">জব</a></li>
            <li><a href="converter.html" class="text-slate-300 hover:text-emerald-400">কনভার্টার</a></li>
            <li><a href="tools.html" class="text-slate-300 hover:text-emerald-400">টুলস</a></li>
            <li><a href="results.html" class="text-slate-300 hover:text-emerald-400">রেজাল্ট</a></li>
            <li><a href="contact.html" class="text-slate-300 hover:text-emerald-400">কন্টাক্ট</a></li>
          </ul>
        </div>
        <div>
          <div class="text-white font-bold mb-2">জনপ্রিয় অনলাইন টুলস</div>
          <ul class="space-y-1.5 text-[11px]">
            <li><a href="converter.html" class="text-slate-300 hover:text-emerald-400">ফয়জার সার্বজনীন কনভার্টার</a></li>
            <li><a href="tools.html?tab=resizer" class="text-slate-300 hover:text-emerald-400">টেলিটক ছবি ও স্বাক্ষর রিসাইজার</a></li>
            <li><a href="tools.html?tab=age" class="text-slate-300 hover:text-emerald-400">চাকরির বয়স ক্যালকুলেটর</a></li>
            <li><a href="tools.html?tab=land" class="text-slate-300 hover:text-emerald-400">দলিল রেজিস্ট্রি ফি ক্যালকুলেটর</a></li>
          </ul>
        </div>
        <div>
          <div class="text-white font-bold mb-2">যোগাযোগের ঠিকানা</div>
          <div class="space-y-1.5 text-[11px] text-slate-300">
            <p>ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর।</p>
            <p class="text-emerald-400 font-bold">ফোন: 01717-101919</p>
            <p>ইমেইল: fayzar.computer@gmail.com</p>
          </div>
        </div>
      </div>
      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>© ২০২৫-২০২৬ ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট। সর্বস্বত্ব সংরক্ষিত।</div>
        <div class="text-slate-400">অনুমোদন পত্র নং: দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫</div>
      </div>
    </div>
  </footer>'''

match_footer = old_footer_pattern.search(content)
if not match_footer:
    raise ValueError("Could not find old footer in notices.html")

content = content[:match_footer.start()] + unified_footer + content[match_footer.end():]

with open(NOTICES_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("notices.html successfully updated!")
