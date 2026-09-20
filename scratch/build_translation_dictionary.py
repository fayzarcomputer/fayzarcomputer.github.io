import json
import urllib.request
import urllib.parse
import time
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Domain-specific terminology overrides for official precision
DOMAIN_OVERRIDES = {
    "ই-নামজারি ও রেকর্ড খারিজ": "E-Mutation & Record Correction",
    "ই-নামজারি ও রেকর্ড খারিজ (E-Mutation)": "E-Mutation & Record Correction (E-Mutation)",
    "অনলাইনে জমির খাজনা পরিশোধ (LD Tax)": "Online Land Development Tax Payment (LD Tax)",
    "অনলাইনে জমির খাজনা পরিশোধ": "Online Land Development Tax Payment",
    "খতিয়ান/পর্চা যাচাই ও সার্টিফাইড কপি": "Khatian/Porcha Verification & Certified Copy",
    "মৌজা ম্যাপ (নকশা) ও ডিজিটাল সিট আবেদন": "Mouza Map (Cadastral Map) & Digital Sheet Application",
    "দলিল কম্পোজ ও রেজিস্ট্রি সংক্রান্ত পরামর্শ": "Deed Drafting & Land Registry Consultation",
    "আয়কর ই-রিটার্ন ও ট্যাক্স সার্টিফিকেট": "Income Tax E-Return & Tax Certificate",
    "পাসপোর্ট আবেদন ও পুলিশ ক্লিয়ারেন্স": "Passport Application & Police Clearance Certificate",
    "ড্রাইভিং লাইসেন্স ও বিআরটিএ সেবা": "Driving License & BRTA Online Services",
    "সরকারি ও বেসরকারি চাকরির আবেদন": "Government & Private Job Applications",
    "বিশ্ববিদ্যালয় ভর্তি ও পরীক্ষার আবেদন": "University Admission & Examination Applications",
    "জাতীয় পরিচয়পত্র (NID) সংশোধন ও রি-ইস্যু": "National ID (NID) Correction & Re-issue",
    "জন্ম ও মৃত্যু নিবন্ধন সংশোধন ও প্রিন্ট": "Birth & Death Registration Correction & Printing",
    "ট্রেড লাইসেন্স ও টিন (TIN) সার্টিফিকেট": "Trade License & e-TIN Certificate",
    "বাংলা ও ইংরেজি নির্ভুল কম্পিউটার কম্পোজ": "Accurate Bengali & English Computer Typing/Composing",
    "হাই-স্পিড ডিজিটাল ফটোকপি ও প্রিন্ট": "High-Speed Digital Photocopy & Laser Printing",
    "স্টুডিও কোয়ালিটি ল্যাব পাসপোর্ট ছবি": "Studio Quality Lab Passport Photos",
    "উচ্চমানের ল্যামিনেশন ও হার্ড স্পাইরাল বাইন্ডিং": "Premium Lamination & Hard Spiral Binding",
    "জরুরি প্লাস্টিক পিভিসি (PVC) কার্ড প্রিন্ট": "Instant Plastic PVC Smart Card Printing",
    "অনলাইন রেজাল্ট ও মার্কশীট অনুসন্ধান": "Online Results & Marksheet Search",
    "ফলাফল ও মার্কশীট অনুসন্ধান করুন": "Search Results & Academic Marksheet",
    "প্রতিষ্ঠান নির্বাচন (Select Institution)": "Select Institution",
    "-- প্রতিষ্ঠান নির্বাচন করুন --": "-- Select Institution --",
    "-- সাল নির্বাচন করুন --": "-- Select Year --",
    "-- পরীক্ষার নাম নির্বাচন করুন --": "-- Select Exam --",
    "-- শ্রেণি নির্বাচন করুন --": "-- Select Class --",
    "পরীক্ষার সাল": "Exam Year",
    "পরীক্ষার নাম": "Exam Name",
    "শ্রেণি (Class)": "Class",
    "রোল নম্বর": "Roll Number",
    "রেজিস্ট্রেশন নম্বর (ঐচ্ছিক)": "Registration Number (Optional)",
    "ফলাফল দেখুন": "View Result",
    "পুনরায় খুঁজুন": "Search Again",
    "মার্কশীট প্রিন্ট": "Print Marksheet",
    "মার্কশীট ডাউনলোড (PDF)": "Download Marksheet (PDF)",
    "ফয়জার কম্পিউটার": "Fayzar Computer",
    "ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট": "Fayzar Computer & Photostat",
    "সরকার অনুমোদিত ডিজিটাল ও ভূমিসেবা কেন্দ্র": "Govt. Approved Digital & Land Service Center",
    "দোকানের সঠিক অবস্থান:": "Exact Shop Location:",
    "ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর।": "West side of Phulbari Govt. College Gate, Phulbari, Dinajpur.",
    "ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর - ৫২৬০": "West side of Phulbari Govt. College Gate, Phulbari, Dinajpur - 5260",
    "মোবাইল হেল্পলাইন:": "Mobile Helpline:",
    "হোয়াটসঅ্যাপ:": "WhatsApp:",
    "ইমেইল:": "Email:",
    "সরাসরি মেসেজ": "Direct Message",
    "প্রোপ্রাইটর: মোঃ ফয়জার আলী": "Proprietor: Md. Fayzar Ali",
    "ছবি ও স্বাক্ষর রিসাইজার": "Photo & Signature Resizer",
    "টেলিটক ৩০০x৩০০ ও ৩০০x৮০": "Teletalk 300x300 & 300x80",
    "চাকরির বয়স ক্যালকুলেটর": "Job Age Calculator",
    "১৮-৩২ বছর যোগ্যতা যাচাই": "18-32 Years Eligibility Check",
    "জমি ও দলিল ফি হিসাব": "Land & Deed Fee Calculator",
    "শতক, কাঠা ও রেজিস্ট্রি ফি": "Shotok, Katha & Registration Fee",
    "ইউনিকোড ⇄ বিজয় কনভার্টার": "Unicode ⇄ Bijoy Converter",
    "ফাইল ড্রপ ও AI OCR": "File Drop & AI OCR",
    "দ্রুত নেভিগেশন": "Quick Navigation",
    "হোমপেজ": "Homepage",
    "সেবাসমূহ ও মূল্য তালিকা": "Services & Pricing Table",
    "জব ও চাকরির পোর্টাল": "Job Application Portal",
    "বিজয়-ইউনিকোড কনভার্টার": "Bijoy-Unicode Converter",
    "রেজাল্ট ও মার্কশীট": "Results & Marksheet",
    "টুলস ও ফটো রিসাইজ": "Tools & Photo Resizer",
    "যোগাযোগ ও লোকেশন": "Contact & Location",
    "প্রয়োজনীয় কাগজপত্র:": "Required Documents:",
    "সরকারি ফি:": "Government Fee:",
    "কাজের স্বচ্ছ মূল্য তালিকা (ছক)": "Transparent Service Pricing Table",
    "চেকলিস্ট ক্যালকুলেটর": "Checklist Calculator",
    "ক্যাটাগরি অনুযায়ী সেবা": "Services by Category",
    "সকল সেবা (১৯)": "All Services (19)",
    "ভূমিসেবা": "Land Services",
    "নাগরিক ও অনলাইন": "Citizen & Online",
    "টাইপিং ও কম্পোজ": "Typing & Composing",
    "প্রিন্ট ও স্টুডিও": "Printing & Studio",
    "বাং": "বাং",
    "EN": "EN",
    "ডে মোড": "Day Mode",
    "নাইট মোড": "Night Mode"
}

