import json
import urllib.request
import os
import hashlib

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

# 1. Fetch ref
url = f'https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{branch}'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    commit_sha = json.loads(resp.read().decode('utf-8'))['object']['sha']

# 2. Fetch commit
c_url = f'https://api.github.com/repos/{owner}/{repo}/git/commits/{commit_sha}'
with urllib.request.urlopen(urllib.request.Request(c_url, headers=headers)) as resp:
    tree_sha = json.loads(resp.read().decode('utf-8'))['tree']['sha']

# 3. Fetch recursive tree
t_url = f'https://api.github.com/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1'
with urllib.request.urlopen(urllib.request.Request(t_url, headers=headers)) as resp:
    tree_data = json.loads(resp.read().decode('utf-8'))

remote_files = {}
for item in tree_data.get('tree', []):
    if item['type'] == 'blob':
        remote_files[item['path']] = item['sha']

print(f'Total remote files: {len(remote_files)}')

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode('utf-8')
    return hashlib.sha1(header + data).hexdigest()

local_dir = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web'

# Find local files
modified = []
added = []
identical = []

EXCLUDE_DIRS = {'scratch', 'tests', '.agents', '.git', '__pycache__', 'node_modules'}
EXCLUDE_FILES = {'github-config.json'}

for root, dirs, files in os.walk(local_dir):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    for file in files:
        if file in EXCLUDE_FILES or file.startswith('.') or file.endswith('.pyc'):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), local_dir).replace('\\', '/')
        if any(rel_path.startswith(ex + '/') for ex in EXCLUDE_DIRS):
            continue
        
        with open(os.path.join(root, file), 'rb') as f:
            content = f.read()
        local_sha = git_blob_sha(content)
        
        if rel_path in remote_files:
            if remote_files[rel_path] == local_sha:
                identical.append(rel_path)
            else:
                modified.append((rel_path, len(content)))
        else:
            added.append((rel_path, len(content)))

print(f'Identical files: {len(identical)}')
print(f'Modified files ({len(modified)}):')
for p, size in modified:
    print(f'  [M] {p} ({size} bytes)')

print(f'New/Added files ({len(added)}):')
for p, size in added:
    print(f'  [A] {p} ({size} bytes)')
