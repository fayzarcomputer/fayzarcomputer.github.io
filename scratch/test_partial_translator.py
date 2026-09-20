import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

bn_digits = "০১২৩৪৫৬৭৮৯"
en_digits = "0123456789"
trans_table = str.maketrans(bn_digits, en_digits)

dict_sample = {
    "ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল": "Dreamland Residential Model School",
    "আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা": "Amdungihat Iman Uddin Chowdhury Alim Madrasah",
    "বাংলাদেশ ব্যাংক (Bangladesh Bank)": "Bangladesh Bank",
    "সহকারী পরিচালক (এক্স-ক্যাডার আইন)": "Assistant Director (Ex-Cadre Law)",
    "আবেদন লিংক": "Apply Link"
}

test_inputs = [
    "🏫 ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল",
    "🕌 আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা",
    "সেবা ১/১৯",
    "শেষ: 2026-09-20",
    "7 দিন বাকি",
    "১৫টি সক্রিয় সার্কুলার",
    "১/১০"
]

def clean_translate(text):
    trimmed = text.strip()
    if trimmed in dict_sample:
        return dict_sample[trimmed]
    
    # Check emoji strip
    m = re.match(r'^([^\w\s\u0980-\u09FF]*\s*)([\w\s\u0980-\u09FF()–—\-]+)(.*)$', trimmed)
    if m:
        prefix, core, suffix = m.groups()
        core_trimmed = core.strip()
        if core_trimmed in dict_sample:
            return prefix + dict_sample[core_trimmed] + suffix
            
    # Check partial prefixes
    if trimmed.startswith("সেবা "):
        return "Service " + trimmed[5:].translate(trans_table)
    if trimmed.startswith("শেষ:"):
        return "Deadline:" + trimmed[4:].translate(trans_table)
    if "দিন বাকি" in trimmed:
        return trimmed.replace("দিন বাকি", "days left").translate(trans_table)
    if "সক্রিয় সার্কুলার" in trimmed:
        return trimmed.replace("সক্রিয় সার্কুলার", "Active Circulars").replace("টি", "").translate(trans_table)
    
    # Standalone numbers
    if re.match(r'^[\d\s\u09E6-\u09EF/.,\-+–—%৳]+$', trimmed):
        return trimmed.translate(trans_table)
        
    return text

for inp in test_inputs:
    print(f"{inp:40} -> {clean_translate(inp)}")