with open('scratch/all_bengali_strings.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

all_strings = raw['strings']
print(f"Loaded {len(all_strings)} unique Bengali strings.")

cache_file = 'scratch/bilingual_cache.json'
translations = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            translations = json.load(f)
        print(f"Loaded {len(translations)} existing translations from cache.")
    except Exception as e:
        print("Cache load error:", e)

# Pre-fill overrides
for bn, en in DOMAIN_OVERRIDES.items():
    translations[bn] = en

def translate_gtx(text):
    if not text.strip():
        return ""
    # Check if text is just symbols/numbers
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        # Google Translate returns segments: res[0] is a list of [translated_chunk, orig_chunk, ...]
        full_text = "".join([chunk[0] for chunk in res[0] if chunk[0]])
        return full_text

missing = [s for s in all_strings if s not in translations]
print(f"Strings to translate: {len(missing)}")

batch_size = 20
for idx, s in enumerate(missing):
    try:
        translated = translate_gtx(s)
        translations[s] = translated
        if (idx + 1) % 25 == 0 or (idx + 1) == len(missing):
            print(f"Progress: {idx + 1}/{len(missing)} translated...")
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(translations, f, ensure_ascii=False, indent=2)
            time.sleep(0.3)
    except Exception as e:
        print(f"Error on '{s[:30]}...': {e}")
        time.sleep(1)

with open(cache_file, 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

print(f"Done! Total translations in cache: {len(translations)}")
