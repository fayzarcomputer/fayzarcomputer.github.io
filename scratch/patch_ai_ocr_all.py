# -*- coding: utf-8 -*-
import os

def patch_file(fpath, is_fayzar_converter=False):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    is_crlf = '\r\n' in content
    content = content.replace('\r\n', '\n')

    if is_fayzar_converter:
        old_r9 = """9. NO REFERENCES OR CITATIONS (কোন প্রকার রেফারেন্স বা উৎস রাখা যাবে না):
   - CRITICAL: DO NOT include any references, board tags, school/college names, exam years, citations, or source brackets!
   - Completely omit brackets and tags such as: [ঢাকা বোর্ড-২০২৩], [দিনাজপুর বোর্ড ২০২১], [কুমিল্লা ক্যাডেট কলেজ], [রাজশাহী জিলা স্কুল], (বোর্ড প্রশ্ন), [অধ্যায়-৩], মান: ১০ ইত্যাদি সম্পূর্ণ বাদ দিন।"""

        new_r9 = """9. NO EXAM BOARD REFERENCES OR CITATIONS (কোন প্রকার পরীক্ষার বোর্ড রেফারেন্স বা উৎস ট্যাগ রাখা যাবে না, তবে ডকুমেন্টের বিষয়বস্তুর বন্ধনী, ইংরেজি ও হাইফেন ১০০% অক্ষত রাখতে হবে):
   - CRITICAL: Omit only exam board question references/tags such as: [ঢাকা বোর্ড-২০২৩], [দিনাজপুর বোর্ড ২০২১], [কুমিল্লা ক্যাডেট কলেজ], [রাজশাহী জিলা স্কুল], (বোর্ড প্রশ্ন), মান: ১০ ইত্যাদি।
   - STRICT PRESERVATION OF CONTENT PARENTHESES & ENGLISH GLOSSES (ডকুমেন্টের মূল বিষয়বস্তু, বন্ধনী, ইংরেজি শব্দ ও হাইফেন অক্ষত রাখার বাধ্যবাধকতা):
     * সাধারণ নথিপত্র, গঠনতন্ত্র, বিধিমালা, চুক্তিনামা বা প্রশ্নপত্রের মূল বিষয়বস্তুর ভেতরের কোনো বন্ধনী বা উদাহরণ যেমন: (Vision & Mission), (যেমন: ...), (বেঞ্চ/টেবিল), (ক), (খ) ইত্যাদি কখনোই বাদ দেওয়া যাবে না! এগুলো অবিকল রাখতে হবে।
     * বাংলা শব্দের পাশে ইংরেজি বন্ধনী (যেমন: রূপকল্প (Vision & Mission)) সম্পূর্ণ অক্ষত রাখতে হবে।
     * যুক্ত বা হাইফেনযুক্ত বাংলা শব্দসমূহ (যেমন: শিল্প-সংস্কৃতি, আলো-বাতাস, শিক্ষক-শিক্ষিকাদের, যুগোপযোগী, আর্থ-সামাজিক) এর ভেতরের হাইফেন (-) কোনোভাবেই বাদ বা মুছে ফেলা যাবে না!"""

        old_r12 = """12. NO EXTRA ENTERS OR BLANK LINES (অতিরিক্ত ফাঁকা লাইন বা ডাবল এন্টার নিষেধ):
   - CRITICAL: DO NOT insert empty blank lines or double Enters between questions, sub-questions, or lines.
   - Each question, sub-question, and option must follow immediately on the next line without empty blank lines in between."""

        new_r12 = """12. NO EXTRA ENTERS OR BLANK LINES (অতিরিক্ত ফাঁকা লাইন বা ডাবল এন্টার নিষেধ, তবে প্রতিটি অনুচ্ছেদ ও উপ-ধারা অবশ্যই আলাদা লাইনে থাকবে):
   - CRITICAL: DO NOT insert empty blank lines or double Enters between consecutive questions, sub-questions, or lines.
   - PRESERVE EVERY ARTICLE / SUB-ARTICLE ON ITS OWN LINE (প্রতিটি ধারা, উপ-ধারা ও প্যারাগ্রাফের নিজস্ব লাইন বজায় রাখা):
     * কোনো অনুচ্ছেদ, ধারা বা উপ-ধারা (যেমন: ধারা ৪: মূল উদ্দেশ্যসমূহ, ৪.১., ৪.২., ৪.৩., ৪.৪., ৪.৫., ধারা ৫: জমি ও ভবন, ৫.১., ৫.২. ইত্যাদি) কখনোই একসাথে এক লাইনে বা একটিমাত্র প্যারাগ্রাফে জোড়া লাগানো (collapse/merge) যাবে না! কখনোই পাইপ ' | ' দিয়ে এক লাইনে যুক্ত করবেন না!
     * প্রতিটি উপ-ধারা, তালিকা আইটেম বা অনুচ্ছেদ অবশ্যই তার নিজস্ব আলাদা নতুন লাইনে (Enter / newline) থাকবে।"""

        if old_r9 in content:
            content = content.replace(old_r9, new_r9)
            print(f"[{fpath}] Updated Rule 9")
        if old_r12 in content:
            content = content.replace(old_r12, new_r12)
            print(f"[{fpath}] Updated Rule 12")

    old_verify = "    - No board tags/references (e.g., omit [ঢাকা বোর্ড-২০২৩])."
    new_verify = """    - No exam board tags/references (e.g., omit [ঢাকা বোর্ড-২০২৩]).
    - Preserve all legitimate content parentheses e.g. (Vision & Mission), (যেমন: ...), (বেঞ্চ/টেবিল), and retain hyphens in compound words (শিল্প-সংস্কৃতি, আলো-বাতাস, শিক্ষক-শিক্ষিকাদের).
    - Never merge or collapse sub-articles or clause lines (৪.১, ৪.২, ৫.১, ৫.২); ensure each remains on its own separate line."""

    if old_verify in content:
        content = content.replace(old_verify, new_verify)
        print(f"[{fpath}] Updated Verify prompt")

    if is_crlf:
        content = content.replace('\n', '\r\n')

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved {fpath}\n")

patch_file(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\js\ai-ocr-engine.js', False)
patch_file(r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\fayzar-converter\js\ai-ocr-engine.js', True)
