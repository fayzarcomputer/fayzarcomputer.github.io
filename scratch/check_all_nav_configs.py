import re
import glob

pages = ['index.html', 'services.html', 'portal.html', 'converter.html', 'tools.html', 'results.html', 'notices.html', 'contact.html']

for page in pages:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    has_font_sans = 'fontFamily' in content
    nav_match = re.search(r'id="desktop-nav-links"[^>]*class="([^"]*)"', content)
    nav_classes = nav_match.group(1) if nav_match else 'None'
    print(f"[{page}]")
    print(f"  has_font_sans in tailwind.config: {has_font_sans}")
    print(f"  nav_classes: {nav_classes[:60]}...")
