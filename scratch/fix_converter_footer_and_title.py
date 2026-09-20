import re

CONVERTER_PATH = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\converter.html'
TOOLS_PATH = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\tools.html'

# 1. Fix converter.html
with open(CONVERTER_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Change title
content = content.replace(
    '<span>ফয়জার সার্বজনীন বাংলা ও গণিত কনভার্টার</span>',
    '<span>ফয়জার কনভার্টার</span>'
)
content = content.replace(
    '"name": "ফয়জার সার্বজনীন বাংলা ও গণিত কনভার্টার (Fayzar Bangla Converter)"',
    '"name": "ফয়জার কনভার্টার (Fayzar Bangla Converter)"'
)

# Remove the first duplicate footer:
# Starts at `<!-- Footer -->\s*<footer class="bg-slate-900 text-slate-400 border-t-4 border-emerald-600.*?</footer>`
duplicate_footer_pattern = re.compile(
    r'\s*<!-- Footer -->\s*<footer class="bg-slate-900 text-slate-400 border-t-4 border-emerald-600.*?</footer\s*>',
    re.DOTALL
)

# Find and remove duplicate footer
if duplicate_footer_pattern.search(content):
    content = duplicate_footer_pattern.sub('', content, count=1)
    print("Removed duplicate top footer from converter.html")
else:
    print("Warning: Duplicate top footer pattern not found!")

# Also ensure the mobile nav dock is right after the final footer (lines around 1266)
mobile_dock_pattern = re.compile(
    r'(\s*<!-- Mobile Bottom Nav Dock -->\s*<nav aria-label="মোবাইল দ্রুত নেভিগেশন".*?</nav\s*>)',
    re.DOTALL
)

mobile_match = mobile_dock_pattern.search(content)
if mobile_match:
    dock_code = mobile_match.group(1)
    # Remove from its current position (which was right before modals)
    content = content[:mobile_match.start()] + content[mobile_match.end():]
    # Place it right after the closing </footer> of the final footer
    final_footer_pos = content.rfind('</footer>')
    if final_footer_pos != -1:
        insert_pos = final_footer_pos + len('</footer>')
        content = content[:insert_pos] + '\n' + dock_code + content[insert_pos:]
        print("Moved mobile nav dock below final footer in converter.html")

with open(CONVERTER_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Fix tools.html reference if any
with open(TOOLS_PATH, 'r', encoding='utf-8') as f:
    tools_content = f.read()

if 'ফয়জার সার্বজনীন বাংলা ও গণিত কনভার্টার' in tools_content:
    tools_content = tools_content.replace(
        'ফয়জার সার্বজনীন বাংলা ও গণিত কনভার্টার',
        'ফয়জার কনভার্টার'
    )
    with open(TOOLS_PATH, 'w', encoding='utf-8') as f:
        f.write(tools_content)
    print("Updated tools.html heading to ফয়জার কনভার্টার")

print("All updates completed successfully!")
