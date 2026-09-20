import json
import re

dict_bn = {
    # results.html
    "results_badge": "ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল",
    "results_title": "অনলাইন রেজাল্ট ও মার্কশীট অনুসন্ধান",
    "results_subtitle": "পরীক্ষার সাল, পরীক্ষার নাম, শ্রেণি এবং রোল নম্বর ইনপুট দিয়ে তাৎক্ষণিক বিষয়ভিত্তিক ফলাফল ও অফিশিয়াল মার্কশীট দেখুন।",
    "results_lbl_inst": "প্রতিষ্ঠান নির্বাচন (Select Institution)",
    "results_opt_inst": "-- প্রতিষ্ঠান নির্বাচন করুন --",
    "results_lbl_year": "পরীক্ষার সাল",
    "results_opt_year": "-- সাল নির্বাচন করুন --",
    "results_lbl_exam": "পরীক্ষার নাম",
    "results_opt_exam": "-- পরীক্ষার নাম নির্বাচন করুন --",
    "results_lbl_class": "শ্রেণি ও শাখা",
    "results_opt_class": "-- শ্রেণি ও শাখা নির্বাচন করুন --",
    "results_lbl_roll": "রোল নম্বর",
    "results_roll_placeholder": "যেমন: 1, 2, 10",
    "results_tip": "টিপস: শ্রেণি নির্বাচন করে সরাসরি রোল নম্বর লিখে খুঁজুন।",
    "results_btn_reset": "রিসেট",
    "results_btn_search": "ফলাফল দেখুন",
    "results_tab_marksheet": "একাডেমিক ট্রান্সক্রিপ্ট / মার্কশীট",
    "results_tab_merit": "পূর্ণাঙ্গ মেধাতালিকা",
    "results_tab_stats": "ফলাফল পরিসংখ্যান",
    "results_btn_print": "মার্কশীট প্রিন্ট করুন (A4)",
    "results_btn_download": "ডাউনলোড",
    "results_tbl_sl": "ক্রমিক",
    "results_tbl_subject": "বিষয়ের নাম",
    "results_tbl_total": "মোট নম্বর",
    "results_tbl_obtained": "প্রাপ্ত নম্বর",
    "results_tbl_grade": "লেটার গ্রেড",
    "results_tbl_point": "গ্রেড পয়েন্ট",

    # notices.html
    "notices_page_badge": "📢 লাইভ বুলেটিন বোর্ড • দৈনিক আপডেট",
    "notices_page_title": "চলমান সরকারি চাকরি ও স্কুল-কলেজ সংক্রান্ত নোটিশ",
    "notices_page_subtitle": "ফুলবাড়ী সরকারি কলেজ সহ স্থানীয় শিক্ষার্থী ও চাকরিপ্রার্থীদের জন্য নিয়মিত হালনাগাদকৃত সার্কুলার, পরীক্ষার সময়সূচী এবং আবেদনের শেষ তারিখের আপডেট।",
    "notices_search_placeholder": "পদ, প্রতিষ্ঠান বা বিষয় দিয়ে খুঁজুন...",
    "notices_tab_college": "স্কুল-কলেজ সংক্রান্ত নোটিশ",
    "notices_tab_jobs": "চাকুরির সার্কুলার",
    "notices_tab_all": "সকল নোটিশ",
    "notices_status_autocycle": "ক্যাটাগরি স্বয়ংক্রিয়ভাবে পরিবর্তিত হচ্ছে (প্রতি ৫ সে.)",
    "notices_status_pause": "যেকোনো বাটনে ক্লিক বা সার্চ করলে পরিবর্তন থেমে থাকবে",
    "notices_btn_apply_direct": "অনলাইনে সরাসরি আবেদন / সার্কুলার",
    "notices_btn_details": "বিস্তারিত দেখুন",
    "notices_btn_whatsapp": "সরাসরি আবেদন পাঠান",
    "notices_modal_title": "বিজ্ঞপ্তির বিস্তারিত বিবরণ",
    "notices_modal_deadline": "আবেদনের শেষ তারিখ:",
    "notices_modal_vacancies": "পদসংখ্যা:",
    "notices_modal_req": "প্রয়োজনীয় যোগ্যতা:",
    "notices_modal_btn_apply": "অনলাইনে সরাসরি আবেদন / সার্কুলার লিংক",
    "notices_modal_btn_wa": "হোয়াটসঅ্যাপে ডকুমেন্টস পাঠিয়ে আবেদন করুন",

    # services.html
    "services_page_badge": "স্বীকৃত ভূমিসেবা ও ডিজিটাল সমাধান কেন্দ্র",
    "services_page_title": "আমাদের সকল ডিজিটাল, ভূমিসেবা ও স্টুডিও সেবাসমূহ",
    "services_page_subtitle": "ভূমি মন্ত্রণালয় অনুমোদিত উন্মুক্ত কেন্দ্র (LSFC) থেকে স্বচ্ছ সরকারি ফি ও দ্রুততম সময়ে নির্ভরযোগ্য নাগরিক সেবা সমাধান।",
    "services_search_placeholder": "১৯টি সেবার যেকোনোটি নাম বা বিষয় দিয়ে খুঁজুন...",
    "services_tab_all": "সকল সেবা (১৯টি)",
    "services_tab_land": "ডিজিটাল ভূমিসেবা",
    "services_tab_digital": "নাগরিক অনলাইন সেবা",
    "services_tab_student": "শিক্ষার্থী ও চাকরি সেবা",
    "services_tab_banking": "ব্যাংকিং ও বিল পেমেন্ট",
    "services_tab_studio": "প্রিন্ট, স্টুডিও ও ডিজাইন",
    "services_checklist_tag": "স্বচ্ছ ফি ও চেকলিস্ট",
    "services_checklist_title": "সেবামূল্য ও প্রয়োজনীয় কাগজপত্র চেকলিস্ট",
    "services_checklist_subtitle": "দোকানে আসার আগেই যেকোনো সেবা নির্বাচন করে জেনে নিন সরকারি ফি, কম্পিউটার চার্জ এবং সাথে আনার প্রয়োজনীয় কাগজপত্র।",
    "services_lbl_govt_fee": "সরকারি ফি:",
    "services_lbl_shop_fee": "দোকানের চার্জ:",
    "services_lbl_duration": "আনুমানিক সময়:",
    "services_lbl_required_docs": "প্রয়োজনীয় কাগজপত্রসমূহ:",
    "services_btn_view_modal": "বিস্তারিত ও আবেদন প্রক্রিয়া",
    "services_btn_call_now": "পরামর্শ ও বুকিং কল করুন",

    # portal.html
    "portal_page_badge": "ভূমি মন্ত্রণালয় অনুমোদিত কেন্দ্র • দিনাজপুর/ফুল/এলএসএসএফসি-০৭/২০২৫",
    "portal_page_title": "স্মার্ট নাগরিক ভূমিসেবা ও দিকনির্দেশনা পোর্টাল",
    "portal_page_subtitle": "ই-নামজারি, অনলাইনে জমির খাজনা প্রদান, খতিয়ান পর্চা ও মৌজা নকশা আবেদনের সহজ হিসাব, স্বচ্ছ ফি ও ধাপে ধাপে নির্দেশিকা।",
    "portal_calc_tag": "স্মার্ট ফি ক্যালকুলেটর",
    "portal_calc_title": "ভূমি উন্নয়ন কর ও নামজারি ফি ক্যালকুলেটর",
    "portal_mutation_step1": "ধাপ ১: খতিয়ান ও দলিল যাচাই",
    "portal_mutation_step2": "ধাপ ২: অনলাইন আবেদন ও ফি পরিশোধ",
    "portal_mutation_step3": "ধাপ ৩: শুনানি ও খতিয়ান সংগ্রহ",

    # converter.html
    "converter_page_badge": "১০০% অফলাইন • আল্ট্রা-ফাস্ট বাংলা ও সমীকরণ কনভার্টার",
    "converter_page_title": "ইউনিকোড ⇄ বিজয় বাংলা কনভার্টার ও ল্যাটেক্স ওওসিআর",
    "converter_page_subtitle": "সুতন্বীএমজে, ইউনিকোড, এমএস ওয়ার্ড ও ম্যাথ সমীকরণ নির্ভেজালভাবে রূপান্তর ও অফলাইনে DOCX আকারে সেভ করুন।",
    "converter_btn_uni_to_bijoy": "ইউনিকোড ➔ বিজয়",
    "converter_btn_bijoy_to_uni": "বিজয় ➔ ইউনিকোড",
    "converter_btn_copy": "কপি করুন",
    "converter_btn_clear": "মুছে ফেলুন",
    "converter_btn_docx": "DOCX ডাউনলোড",
    "converter_input_lbl": "ইনপুট টেক্সট (বাংলা অথবা বিজয় টাইপ করুন):",
    "converter_output_lbl": "রূপান্তরিত ফলাফল:",
    "converter_stats_words": "শব্দ:",
    "converter_stats_chars": "অক্ষর:",

    # tools.html
    "tools_page_badge": "নাগরিক ও চাকরিপ্রার্থীদের জন্য ডিজিটাল টুলস",
    "tools_page_title": "সরকারি চাকরির অনলাইন আবেদন ও ফটো রিসাইজার টুলস",
    "tools_page_subtitle": "টেলিটক ও সরকারি চাকরির জন্য নির্দিষ্ট ৩০০×৩০০ ফটো, ৩০০×৮০ স্বাক্ষর রিসাইজিং এবং ফাইল প্রসেসিং টুলস।",
    "tools_photo_title": "টেলিটক ছবি রিসাইজার (৩০০×৩০০)",
    "tools_photo_desc": "ফাইলের সাইজ সর্বোচ্চ ১০০ কেবি এবং রেজোলিউশন ৩০০×৩০০ পিক্সেলে স্বয়ংক্রিয়ভাবে রূপান্তর।",
    "tools_sig_title": "স্বাক্ষর রিসাইজার (৩০০×৮০)",
    "tools_sig_desc": "ফাইলের সাইজ সর্বোচ্চ ৬০ কেবি এবং রেজোলিউশন ৩০০×৮০ পিক্সেলে নিখুঁত কনভার্ট।",
    "tools_btn_upload": "ছবি নির্বাচন করুন",
    "tools_btn_download": "রিসাইজড ছবি ডাউনলোড করুন",
    "tools_age_title": "সরকারি চাকরির বয়স ক্যালকুলেটর",
    "tools_age_desc": "নির্ধারিত তারিখে প্রার্থীর বয়স কত বছর, মাস ও দিন তা নিমেষেই হিসাব করুন।",
    "tools_btn_calc_age": "বয়স বের করুন",

    # contact.html
    "contact_page_badge": "সরাসরি সেবা ও অবস্থান",
    "contact_page_title": "যোগাযোগ ও সার্ভিস সেন্টার পরিদর্শন",
    "contact_page_subtitle": "যেকোনো ডিজিটাল সেবা, ভূমিসেবা পরামর্শ বা জরুরি প্রিন্টিং সহায়তায় আমাদের দোকানে সরাসরি আসুন বা ফোনে যোগাযোগ করুন।",
    "contact_card_address_title": "আমাদের ঠিকানা",
    "contact_address_text": "ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর-৫২৬০",
    "contact_card_hours_title": "সেবা প্রদানের সময়সূচী",
    "contact_hours_weekdays": "শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - রাত ৯:০০",
    "contact_hours_friday": "শুক্রবার: বিকাল ৪:০০ - রাত ৯:০০",
    "contact_card_phone_title": "হটলাইন ও হোয়াটসঅ্যাপ",
    "contact_form_title": "সরাসরি বার্তা পাঠান",
    "contact_form_name": "আপনার নাম",
    "contact_form_phone": "মোবাইল নম্বর",
    "contact_form_subject": "সেবার বিষয়",
    "contact_form_message": "বিস্তারিত বার্তা",
    "contact_btn_send": "মেসেজ পাঠান"
}

