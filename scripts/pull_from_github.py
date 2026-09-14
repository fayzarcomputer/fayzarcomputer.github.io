# -*- coding: utf-8 -*-
"""
ফয়জার কম্পিউটার — স্বয়ংক্রিয় গিটহাব ডাউনলোড ও আপডেট ইঞ্জিন (GitHub Pull Engine)
GitHub API / Zipball থেকে অফলাইন ভার্সনে সর্বশেষ পরিবর্তন ডাউনলোড ও সিঙ্ক করার টুল
"""

import os
import sys
import io
import json
import zipfile
import urllib.request
import urllib.error
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

OWNER = "fayzarcomputer"
REPO = "fayzarcomputer.github.io"
BRANCH = "main"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN_FILE = os.path.join(BASE_DIR, "github_token.txt")
PARENT_TOKEN_FILE = os.path.join(os.path.dirname(BASE_DIR), "github_token.txt")
CONFIG_FILE = os.path.join(BASE_DIR, "github-config.json")

TOKEN = ""
if os.path.exists(TOKEN_FILE):
    with open(TOKEN_FILE, "r", encoding="utf-8") as f:
        TOKEN = f.read().strip()
elif os.path.exists(PARENT_TOKEN_FILE):
    with open(PARENT_TOKEN_FILE, "r", encoding="utf-8") as f:
        TOKEN = f.read().strip()
elif os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            TOKEN = cfg.get("token", "").strip()
    except Exception:
        pass

# সংরক্ষণের জন্য যে ফাইলগুলো ওভাররাইট করা যাবে না
PRESERVE_FILES = {
    "github_token.txt", "github-config.json",
    "GEMINI.md", "PROJECT_MAP.md",
    "UPDATE_TO_GITHUB.bat", "PULL_FROM_GITHUB.bat",
    "START_OFFLINE.bat", "OPEN_OFFLINE_DIRECT.bat",
    "serve_offline.py", "sync_to_github.py", "pull_from_github.py"
}

PRESERVE_DIRS = {
    ".antigravity", "scratch", "__pycache__"
}

def api_headers():
    headers = {
        "User-Agent": "Fayzar-GitHub-Puller/2.0",
        "Accept": "application/vnd.github+json"
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    return headers

def fetch_latest_commit():
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits/{BRANCH}"
    req = urllib.request.Request(url, headers=api_headers())
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return {
        "sha": data["sha"],
        "short_sha": data["sha"][:7],
        "message": data["commit"]["message"].split("\n")[0],
        "date": data["commit"]["author"]["date"]
    }

def download_and_extract(commit_info):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/zipball/{BRANCH}"
    print(f"[২/৪] গিটহাব থেকে রেপোজিটরি জিপ ডাউনলোড করা হচ্ছে...", flush=True)
    req = urllib.request.Request(url, headers=api_headers())
    with urllib.request.urlopen(req) as resp:
        zip_bytes = resp.read()
    
    mb = len(zip_bytes) / (1024 * 1024)
    print(f"  ✓ ডাউনলোড সম্পন্ন! সাইজ: {mb:.2f} MB", flush=True)

    print(f"\n[৩/৪] ফাইলসমূহ এক্সট্র্যাক্ট করে লোকাল অফলাইন সাইট আপডেট করা হচ্ছে...", flush=True)
    z = zipfile.ZipFile(io.BytesIO(zip_bytes))
    all_names = z.namelist()
    if not all_names:
        raise RuntimeError("ডাউনলোডকৃত জিপ ফাইল খালি!")
    
    root_prefix = all_names[0].split("/")[0] + "/"

    updated_files = []
    added_files = []
    skipped_files = []

    for item in z.infolist():
        if item.is_dir():
            continue
        rel_path = item.filename[len(root_prefix):].replace("/", os.sep)
        if not rel_path:
            continue

        base_name = os.path.basename(rel_path)
        first_segment = rel_path.split(os.sep)[0]

        if base_name in PRESERVE_FILES or first_segment in PRESERVE_DIRS:
            skipped_files.append(rel_path)
            continue

        content = z.read(item.filename)
        dest_path = os.path.join(BASE_DIR, rel_path)
        dest_dir = os.path.dirname(dest_path)

        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)

        is_new = not os.path.exists(dest_path)
        needs_write = True

        if not is_new:
            try:
                with open(dest_path, "rb") as cur:
                    if cur.read() == content:
                        needs_write = False
            except Exception:
                pass

        if needs_write:
            with open(dest_path, "wb") as out:
                out.write(content)
            if is_new:
                added_files.append(rel_path)
            else:
                updated_files.append(rel_path)

    return updated_files, added_files, skipped_files

def main():
    print("=======================================================================", flush=True)
    print("        ফয়জার কম্পিউটার — গিটহাব থেকে অফলাইন আপডেট ম্যানেজার", flush=True)
    print("=======================================================================\n", flush=True)

    print("[১/৪] গিটহাবে সর্বশেষ পরিবর্তনের তথ্য সংগ্রহ করা হচ্ছে...", flush=True)
    try:
        commit_info = fetch_latest_commit()
        print(f"  ✓ রিমোট সর্বশেষ কমিট: {commit_info['short_sha']} - {commit_info['message']}", flush=True)
        print(f"  ✓ তারিখ: {commit_info['date']}", flush=True)
    except Exception as e:
        print(f"  ❌ গিটহাব থেকে তথ্য আনতে সমস্যা হয়েছে: {e}", flush=True)
        return False

    try:
        updated, added, skipped = download_and_extract(commit_info)
    except Exception as e:
        print(f"  ❌ আপডেট সম্পন্ন করতে ত্রুটি: {e}", flush=True)
        return False

    print(f"\n[৪/৪] আপডেটের ফলাফল:", flush=True)
    print(f"  ✓ মোট পরিবর্তিত/আপডেট ফাইল: {len(updated)} টি", flush=True)
    for idx, f in enumerate(updated[:15], 1):
        print(f"     - [আপডেট] {f}", flush=True)
    if len(updated) > 15:
        print(f"     ... এবং আরও {len(updated) - 15}টি ফাইল", flush=True)

    print(f"\n  ✓ মোট নতুন যুক্ত ফাইল: {len(added)} টি", flush=True)
    for idx, f in enumerate(added, 1):
        print(f"     - [নতুন] {f}", flush=True)

    print("\n=======================================================================", flush=True)
    print(f"  🎉 সফলভাবে অফলাইন ভার্সন গিটহাব (কমিট: {commit_info['short_sha']}) অনুযায়ী আপডেট হয়েছে!", flush=True)
    print("=======================================================================\n", flush=True)
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
