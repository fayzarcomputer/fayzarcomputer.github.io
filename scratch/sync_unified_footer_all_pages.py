import os
import re

TARGET_PAGES = [
    'index.html',
    'services.html',
    'portal.html',
    'tools.html',
    'results.html',
    'notices.html',
    'contact.html',
    'converter.html'
]

FOOTER_TEMPLATE = '''  <!-- ========================================================================= -->
  <!-- FOOTER                                                                    -->
  <!-- ========================================================================= -->
  <footer class="bg-slate-900 text-slate-300 py-12 px-4 border-t border-slate-800 mt-12{no_print}">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
        
        <!-- Col 1: Brand & LSFC Authorization -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
              <i class="fa-solid fa-landmark"></i>
            </div>
            <span class="text-base font-black text-white">ফয়জার কম্পিউটার</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed mb-3" data-i18n="footer_desc">
            সরকার অনুমোদিত ডিজিটাল ও উন্মুক্ত ভূমিসেবা কেন্দ্র (LSFC)। অনুমোদন নং: <strong class="text-emerald-400">দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫</strong>।
          </p>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-bold">
            <i class="fas fa-shield-halved"></i> <span data-i18n="footer_approval">সরকারি নির্দেশিকা ও ফি তালিকাভুক্ত</span>
          </div>
        </div>

        <!-- Col 2: Quick Links -->
        <div>
          <h4 class="text-sm font-black text-white mb-3 flex items-center gap-2">
            <i class="fas fa-link text-emerald-400"></i> দ্রুত নেভিগেশন
          </h4>
          <ul class="space-y-2 text-xs text-slate-400">
            <li><a href="index.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> হোমপেজ</a></li>
            <li><a href="services.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> সেবাসমূহ ও মূল্য তালিকা</a></li>
            <li><a href="portal.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> জব ও চাকরির পোর্টাল</a></li>
            <li><a href="converter.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> বিজয়-ইউনিকোড কনভার্টার</a></li>
            <li><a href="tools.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> ছবি ও স্বাক্ষর রিসাইজার</a></li>
            <li><a href="results.html" class="hover:text-white transition flex items-center gap-1.5"><i class="fas fa-chevron-right text-[10px] text-emerald-500"></i> পরীক্ষার ফলাফল পোর্টাল</a></li>
          </ul>
        </div>

        <!-- Col 3: Work Timings & Proprietor -->
        <div>
          <h4 class="text-sm font-black text-white mb-3 flex items-center gap-2">
            <i class="fas fa-clock text-amber-400"></i> কাজের সময়সূচী
          </h4>
          <ul class="space-y-2 text-xs text-slate-400">
            <li class="flex justify-between border-b border-slate-800/80 pb-1">
              <span>শনিবার - বৃহস্পতিবার:</span>
              <span class="font-bold text-emerald-400">সকাল ৮:০০ - রাত ৯:০০</span>
            </li>
            <li class="flex justify-between border-b border-slate-800/80 pb-1">
              <span>শুক্রবার:</span>
              <span class="font-bold text-amber-400">বিকাল ৪:০০ - রাত ৯:০০</span>
            </li>
            <li class="pt-2">
              <span class="text-white font-bold block">স্বত্বাধিকারী:</span>
              <span class="text-slate-300" data-i18n="footer_proprietor">মোঃ ফয়জার আলী</span>
            </li>
            <li>
              <span class="text-white font-bold block">ইমেইল:</span>
              <span class="text-slate-400">fayzar.computer@gmail.com</span>
            </li>
          </ul>
        </div>

        <!-- Col 4: Location & Contact -->
        <div>
          <h4 class="text-sm font-black text-white mb-3 flex items-center gap-2">
            <i class="fas fa-location-dot text-rose-500"></i> দোকানের ঠিকানা
          </h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর - ৫২৬০
          </p>
          <div class="space-y-2">
            <a href="tel:01717101919" class="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center justify-center gap-2 transition border border-slate-700">
              <i class="fas fa-phone-alt text-emerald-400"></i> 01717-101919
            </a>
            <a href="https://wa.me/8801717101919" target="_blank" rel="noopener" class="w-full py-2 px-3 rounded-xl bg-[#075e24] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition">
              <i class="fab fa-whatsapp"></i> হোয়াটসঅ্যাপ বার্তা
            </a>
          </div>
        </div>

      </div>

      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div data-i18n="footer_rights">
          © ২০২৬ ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট। সর্বস্বত্ব সংরক্ষিত।
        </div>
        <div class="flex items-center gap-4">
          <a href="admin.html" class="hover:text-slate-400 transition flex items-center gap-1"><i class="fas fa-lock text-[10px]"></i> এডমিন প্যানেল</a>
        </div>
      </div>
    </div>
  </footer>'''

footer_regex = re.compile(r'(?:<!--\s*=*\s*(?:10\.\s*SITE\s+FOOTER|FOOTER|৭\.\s*ফুটার\s*সেকশন\s*\(Footer\)|Footer)\s*=*\s*-->\s*)?<footer\b[^>]*>.*?</footer\s*>', re.DOTALL)

for page in TARGET_PAGES:
    path = os.path.join(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web', page)
    if not os.path.exists(path):
        print(f"Skipping {page}, not found")
        continue

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    no_print = ' no-print' if page == 'results.html' else ''
    replacement = FOOTER_TEMPLATE.format(no_print=no_print)

    match = footer_regex.search(content)
    if match:
        content = content[:match.start()] + replacement + content[match.end():]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully updated footer in: {page}")
    else:
        print(f"Could not find footer in: {page}")

print("Sync completed!")
