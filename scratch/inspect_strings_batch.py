import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/all_bengali_strings.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

strings = data['strings']
print(f"Total: {len(strings)}")
for i, s in enumerate(strings[:30]):
    print(f"[{i:3d}] {s}")
