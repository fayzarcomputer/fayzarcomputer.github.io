import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

additional_phrases = {
    "লাইভ API সচল": "Live API Active",
    "লাইভ AI সচল": "Live AI Active",
    "সেবা ১/১৯": "Service 1/19",
    "🏫 ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল": "🏫 Dreamland Residential Model School",
    "🕌 আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা": "🕌 Amdungihat Iman Uddin Chowdhury Alim Madrasah",
    "-- শ্রেণি ও শাখা নির্বাচন করুন --": "-- Select Class & Section --",
    "-- প্রতিষ্ঠান নির্বাচন করুন --": "-- Select Institution --",
    "-- সাল নির্বাচন করুন --": "-- Select Year --",
    "-- পরীক্ষার নাম নির্বাচন করুন --": "-- Select Exam Name --",
    "-- শ্রেণি নির্বাচন করুন --": "-- Select Class --",
    "১৫টি সক্রিয় সার্কুলার": "15 Active Circulars",
    "ব্যাংক / সরকারি": "Bank / Govt",
    "💼 ব্যাংক / সরকারি": "💼 Bank / Govt",
    "হট নোটিশ": "Hot Notice",
    "শেষ:": "Deadline:",
    "7 দিন বাকি": "7 days left",
    "দিন বাকি": "days left",
    "সহকারী পরিচালক (এক্স-ক্যাডার আইন)": "Assistant Director (Ex-Cadre Law)",
    "আবেদন লিংক": "Apply Link",
    "১/১০": "1/10",
    "২/১০": "2/10",
    "৩/১০": "3/10",
    "৪/১০": "4/10",
    "৫/১০": "5/10",
    "৬/১০": "6/10",
    "৭/১০": "7/10",
    "৮/১০": "8/10",
    "৯/১০": "9/10",
    "১০/১০": "10/10",
    "বাংলাদেশ ব্যাংক (Bangladesh Bank)": "Bangladesh Bank",
    "আবেদনের শেষ তারিখ:": "Application Deadline:",
    "পদসংখ্যা:": "Vacancies:",
    "শিক্ষাগত যোগ্যতা:": "Educational Qualification:",
    "অনলাইন আবেদন করুন": "Apply Online",
    "সার্কুলার PDF": "Circular PDF",
    "সার্কুলার বিস্তারিত": "Circular Details",
    "বিস্তারিত দেখুন": "View Details",
    "সকল নোটিশ": "All Notices"
}

for k, v in additional_phrases.items():
    d[k] = v

with open('scratch/bilingual_cache.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Updated bilingual_cache.json with additional phrases. Total count: {len(d)}")
