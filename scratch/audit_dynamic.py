import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

bengali_regex = re.compile(r'[\u0980-\u09FF]+')

# 1. Read notices.json
with open('data/notices.json', 'r', encoding='utf-8') as f:
    notices_raw = f.read()

# Extract all Bengali phrases
all_notices_strings = set()
for match in re.finditer(r'\"([^\"]*[\u0980-\u09FF]+[^\"]*)\"', notices_raw):
    s = match.group(1).strip()
    if s:
        all_notices_strings.add(s)

print(f"Total Bengali strings in data/notices.json: {len(all_notices_strings)}")

# 2. Read main.js for dynamic template strings
with open('js/main.js', 'r', encoding='utf-8') as f:
    main_raw = f.read()

main_strings = set()
for match in re.finditer(r'[\'`\"]([^`\'\"\n]*[\u0980-\u09FF]+[^`\'\"\n]*)[\'`\"]', main_raw):
    s = match.group(1).strip()
    if s and len(s) < 150:
        main_strings.add(s)

print(f"Total Bengali strings in js/main.js: {len(main_strings)}")

# Check against cache
with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    cache = json.load(f)

missing_notices = [s for s in all_notices_strings if s not in cache]
missing_main = [s for s in main_strings if s not in cache]

print(f"Missing from notices.json: {len(missing_notices)}")
print(f"Missing from main.js: {len(missing_main)}")

all_new_missing = list(set(missing_notices + missing_main))

with open('scratch/missing_dynamic_strings.json', 'w', encoding='utf-8') as f:
    json.dump(all_new_missing, f, ensure_ascii=False, indent=2)

print(f"Dumped {len(all_new_missing)} dynamic strings to translate into scratch/missing_dynamic_strings.json")
