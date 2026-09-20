import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

d = json.load(open('scratch/bilingual_cache.json', 'r', encoding='utf-8'))
keys = [
    'সরকারি রাজস্ব ফি',
    'কম্পিউটার সার্ভিস চার্জ',
    'সাথে যা যা আনতে হবে (কাগজপত্রের চেকলিস্ট):',
    'নিয়োগের পদের নাম / শিরোনাম:',
    'পদসংখ্যা, শিক্ষাগত যোগ্যতা ও শর্তাবলী:',
    'শুরুর তারিখ:',
    'দিনাজপুর জেলা:',
    'হ্যাঁ (সকল জেলা)'
]
for k in keys:
    print(f"{k} in cache: {k in d} -> {d.get(k)}")
