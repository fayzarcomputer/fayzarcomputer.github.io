import os
import re
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

class FullAuditor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag_stack = []
        self.items = []
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
                tag, _, attrs = self.tag_stack[-1] if self.tag_stack else ('unknown', False, {})
                parent_id = attrs.get('id', '')
                parent_class = attrs.get('class', '')
                self.items.append((tag, parent_id, text))

page_stats = {}
all_unique_texts = set()

for page in pages:
    if not os.path.exists(page):
        continue
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    auditor = FullAuditor()
    auditor.feed(content)
    page_stats[page] = auditor.items
    for _, _, txt in auditor.items:
        all_unique_texts.add(txt)

print(f"Total Unique Bengali Text Strings needing translation: {len(all_unique_texts)}")
for p, items in page_stats.items():
    print(f"{p:15}: {len(items):3d} strings")
