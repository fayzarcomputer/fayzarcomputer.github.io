import json
with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
print(f"Current count: {len(d)} / 784")
