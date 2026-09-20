import re

pages = ['index.html', 'services.html', 'portal.html', 'converter.html', 'tools.html', 'results.html', 'notices.html', 'contact.html', 'admin.html', 'result-admin.html']

for page in pages:
    try:
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        matches = re.findall(r'data-i18n="([^"]+)"', content)
        print(f"[{page}] -> {len(matches)} data-i18n tags ({len(set(matches))} unique keys)")
    except Exception as e:
        print(f"[{page}] error: {e}")
