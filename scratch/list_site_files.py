import json
import os
import hashlib

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode('utf-8')
    return hashlib.sha1(header + data).hexdigest()

local_dir = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web'

EXCLUDE_DIRS = {
    'scratch', 'tests', '.agents', '.git', '__pycache__', 'node_modules', 
    'fayzar-homepage-redesign', '.system_generated', '.tempmediaStorage', '.user_uploaded'
}
EXCLUDE_FILES = {
    'github-config.json', 'land_gov_bd.html', 'recovered_1139am_index.html',
    'recovered_latest_redesign_index.html', 'sync-to-github.bat', 'sync-to-github.ps1'
}

files_to_check = []
for root, dirs, files in os.walk(local_dir):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    for file in files:
        if file in EXCLUDE_FILES or file.startswith('.') or file.endswith('.pyc'):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), local_dir).replace('\\', '/')
        if any(rel_path.startswith(ex + '/') for ex in EXCLUDE_DIRS):
            continue
        files_to_check.append(rel_path)

files_to_check.sort()
print(f'Total candidate site files: {len(files_to_check)}')
for f in files_to_check:
    print(f'  {f}')
