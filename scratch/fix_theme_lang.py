import re
import subprocess
import json

with open('scratch/add_translations_to_theme_lang.py', 'r', encoding='utf-8') as f:
    orig_code = f.read()

# Extract dict_bn and dict_en
local_vars = {}
exec(orig_code, {}, local_vars)
dict_bn = local_vars['dict_bn']
dict_en = local_vars['dict_en']

with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove previous imperfect insertion if present
if '// --- Subpages Comprehensive Translations (bn) ---' in content:
    content = re.sub(r'\n\s*// --- Subpages Comprehensive Translations \(bn\) ---[\s\S]*?(?=\s*\}\s*,\s*\n\s*en:)', '', content)
if '// --- Subpages Comprehensive Translations (en) ---' in content:
    content = re.sub(r'\n\s*// --- Subpages Comprehensive Translations \(en\) ---[\s\S]*?(?=\s*\}\s*;\s*\n\s*//)', '', content)

# 1. Format BN additions
bn_lines = ["\n      // --- Subpages Comprehensive Translations (bn) ---"]
for k, v in dict_bn.items():
    escaped_v = v.replace("\\", "\\\\").replace("'", "\\'")
    bn_lines.append(f"      {k}: '{escaped_v}',")
bn_block = "\n".join(bn_lines) + "\n"

# 2. Format EN additions
en_lines = ["\n      // --- Subpages Comprehensive Translations (en) ---"]
for k, v in dict_en.items():
    escaped_v = v.replace("\\", "\\\\").replace("'", "\\'")
    en_lines.append(f"      {k}: '{escaped_v}',")
en_block = "\n".join(en_lines) + "\n"

# 3. Find bn insertion point: right after footer_proprietor: 'মোঃ ফয়জার আলী'
# Ensure comma after footer_proprietor
content = re.sub(
    r"(footer_proprietor:\s*'[^']+')(\s*\n\s*\})",
    r"\1,\2",
    content
)

# Insert bn_block before the closing } of bn:
content = re.sub(
    r"(footer_proprietor:\s*'মোঃ ফয়জার আলী',)(\s*\n\s*\})",
    r"\1" + bn_block + r"    }",
    content
)

# Insert en_block before the closing } of en:
content = re.sub(
    r"(footer_proprietor:\s*'Md\. Fayzar Ali',)(\s*\n\s*\})",
    r"\1" + en_block + r"    }",
    content
)

with open('js/theme-lang.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated js/theme-lang.js!")
res = subprocess.run(['node', '-c', 'js/theme-lang.js'], capture_output=True, text=True)
if res.returncode == 0:
    print("Syntax check PASSED! js/theme-lang.js is 100% valid JavaScript.")
else:
    print("Syntax check FAILED:")
    print(res.stderr)
