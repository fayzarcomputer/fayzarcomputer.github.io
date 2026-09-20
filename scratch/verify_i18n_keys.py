import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

# Extract keys from theme-lang.js
with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    tl_content = f.read()

bn_section = tl_content[tl_content.find('bn: {'):tl_content.find('en: {')]
en_section = tl_content[tl_content.find('en: {'):tl_content.find('// =========================================================================\n  // 2. State Management')]

bn_keys = set(re.findall(r'(\w+):\s*[\'"`]', bn_section))
en_keys = set(re.findall(r'(\w+):\s*[\'"`]', en_section))

print(f"Total bn keys in theme-lang.js: {len(bn_keys)}")
print(f"Total en keys in theme-lang.js: {len(en_keys)}")

missing_in_en = bn_keys - en_keys
missing_in_bn = en_keys - bn_keys

if missing_in_en:
    print(f"Keys in bn but missing in en: {missing_in_en}")
if missing_in_bn:
    print(f"Keys in en but missing in bn: {missing_in_bn}")

pages = ['index.html', 'results.html', 'notices.html', 'services.html', 'portal.html', 'converter.html', 'tools.html', 'contact.html']
all_html_keys = set()
for page in pages:
    with open(page, 'r', encoding='utf-8') as f:
        html = f.read()
    tags = re.findall(r'data-i18n=["\']([^"\']+)["\']', html)
    placeholders = re.findall(r'data-i18n-placeholder=["\']([^"\']+)["\']', html)
    page_keys = set(tags + placeholders)
    all_html_keys.update(page_keys)
    
    missing_for_page = [k for k in page_keys if k not in bn_keys]
    if missing_for_page:
        print(f"ERROR: {page} has keys not in theme-lang.js: {missing_for_page}")
    else:
        print(f"PASS: {page} has all {len(page_keys)} keys defined in theme-lang.js")

print("\n--- Summary ---")
print(f"Total unique i18n keys used in HTML: {len(all_html_keys)}")
untranslated = [k for k in all_html_keys if k not in en_keys]
if untranslated:
    print(f"ERROR: HTML keys missing in en: {untranslated}")
else:
    print("ALL HTML keys have full English translations in theme-lang.js!")
