import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

# Number conversion map
bn_digits = "০১২৩৪৫৬৭৮৯"
en_digits = "0123456789"
trans_table = str.maketrans(bn_digits, en_digits)

# Check all short keys
short_keys = [k for k in d if len(k) <= 5]
print(f"Short keys count: {len(short_keys)}")
for k in short_keys:
    # If translation is still Bengali or same, check if it's numbers
    has_bn = any(c in bn_digits for c in k)
    if has_bn:
        converted = k.translate(trans_table)
        d[k] = converted
        print(f"Number mapped: '{k}' -> '{converted}'")

# Ensure common short words
common_shorts = {
    "বাং": "BN",
    "EN": "EN",
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
    "১০": "10",
    "১/৩": "1/3",
    "২/৩": "2/3",
    "৩/৩": "3/3",
    "১/১৯": "1/19",
    "১৯": "19",
    "ও": "and",
    "বা": "or",
    "ফি:": "Fee:",
    "সময়:": "Time:",
    "দিন": "Days",
    "ঘণ্টা": "Hours",
    "মিনিট": "Minutes",
    "সেকেন্ড": "Seconds",
    "টাকা": "BDT",
    "৳": "৳"
}

for k, v in common_shorts.items():
    d[k] = v

with open('scratch/bilingual_cache.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Updated bilingual_cache.json with clean short and number mappings.")