dict_en = {
    # results.html
    "results_badge": "Dreamland Residential Model School",
    "results_title": "Online Result & Marksheet Search Portal",
    "results_subtitle": "Instant subject-wise results and official marksheet lookup with exam year, exam name, class and roll number.",
    "results_lbl_inst": "Select Institution",
    "results_opt_inst": "-- Select Institution --",
    "results_lbl_year": "Exam Year",
    "results_opt_year": "-- Select Year --",
    "results_lbl_exam": "Exam Name",
    "results_opt_exam": "-- Select Exam --",
    "results_lbl_class": "Class & Section",
    "results_opt_class": "-- Select Class & Section --",
    "results_lbl_roll": "Roll Number",
    "results_roll_placeholder": "e.g. 1, 2, 10",
    "results_tip": "Tip: Select class and enter roll number directly to search.",
    "results_btn_reset": "Reset",
    "results_btn_search": "View Result",
    "results_tab_marksheet": "Academic Transcript / Marksheet",
    "results_tab_merit": "Full Merit List",
    "results_tab_stats": "Result Statistics",
    "results_btn_print": "Print Marksheet (A4)",
    "results_btn_download": "Download",
    "results_tbl_sl": "SL",
    "results_tbl_subject": "Subject Name",
    "results_tbl_total": "Total Marks",
    "results_tbl_obtained": "Obtained",
    "results_tbl_grade": "Letter Grade",
    "results_tbl_point": "Grade Point",

    # notices.html
    "notices_page_badge": "📢 Live Bulletin Board • Daily Updates",
    "notices_page_title": "Ongoing Government Jobs & Academic Notices",
    "notices_page_subtitle": "Regularly updated circulars, exam routines and application deadlines for students of Phulbari Govt College and job seekers.",
    "notices_search_placeholder": "Search by post, institution or topic...",
    "notices_tab_college": "Academic & College Notices",
    "notices_tab_jobs": "Job Circulars",
    "notices_tab_all": "All Notices",
    "notices_status_autocycle": "Categories auto-cycling (every 5s)",
    "notices_status_pause": "Auto-cycle pauses on click or search",
    "notices_btn_apply_direct": "Direct Online Application / Circular",
    "notices_btn_details": "View Details",
    "notices_btn_whatsapp": "Apply via WhatsApp",
    "notices_modal_title": "Notice Details",
    "notices_modal_deadline": "Application Deadline:",
    "notices_modal_vacancies": "Vacancies:",
    "notices_modal_req": "Required Qualifications:",
    "notices_modal_btn_apply": "Direct Online Application / Circular Link",
    "notices_modal_btn_wa": "Send Documents & Apply via WhatsApp",

    # services.html
    "services_page_badge": "Certified Land & Digital Solutions Centre",
    "services_page_title": "All Digital, Land & Studio Services",
    "services_page_subtitle": "Transparent government fees and fastest dependable citizen service solutions from LSFC certified center.",
    "services_search_placeholder": "Search any of 19 services by name or keyword...",
    "services_tab_all": "All Services (19)",
    "services_tab_land": "Digital Land Services",
    "services_tab_digital": "Citizen Online Services",
    "services_tab_student": "Student & Job Services",
    "services_tab_banking": "Banking & Bill Payment",
    "services_tab_studio": "Print, Studio & Design",
    "services_checklist_tag": "Transparent Fees & Checklist",
    "services_checklist_title": "Service Pricing & Document Checklist",
    "services_checklist_subtitle": "Before visiting our shop, select any service to verify official government fee, computer charges and required documents.",
    "services_lbl_govt_fee": "Government Fee:",
    "services_lbl_shop_fee": "Shop Charge:",
    "services_lbl_duration": "Estimated Time:",
    "services_lbl_required_docs": "Required Documents:",
    "services_btn_view_modal": "Details & Application Process",
    "services_btn_call_now": "Call for Consultation",

    # portal.html
    "portal_page_badge": "Govt. Certified Land Centre • LSFC-07/2025",
    "portal_page_title": "Smart Citizen Land Services & Guidance Portal",
    "portal_page_subtitle": "Transparent calculations, fees and step-by-step guidelines for e-Mutation, Land Tax, Khatian Porcha and Mouza Maps.",
    "portal_calc_tag": "Smart Fee Calculator",
    "portal_calc_title": "Land Tax & Mutation Fee Calculator",
    "portal_mutation_step1": "Step 1: Khatian & Deed Verification",
    "portal_mutation_step2": "Step 2: Online Filing & Fee Payment",
    "portal_mutation_step3": "Step 3: Hearing & Khatian Collection",

    # converter.html
    "converter_page_badge": "100% Offline • Ultra-Fast Bangla & Equation Converter",
    "converter_page_title": "Unicode ⇄ Bijoy Bangla Converter & LaTeX OCR",
    "converter_page_subtitle": "Flawlessly convert SutonnyMJ, Unicode, MS Word and Math equations with offline native DOCX export.",
    "converter_btn_uni_to_bijoy": "Unicode ➔ Bijoy",
    "converter_btn_bijoy_to_uni": "Bijoy ➔ Unicode",
    "converter_btn_copy": "Copy Text",
    "converter_btn_clear": "Clear All",
    "converter_btn_docx": "Export DOCX",
    "converter_input_lbl": "Input Text (Type Bangla or Bijoy):",
    "converter_output_lbl": "Converted Output:",
    "converter_stats_words": "Words:",
    "converter_stats_chars": "Characters:",

    # tools.html
    "tools_page_badge": "Digital Tools for Citizens & Applicants",
    "tools_page_title": "Online Job Application & Photo Resizer Tools",
    "tools_page_subtitle": "Standard 300x300 photo resizer, 300x80 signature resizer and document processing tools for job applications.",
    "tools_photo_title": "Teletalk Photo Resizer (300x300)",
    "tools_photo_desc": "Automatically resize image to exact 300x300 pixels with maximum file size under 100 KB.",
    "tools_sig_title": "Signature Resizer (300x80)",
    "tools_sig_desc": "Precisely resize signature to 300x80 pixels with maximum file size under 60 KB.",
    "tools_btn_upload": "Choose Image",
    "tools_btn_download": "Download Resized Image",
    "tools_age_title": "Govt Job Age Calculator",
    "tools_age_desc": "Instantly calculate candidate exact age in years, months and days as of application date.",
    "tools_btn_calc_age": "Calculate Age",

    # contact.html
    "contact_page_badge": "Direct Services & Location",
    "contact_page_title": "Contact & Visit Service Centre",
    "contact_page_subtitle": "Visit our center directly or contact via phone for digital assistance, land advice or express printing services.",
    "contact_card_address_title": "Our Address",
    "contact_address_text": "West Side of Phulbari Govt. College Gate, Phulbari, Dinajpur-5260",
    "contact_card_hours_title": "Opening Hours",
    "contact_hours_weekdays": "Saturday - Thursday: 10:00 AM - 9:00 PM",
    "contact_hours_friday": "Friday: 4:00 PM - 9:00 PM",
    "contact_card_phone_title": "Hotline & WhatsApp",
    "contact_form_title": "Send Direct Message",
    "contact_form_name": "Your Name",
    "contact_form_phone": "Mobile Number",
    "contact_form_subject": "Service Subject",
    "contact_form_message": "Detailed Message",
    "contact_btn_send": "Send Message"
}

