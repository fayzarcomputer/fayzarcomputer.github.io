# -*- coding: utf-8 -*-
"""
ফয়জার কম্পিউটার — স্বয়ংক্রিয় গিটহাব পুশ ও সিঙ্ক ইঞ্জিন (GitHub Push Engine)
GitHub Git Data API ব্যবহার করে লোকাল প্রজেক্টের সকল পরিবর্তন সরাসরি GitHub রিপোজিটরিতে পুশ করে।
"""

import os
import sys
import json
import base64
import hashlib
import urllib.request
import urllib.error

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "github-config.json")

if not os.path.exists(CONFIG_PATH):
    print(f"[ERROR] Config file not found: {CONFIG_PATH}")
    sys.exit(1)

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    cfg = json.load(f)

OWNER = cfg.get("owner", "fayzarcomputer")
REPO = cfg.get("repo", "fayzarcomputer.github.io")
BRANCH = cfg.get("branch", "main")
TOKEN = cfg.get("token", "").strip()

if not TOKEN:
    print("[ERROR] GitHub token is missing in github-config.json!")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "FayzarComputer-PushEngine"
}

def api_request(url, data=None, method=None):
    if data is not None and not isinstance(data, (bytes, str)):
        data = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={**HEADERS, "Content-Type": "application/json"},
        method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        print(f"[API ERROR {e.code}] {url}: {body[:200]}")
        raise

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("utf-8")
    return hashlib.sha1(header + data).hexdigest()

def main():
    print("=" * 65)
    print(f" [Fayzar Computer] GitHub Atomic Push Engine")
    print(f" Target: https://github.com/{OWNER}/{REPO} (Branch: {BRANCH})")
    print("=" * 65)

    # 1. Get branch ref
    print(f"[*] Fetching branch ref for '{BRANCH}'...")
    ref_info = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
    latest_commit_sha = ref_info["object"]["sha"]
    print(f"    Current HEAD commit: {latest_commit_sha[:10]}...")

    # 2. Get commit details
    commit_info = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits/{latest_commit_sha}")
    base_tree_sha = commit_info["tree"]["sha"]
    print(f"    Base Tree SHA:       {base_tree_sha[:10]}...")

    # 3. Get remote tree items
    print("[*] Inspecting remote tree...")
    remote_tree = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees/{base_tree_sha}?recursive=1")
    remote_files = {item["path"]: item["sha"] for item in remote_tree.get("tree", []) if item["type"] == "blob"}
    print(f"    Remote has {len(remote_files)} tracked files.")

    # 4. Scan local files
    EXCLUDE_DIRS = {
        "scratch", "tests", ".agents", ".git", "__pycache__", "node_modules",
        "fayzar-homepage-redesign", ".system_generated", ".tempmediaStorage", ".user_uploaded",
        ".antigravity"
    }
    EXCLUDE_FILES = {
        "github-config.json", "github_token.txt", "test_api_keys.js",
        "land_gov_bd.html", "recovered_1139am_index.html", "recovered_latest_redesign_index.html"
    }

    to_upload = []
    identical_count = 0

    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for file in files:
            if file in EXCLUDE_FILES or file.startswith(".") or file.endswith(".pyc"):
                continue
            rel_path = os.path.relpath(os.path.join(root, file), BASE_DIR).replace("\\", "/")
            if any(rel_path.startswith(ex + "/") for ex in EXCLUDE_DIRS):
                continue

            full_path = os.path.join(root, file)
            with open(full_path, "rb") as f:
                content = f.read()
            local_sha = git_blob_sha(content)

            if rel_path in remote_files and remote_files[rel_path] == local_sha:
                identical_count += 1
            else:
                to_upload.append((rel_path, content, local_sha))

    print(f"\n[*] Scan Results:")
    print(f"    Already up to date on GitHub: {identical_count} files")
    print(f"    Files to upload / update:     {len(to_upload)} files")

    if not to_upload:
        print("\n[SUCCESS] Everything is already 100% up-to-date on GitHub!")
        return

    for p, content, _ in to_upload:
        print(f"    -> {p} ({len(content):,} bytes)")

    # 5. Upload blobs
    print(f"\n[*] Uploading {len(to_upload)} modified files to GitHub...")
    new_tree_entries = []
    for idx, (rel_path, content, _) in enumerate(to_upload, 1):
        b64_content = base64.b64encode(content).decode("utf-8")
        payload = {
            "content": b64_content,
            "encoding": "base64"
        }
        blob_res = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/blobs", data=payload, method="POST")
        created_sha = blob_res["sha"]
        new_tree_entries.append({
            "path": rel_path,
            "mode": "100644",
            "type": "blob",
            "sha": created_sha
        })
        print(f"    [{idx}/{len(to_upload)}] Uploaded {rel_path} -> blob {created_sha[:7]}")

    # 6. Create new Git Tree
    print("\n[*] Creating new Git Tree on GitHub...")
    tree_payload = {
        "base_tree": base_tree_sha,
        "tree": new_tree_entries
    }
    new_tree = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees", data=tree_payload, method="POST")
    new_tree_sha = new_tree["sha"]
    print(f"    New Tree SHA: {new_tree_sha}")

    # 7. Create Git Commit
    commit_msg = "fix(ocr): optimize Gemini key rotation, auto-failover on 503, realistic timeouts & instant retry"
    commit_payload = {
        "message": commit_msg,
        "tree": new_tree_sha,
        "parents": [latest_commit_sha]
    }
    print(f"[*] Creating Git Commit: '{commit_msg}'...")
    new_commit = api_request(f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits", data=commit_payload, method="POST")
    new_commit_sha = new_commit["sha"]
    print(f"    New Commit SHA: {new_commit_sha}")

    # 8. Update branch ref
    print(f"[*] Updating branch 'refs/heads/{BRANCH}' -> {new_commit_sha[:10]}...")
    api_request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
        data={"sha": new_commit_sha},
        method="PATCH"
    )

    print("\n" + "=" * 65)
    print(" [SUCCESS] All changes pushed to GitHub successfully!")
    print(f" Commit SHA:  {new_commit_sha}")
    print(f" Commit URL:  https://github.com/{OWNER}/{REPO}/commit/{new_commit_sha}")
    print(f" Repository:  https://github.com/{OWNER}/{REPO}")
    print(f" Live Web:    https://fayzarcomputer.github.io/")
    print("=" * 65)

if __name__ == "__main__":
    main()
