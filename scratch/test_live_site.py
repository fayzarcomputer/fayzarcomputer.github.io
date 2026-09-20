import urllib.request
import ssl

ctx = ssl.create_default_context()
req = urllib.request.Request(
    'https://fayzarcomputer.com.bd/',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print("HTTP Status:", resp.status)
        print("URL:", resp.geturl())
        print("Has hero-notices-container:", 'hero-notices-container' in html)
        print("Has land-services id:", 'id="land-services"' in html)
        print("Has useful-links id:", 'id="useful-links"' in html)
except Exception as e:
    print("Fetch info:", e)
