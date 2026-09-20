import json
import urllib.request
import os

with open(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\github-config.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)

owner = cfg['owner']
repo = cfg['repo']
branch = cfg.get('branch', 'main')
token = cfg['token']

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'FayzarComputer-Agent'
}

url = f'https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{branch}'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        commit_sha = data['object']['sha']
        print(f'Connected successfully! Latest commit SHA on {branch}: {commit_sha}')
        
        # Also get latest commit details to see the tree SHA
        c_url = f'https://api.github.com/repos/{owner}/{repo}/git/commits/{commit_sha}'
        c_req = urllib.request.Request(c_url, headers=headers)
        with urllib.request.urlopen(c_req) as c_resp:
            c_data = json.loads(c_resp.read().decode('utf-8'))
            print('Commit message:', c_data['message'])
            print('Base tree SHA:', c_data['tree']['sha'])
except Exception as e:
    print('Error:', e)
