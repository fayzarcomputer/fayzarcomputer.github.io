import json
import urllib.request
import urllib.parse
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

cache_file = 'scratch/bilingual_cache.json'
translations = {}
if os.path.exists(cache_file):
    with open(cache_file, 'r', encoding='utf-8') as f:
        translations = json.load(f)
    print(f"Loaded {len(translations)} existing translations from cache.")

with open('scratch/all_bengali_strings.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

all_strings = raw['strings']
missing = [s for s in all_strings if s not in translations]
print(f"Strings remaining to translate: {len(missing)}")

def translate_one(text):
    if not text.strip():
        return text, ""
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                full_text = "".join([chunk[0] for chunk in res[0] if chunk[0]])
                return text, full_text
        except Exception as e:
            time.sleep(0.5 * (attempt + 1))
    return text, text # fallback

completed = 0
with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_text = {executor.submit(translate_one, s): s for s in missing}
    for future in as_completed(future_to_text):
        orig, trans = future.result()
        translations[orig] = trans
        completed += 1
        if completed % 50 == 0 or completed == len(missing):
            print(f"Progress: {completed}/{len(missing)} finished...")
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(translations, f, ensure_ascii=False, indent=2)

with open(cache_file, 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

print(f"ALL DONE! Total translations in cache: {len(translations)}")
