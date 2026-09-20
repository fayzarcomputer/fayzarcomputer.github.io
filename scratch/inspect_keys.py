import re

with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    text = f.read()

keys = re.findall(r'"([a-zA-Z0-9_-]+)":\s*"', text)
print('Total keys found in theme-lang.js:', len(keys))
sub_keys = [k for k in keys if any(k.startswith(p) for p in ['results_', 'notices_', 'services_', 'portal_', 'converter_', 'tools_', 'contact_'])]
unique_sub_keys = sorted(list(set(sub_keys)))
print('Unique subpage keys count:', len(unique_sub_keys))
for k in unique_sub_keys:
    print('  ', k)
