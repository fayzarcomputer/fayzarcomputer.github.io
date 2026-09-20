import json
import urllib.request
import urllib.parse
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/missing_dynamic_strings.json', 'r', encoding='utf-8') as f:
    to_translate = json.load(f)

with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    cache = json.load(f)

print(f"Translating {len(to_translate)} dynamic strings...")

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
            time.sleep(0.4 * (attempt + 1))
    return text, text

done = 0
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(translate_one, s): s for s in to_translate}
    for f in as_completed(futures):
        orig, trans = f.result()
        cache[orig] = trans
        done += 1
        if done % 50 == 0 or done == len(to_translate):
            print(f"Dynamic progress: {done}/{len(to_translate)}...")

with open('scratch/bilingual_cache.json', 'w', encoding='utf-8') as f:
    json.dump(cache, f, ensure_ascii=False, indent=2)

print(f"Finished translating dynamic strings! Cache total: {len(cache)}")
