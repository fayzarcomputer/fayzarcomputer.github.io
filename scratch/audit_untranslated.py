import os
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

pages = [
    'index.html',
    'results.html',
    'notices.html',
    'services.html',
    'portal.html',
    'converter.html',
    'tools.html',
    'contact.html'
]

bengali_regex = re.compile(r'[\u0980-\u09FF]')

class BengaliAuditor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tag_stack = []
        self.untranslated = []
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
            # Check if any element in the active tag_stack has data-i18n
            covered = any(has_i18n for _, has_i18n, _ in self.tag_stack)
            if not covered:
                curr_tag = self.tag_stack[-1][0] if self.tag_stack else 'unknown'
                self.untranslated.append((curr_tag, text))

for page in pages:
    if not os.path.exists(page):
        continue
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    auditor = BengaliAuditor()
    auditor.feed(content)
    
    print(f"=== {page}: {len(auditor.untranslated)} untranslated Bengali text segments ===")
    for tag, text in auditor.untranslated[:12]:
        preview = (text[:75] + '...') if len(text) > 75 else text
        print(f"  <{tag}> {preview}")
    if len(auditor.untranslated) > 12:
        print(f"  ... and {len(auditor.untranslated) - 12} more.")
    print()
