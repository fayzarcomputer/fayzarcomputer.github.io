import urllib.request
import re
import sys

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

for p in pages:
    # Read local first tag
    with open(p, 'r', encoding='utf-8') as f:
        loc_html = f.read()
    loc_tags = re.findall(r'data-i18n=["\']([^"\']+)["\']', loc_html)
    sample_key = loc_tags[0] if loc_tags else None
    
    # Read remote
    url = f'https://fayzarcomputer.com.bd/{p}?t=verify_now'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            rem_html = resp.read().decode('utf-8')
            has_sample = sample_key in rem_html if sample_key else False
            rem_tags = len(re.findall(r'data-i18n=["\']([^"\']+)["\']', rem_html))
            print(f"{p:15}: Local Tags = {len(loc_tags):2d}, Remote Tags = {rem_tags:2d}, Sample ({sample_key}): {'FOUND' if has_sample else 'NOT FOUND'}")
    except Exception as e:
        print(f"{p:15}: Remote Error: {e}")