# Read js/theme-lang.js
with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Generate JS object string additions
bn_entries = []
for k, v in dict_bn.items():
    escaped_v = v.replace("'", "\\'")
    bn_entries.append(f"      {k}: '{escaped_v}',")

en_entries = []
for k, v in dict_en.items():
    escaped_v = v.replace("'", "\\'")
    en_entries.append(f"      {k}: '{escaped_v}',")

bn_str = "\n      // --- Subpages Comprehensive Translations (bn) ---\n" + "\n".join(bn_entries) + "\n"
en_str = "\n      // --- Subpages Comprehensive Translations (en) ---\n" + "\n".join(en_entries) + "\n"

# Insert into bn
# Find closing bracket of bn: { ... \n    },
bn_match = re.search(r'(bn:\s*\{[\s\S]*?)(    \},?\s*\n\s*en:)', code)
if not bn_match:
    print("Could not locate bn dictionary end!")
    exit(1)

code_updated = code[:bn_match.end(1)] + bn_str + code[bn_match.end(1):]

# Now insert into en
en_match = re.search(r'(en:\s*\{[\s\S]*?)(    \},?\s*\n\s*//)', code_updated)
if not en_match:
    print("Could not locate en dictionary end!")
    exit(1)

code_final = code_updated[:en_match.end(1)] + en_str + code_updated[en_match.end(1):]

with open('js/theme-lang.js', 'w', encoding='utf-8') as f:
    f.write(code_final)

print(f"Successfully added {len(dict_bn)} new keys to both bn and en dictionaries!")
