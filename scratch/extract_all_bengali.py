import os
import re
import json
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

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

bengali_regex = re.compile(r'[\u0980-\u09FF]')

class ExtractStrings(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag_stack = []
        self.strings = []
        self.in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        has_i18n = 'data-i18n' in attrs_dict
        if tag in ('script', 'style'):
            self.in_script_or_style = True
        self.tag_stack.append((tag, has_i18n, attrs_dict))

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script_or_style = False
        if self.tag_stack:
            self.tag_stack.pop()

    def handle_data(self, data):
        if self.in_script_or_style:
            return
        text = data.strip()
        if not text:
            return
        if bengali_regex.search(text):
            covered = any(has_i18n for _, has_i18n, _ in self.tag_stack)
            if not covered:
                tag = self.tag_stack[-1][0] if self.tag_stack else 'div'
                self.strings.append((tag, text))

page_strings = {}
unique_set = set()

for p in pages:
    if not os.path.exists(p):
        continue
    with open(p, 'r', encoding='utf-8') as f:
        html = f.read()
    ext = ExtractStrings()
    ext.feed(html)
    page_strings[p] = [txt for _, txt in ext.strings]
    for _, txt in ext.strings:
        unique_set.add(txt)

sorted_strings = sorted(list(unique_set), key=lambda s: len(s), reverse=True)

with open('scratch/all_bengali_strings.json', 'w', encoding='utf-8') as f:
    json.dump({
        'total_count': len(sorted_strings),
        'strings': sorted_strings,
        'by_page': page_strings
    }, f, ensure_ascii=False, indent=2)

print(f"Dumped {len(sorted_strings)} unique Bengali strings to scratch/all_bengali_strings.json")
