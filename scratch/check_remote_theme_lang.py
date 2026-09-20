import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    loc_js = f.read()

print(f"Local theme-lang.js size: {len(loc_js)} bytes")
print("Local has results_title:", 'results_title' in loc_js)

url = 'https://fayzarcomputer.com.bd/js/theme-lang.js?nocache=999'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        rem_js = resp.read().decode('utf-8')
        print(f"Remote theme-lang.js size: {len(rem_js)} bytes")
        print("Remote has results_title:", 'results_title' in rem_js)
        print("Remote has brand_name:", 'brand_name' in rem_js)
except Exception as e:
    print("Error:", e)
