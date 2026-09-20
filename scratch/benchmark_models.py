"""
Fayzar OCR - Bengali Flash Model Quality Benchmark
====================================================
সব Flash model-এ একটি Bengali document OCR task পাঠিয়ে
মান, গতি ও নির্ভুলতা তুলনা করা হবে।
"""
import base64, json, urllib.request, urllib.error, re, time, sys
from concurrent.futures import ThreadPoolExecutor

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

# ── কি ডিকোড ──────────────────────────────────────────
with open('js/fayzar-ocr-config.js', 'r', encoding='utf-8') as f:
    text = f.read()
keys_block = text[text.find('KEYS: ['):text.find('MASK_SALT')]
matches = re.findall(r'"([A-Za-z0-9+/=]{20,})"', keys_block)
keys = []
for m in matches:
    raw = base64.b64decode(m).decode('latin1')
    unpacked = ''.join(chr(ord(c) ^ 42) for c in raw)
    if unpacked.startswith('AIzaSy') or unpacked.startswith('AQ.'):
        keys.append(unpacked)
print(f'[OK] Deobfuscated {len(keys)} Gemini keys')
print(f'   First key: {keys[0][:10]}...\n')

# ── Test মডেলগুলো ──────────────────────────────────────
MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
]

# ── Bengali OCR Quality Test Prompt ────────────────────
SYSTEM = "You are a Bengali OCR expert. Extract the Bengali text EXACTLY as shown, preserving all characters, punctuation, and numbering. No explanations."

USER_TASK = """নিচের বাংলা পরীক্ষার প্রশ্নটি হুবহু টাইপ করুন (কোনো পরিবর্তন করবেন না):

[ছবিতে লেখা আছে:]
পঞ্চম শ্রেণি — বার্ষিক পরীক্ষা ২০২৪
বিষয়: বাংলা ব্যাকরণ    পূর্ণমান: ১০০    সময়: ৩ ঘণ্টা

সৃজনশীল প্রশ্ন
১। নিচের উদ্দীপকটি পড়ে প্রশ্নগুলোর উত্তর দাও:
উদ্দীপক: রহিম একজন কৃষক। সে প্রতিদিন ভোরবেলা মাঠে যায় এবং সন্ধ্যায় বাড়ি ফেরে। তার পরিশ্রম ও নিষ্ঠার কারণে তার জমিতে প্রতি বছর প্রচুর ফসল হয়।
ক. 'নিষ্ঠা' শব্দের অর্থ কী?
খ. রহিম কেন প্রতিদিন ভোরবেলা মাঠে যায়?
গ. রহিমের জীবনযাপন পদ্ধতি তোমার জীবনে কীভাবে প্রেরণা দেয়? ব্যাখ্যা কর।
ঘ. "পরিশ্রমই সাফল্যের চাবিকাঠি"—উদ্দীপকের আলোকে মন্তব্যটি বিশ্লেষণ কর।

বহুনির্বাচনী প্রশ্ন (MCQ)
১। 'আকাশ' শব্দের সমার্থক শব্দ কোনটি?
	ক. গগন	খ. নদী	গ. পর্বত	ঘ. সাগর

এখন উপরের পুরো টেক্সটটি হুবহু লিখুন।"""

EXPECTED_KEYWORDS = [
    'পঞ্চম শ্রেণি', 'বার্ষিক পরীক্ষা', 'সৃজনশীল', 'উদ্দীপক', 'নিষ্ঠা',
    'বহুনির্বাচনী', 'গগন', 'পরিশ্রমই', 'চাবিকাঠি'
]

def score_output(output, expected_kw):
    """মান যাচাই: কতটি keyword সঠিকভাবে আছে"""
    if not output:
        return 0, []
    found = [kw for kw in expected_kw if kw in output]
    score = round(len(found) / len(expected_kw) * 100)
    return score, found

def test_model_quality(model):
    key = keys[0]  # প্রথম কি দিয়ে test
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
    payload = json.dumps({
        'system_instruction': {'parts': [{'text': SYSTEM}]},
        'contents': [{'parts': [{'text': USER_TASK}]}],
        'generationConfig': {'temperature': 0.1, 'maxOutputTokens': 2048}
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            elapsed = round(time.time() - start, 2)
            body = res.read().decode('utf-8')
            data = json.loads(body)
            output = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            score, found = score_output(output, EXPECTED_KEYWORDS)
            return {
                'model': model, 'status': 'ok', 'time': elapsed,
                'score': score, 'found': found, 'output_len': len(output),
                'sample': output[:200].replace('\n', ' ')
            }
    except urllib.error.HTTPError as e:
        elapsed = round(time.time() - start, 2)
        body = e.read().decode('utf-8', errors='ignore')
        try: msg = json.loads(body).get('error', {}).get('message', '')[:80]
        except: msg = body[:80]
        return {'model': model, 'status': f'HTTP {e.code}', 'time': elapsed, 'score': -1, 'error': msg}
    except Exception as e:
        return {'model': model, 'status': 'timeout/error', 'time': -1, 'score': -1, 'error': str(e)[:60]}

# ── Run Tests ───────────────────────────────────────────
print('='*65)
print('  Bengali OCR Flash Model Quality Benchmark')
print('='*65)
print(f'  Test: Bengali question paper reproduction accuracy')
print(f'  Expected keywords: {len(EXPECTED_KEYWORDS)}\n')

results = []
for model in MODELS:
    print(f'  Testing {model}...', end='', flush=True)
    r = test_model_quality(model)
    results.append(r)
    if r['score'] >= 0:
        bar = '█' * (r['score'] // 10) + '░' * (10 - r['score'] // 10)
        print(f' {r["time"]}s | Score: {r["score"]}% [{bar}]')
    else:
        print(f' ❌ {r["status"]} - {r.get("error", "")}')

# ── Final Ranking ────────────────────────────────────────
print('\n' + '='*65)
print('  RESULTS RANKING (by quality score)')
print('='*65)

working = sorted([r for r in results if r['score'] >= 0], key=lambda x: (-x['score'], x['time']))
failed = [r for r in results if r['score'] < 0]

rank = 1
for r in working:
    bar = '█' * (r['score'] // 10) + '░' * (10 - r['score'] // 10)
    print(f'  #{rank} {r["model"]:<45} {r["score"]:>3}% | {r["time"]}s')
    if r.get('found'):
        print(f'      Found keywords: {", ".join(r["found"][:5])}{"..." if len(r["found"]) > 5 else ""}')
    rank += 1

if failed:
    print(f'\n  FAILED ({len(failed)} models):')
    for r in failed:
        print(f'     {r["model"]}: {r["status"]}')

if working:
    best = working[0]
    print(f'\n  WINNER: {best["model"]}')
    print(f'     Score: {best["score"]}%  |  Speed: {best["time"]}s')
    print(f'     Sample output: {best.get("sample", "")[:120]}...')
