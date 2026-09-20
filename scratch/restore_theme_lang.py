import json
import urllib.request
import base64

with open('github-config.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)

url = f"https://api.github.com/repos/{cfg['owner']}/{cfg['repo']}/contents/js/theme-lang.js?ref={cfg.get('branch', 'main')}"
req = urllib.request.Request(url, headers={
    'Authorization': f"Bearer {cfg['token']}",
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'FayzarSync'
})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    content = base64.b64decode(data['content']).decode('utf-8')

with open('js/theme-lang.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored pristine js/theme-lang.js from GitHub!")
