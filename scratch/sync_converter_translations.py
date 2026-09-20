import json
import re
import urllib.request
import urllib.parse
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

cache_file = 'scratch/bilingual_cache.json'
with open(cache_file, 'r', encoding='utf-8') as f:
    dictionary = json.load(f)

bengali_regex = re.compile(r'[\u0980-\u09FF]')

class SimpleTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag_stack = []
        self.texts = []
        self.in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        has_i18n = 'data-i18n' in attrs_dict
        if tag in ('script', 'style'):
            self.in_script_or_style = True
        self.tag_stack.append((tag, has_i18n))

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script_or_style = False
        if self.tag_stack:
            self.tag_stack.pop()

    def handle_data(self, data):
        if self.in_script_or_style:
            return
        t = data.strip()
        if t and bengali_regex.search(t):
            covered = any(h for _, h in self.tag_stack)
            if not covered:
                self.texts.append(t)

pages = [
    'index.html',
    'services.html',
    'portal.html',
    'converter.html',
    'tools.html',
    'results.html',
    'notices.html',
    'contact.html'
]

all_missing = set()
for p in pages:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            ext = SimpleTextExtractor()
            ext.feed(f.read())
            for t in ext.texts:
                if t not in dictionary:
                    all_missing.add(t)

missing_list = list(all_missing)
print(f"Total missing strings across all pages: {len(missing_list)}")

def translate_one(text):
    if not text.strip():
        return text, text
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                full_text = "".join([chunk[0] for chunk in res[0] if chunk[0]])
                return text, full_text
        except Exception:
            time.sleep(0.2 * (attempt + 1))
    return text, text

if missing_list:
    completed = 0
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {executor.submit(translate_one, s): s for s in missing_list}
        for f in as_completed(futures):
            orig, trans = f.result()
            dictionary[orig] = trans
            completed += 1
            if completed % 20 == 0 or completed == len(missing_list):
                print(f"Translated: {completed}/{len(missing_list)}...")

    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    print(f"Updated {cache_file} with {len(dictionary)} total items.")

# Now update js/theme-lang.js bilingualContentDict
for target_dir in ['c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-web', 'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-v2']:
    js_path = os.path.join(target_dir, 'js', 'theme-lang.js')
    if os.path.exists(js_path):
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find bilingualContentDict
        dict_marker = 'const bilingualContentDict = '
        idx = content.find(dict_marker)
        if idx != -1:
            end_marker = ';\n'
            # Look for the closing of bilingualContentDict
            # It ends with };
            # We can find the dict using regex or json replacement
            pattern = re.compile(r'const bilingualContentDict\s*=\s*\{.*?\};', re.DOTALL)
            replacement = 'const bilingualContentDict = ' + json.dumps(dictionary, ensure_ascii=False, indent=2) + ';'
            new_content = pattern.sub(lambda m: replacement, content, count=1)
            with open(js_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated bilingualContentDict in {js_path}")

print("Sync completed!")
