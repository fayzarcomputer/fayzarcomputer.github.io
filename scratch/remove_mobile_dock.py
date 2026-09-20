import re
import os

pages = ['converter.html', 'tools.html', 'portal.html', 'results.html', 'notices.html', 'contact.html']
pattern = re.compile(r'\s*<!--\s*Mobile\s+Bottom\s+Nav\s+Dock\s*-->\s*<nav\s+aria-label="মোবাইল\s+দ্রুত\s+নেভিগেশন".*?</nav\s*>', re.DOTALL)

for p in pages:
    path = os.path.join(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web', p)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    new_c, count = pattern.subn('', c)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_c)
        print(f'Removed mobile dock from: {p} ({count} matches)')
    else:
        print(f'No dock found in: {p}')

print('Removal complete!')
