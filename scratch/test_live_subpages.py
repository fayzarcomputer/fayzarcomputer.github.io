import urllib.request
import ssl

ctx = ssl.create_default_context()
urls = [
    'https://fayzarcomputer.com.bd/notices.html',
    'https://fayzarcomputer.com.bd/results.html',
    'https://fayzarcomputer.com.bd/services.html',
    'https://fayzarcomputer.com.bd/converter.html'
]

for u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            has_ticker = 'ticker-content' in content or 'live-notice-ticker' in content
            print(f"[{resp.status}] {u} - Has Ticker: {has_ticker}")
    except Exception as e:
        print(f"Error {u}: {e}")
