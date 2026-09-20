import re, difflib

with open('services.html', 'r', encoding='utf-8') as f:
    s_html = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    i_html = f.read()

s_nav = re.search(r'<nav.*?</nav>', s_html, re.DOTALL).group(0)
i_nav = re.search(r'<nav.*?</nav>', i_html, re.DOTALL).group(0)

diff = difflib.unified_diff(i_nav.splitlines(), s_nav.splitlines(), fromfile='index_nav', tofile='services_nav', lineterm='')
with open('scratch/nav_diff.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(diff))
print("Wrote scratch/nav_diff.txt")
