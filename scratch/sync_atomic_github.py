import json
import urllib.request
import os
import hashlib
import base64
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\github-config.json', 'r', encoding='utf-8') as f:
    cfg = json.load(f)

owner = cfg['owner']
repo = cfg['repo']
branch = cfg.get('branch', 'main')
token = cfg['token']

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'FayzarComputer-SyncTool'
}

def api_request(url, data=None, method=None):
    if data is not None and not isinstance(data, (bytes, str)):
        data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode('utf-8')
    return hashlib.sha1(header + data).hexdigest()

print(f"Connecting to GitHub: {owner}/{repo} (branch: {branch})...")

# 1. Get branch ref
ref_info = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{branch}')
latest_commit_sha = ref_info['object']['sha']
print(f"Current HEAD commit: {latest_commit_sha}")

# 2. Get commit details
commit_info = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/commits/{latest_commit_sha}')
base_tree_sha = commit_info['tree']['sha']
print(f"Base tree: {base_tree_sha}")

# 3. Get remote tree items
remote_tree = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/trees/{base_tree_sha}?recursive=1')
remote_files = {item['path']: item['sha'] for item in remote_tree.get('tree', []) if item['type'] == 'blob'}
print(f"Remote repository has {len(remote_files)} files.")

# 4. Local files to sync
local_dir = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web'

EXCLUDE_DIRS = {
    'scratch', 'tests', '.agents', '.git', '__pycache__', 'node_modules',
    'fayzar-homepage-redesign', '.system_generated', '.tempmediaStorage', '.user_uploaded'
}
EXCLUDE_FILES = {
    'github-config.json', 'land_gov_bd.html', 'recovered_1139am_index.html',
    'recovered_latest_redesign_index.html'
}

to_upload = []
identical_count = 0

for root, dirs, files in os.walk(local_dir):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    for file in files:
        if file in EXCLUDE_FILES or file.startswith('.') or file.endswith('.pyc'):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), local_dir).replace('\\', '/')
        if any(rel_path.startswith(ex + '/') for ex in EXCLUDE_DIRS):
            continue
        
        full_path = os.path.join(root, file)
        with open(full_path, 'rb') as f:
            content = f.read()
        local_sha = git_blob_sha(content)
        
        if rel_path in remote_files and remote_files[rel_path] == local_sha:
            identical_count += 1
        else:
            to_upload.append((rel_path, content, local_sha))

print(f"\nFiles already up-to-date on GitHub: {identical_count}")
print(f"Files to update/add ({len(to_upload)}):")
for p, content, sha in to_upload:
    print(f"  -> {p} ({len(content)} bytes)")

if not to_upload:
    print("\nEverything is already 100% up-to-date on GitHub!")
    sys.exit(0)

# 5. Upload modified/new blobs
new_tree_entries = []
uploaded_count = 0
for rel_path, content, expected_sha in to_upload:
    b64_content = base64.b64encode(content).decode('utf-8')
    payload = {
        'content': b64_content,
        'encoding': 'base64'
    }
    blob_res = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/blobs', data=payload, method='POST')
    created_sha = blob_res['sha']
    new_tree_entries.append({
        'path': rel_path,
        'mode': '100644',
        'type': 'blob',
        'sha': created_sha
    })
    uploaded_count += 1
    print(f"  [OK {uploaded_count}/{len(to_upload)}] Uploaded {rel_path} -> blob {created_sha[:7]}")

# 6. Create new Git Tree using base_tree
print("\nCreating new Git Tree on GitHub (with base_tree)...")
tree_payload = {
    'base_tree': base_tree_sha,
    'tree': new_tree_entries
}
new_tree = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/trees', data=tree_payload, method='POST')
new_tree_sha = new_tree['sha']
print(f"New Tree SHA: {new_tree_sha}")

# 7. Create Git Commit
commit_msg = (
    "fix: standardize results navbar font size & implement full bilingual English-Bengali translation across all subpages"
)
commit_payload = {
    'message': commit_msg,
    'tree': new_tree_sha,
    'parents': [latest_commit_sha]
}
print(f"Creating new commit: '{commit_msg}'...")
new_commit = api_request(f'https://api.github.com/repos/{owner}/{repo}/git/commits', data=commit_payload, method='POST')
new_commit_sha = new_commit['sha']
print(f"New Commit SHA: {new_commit_sha}")

# 8. Update branch ref
print(f"Updating branch 'refs/heads/{branch}' to commit {new_commit_sha}...")
ref_update = api_request(
    f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
    data={'sha': new_commit_sha},
    method='PATCH'
)

print(f"\n=======================================================")
print(f"[SUCCESS] All changes pushed to GitHub!")
print(f"Commit: {new_commit_sha}")
print(f"Commit URL: https://github.com/{owner}/{repo}/commit/{new_commit_sha}")
print(f"GitHub Repository: https://github.com/{owner}/{repo}")
print(f"Live Website: https://fayzarcomputer.github.io/")
print(f"=======================================================")
