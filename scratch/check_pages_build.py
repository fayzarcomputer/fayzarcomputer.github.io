import json
import urllib.request
import os

with open(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\github-config.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)

owner = cfg['owner']
repo = cfg['repo']
token = cfg['token']

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'FayzarComputer-SyncTool'
}

url = f'https://api.github.com/repos/{owner}/{repo}/pages/builds'
try:
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers)) as resp:
        builds = json.loads(resp.read().decode('utf-8'))
        if builds:
            latest = builds[0]
            print(f"Latest Pages Build Status: {latest.get('status')} (commit: {latest.get('commit', '')[:7]})")
except Exception as e:
    print('Pages build check error:', e)
