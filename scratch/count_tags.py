import re

files = ['index.html', 'results.html', 'notices.html', 'services.html', 'portal.html', 'converter.html', 'tools.html', 'contact.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    tags = re.findall(r'data-i18n=["\']([^"\']+)["\']', c)
    placeholders = re.findall(r'data-i18n-placeholder=["\']([^"\']+)["\']', c)
    print(f'{f}: {len(tags)} data-i18n, {len(placeholders)} placeholder tags')
