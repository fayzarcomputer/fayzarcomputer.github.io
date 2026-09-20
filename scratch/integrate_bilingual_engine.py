import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/bilingual_cache.json', 'r', encoding='utf-8') as f:
    bilingual_dict = json.load(f)

print(f"Total phrases to embed: {len(bilingual_dict)}")

with open('js/theme-lang.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Serialize dict to JSON formatted for JS
dict_js_str = json.dumps(bilingual_dict, ensure_ascii=False, indent=2)

dict_and_walker_code = f"""
  // =========================================================================
  // 1.5. Comprehensive Inner DOM Content Dictionary (870+ sentences & phrases)
  // =========================================================================
  const bilingualContentDict = {dict_js_str};

  const bnDigits = '০১২৩৪৫৬৭৮৯';
  const enDigits = '0123456789';

  function toEnDigits(str) {{
    if (!str) return str;
    return str.replace(/[০-৯]/g, (ch) => enDigits[bnDigits.indexOf(ch)]);
  }}

  function getEnglishTranslation(text) {{
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    // 1. Direct dictionary match
    if (bilingualContentDict[trimmed]) {{
      return bilingualContentDict[trimmed];
    }}

    // 2. Strip leading/trailing emoji, bullets, symbols
    const m = trimmed.match(/^([^\\w\\s\\u0980-\\u09FF]*\\s*)([\\w\\s\\u0980-\\u09FF()–—\\-]+)(.*)$/);
    if (m) {{
      const prefix = m[1];
      const core = m[2].trim();
      const suffix = m[3];
      if (bilingualContentDict[core]) {{
        return prefix + bilingualContentDict[core] + suffix;
      }}
    }}

    // 3. Dynamic patterns
    if (trimmed.startsWith('সেবা ')) {{
      return 'Service ' + toEnDigits(trimmed.substring(5));
    }}
    if (trimmed.startsWith('শেষ:')) {{
      return 'Deadline:' + toEnDigits(trimmed.substring(4));
    }}
    if (trimmed.includes('দিন বাকি')) {{
      return toEnDigits(trimmed.replace('দিন বাকি', 'days left'));
    }}
    if (trimmed.includes('সক্রিয় সার্কুলার')) {{
      return toEnDigits(trimmed.replace('সক্রিয় সার্কুলার', 'Active Circulars').replace('টি', ''));
    }}
    if (/^[\\d\\s\\u09E6-\\u09EF/.,\\-+–—%৳]+$/.test(trimmed)) {{
      return toEnDigits(trimmed);
    }}

    return null;
  }}

  let i18nObserver = null;
  function startI18nObserver() {{
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.body) return;
    if (i18nObserver) return;
    i18nObserver = new MutationObserver((mutations) => {{
      if (currentLang !== 'en') return;
      let shouldTranslate = false;
      for (const m of mutations) {{
        if (m.addedNodes && m.addedNodes.length > 0) {{
          shouldTranslate = true;
          break;
        }}
      }}
      if (shouldTranslate) {{
        if (window._i18n_timer) clearTimeout(window._i18n_timer);
        window._i18n_timer = setTimeout(() => {{
          translateDOMTextNodes('en');
        }}, 60);
      }}
    }});
    i18nObserver.observe(document.body, {{ childList: true, subtree: true }});
  }}

  function stopI18nObserver() {{
    if (i18nObserver) {{
      i18nObserver.disconnect();
      i18nObserver = null;
    }}
  }}

  function translateDOMTextNodes(lang) {{
    if (!bilingualContentDict || Object.keys(bilingualContentDict).length === 0) return;
    if (typeof document === 'undefined' || !document.body) return;

    if (lang === 'en') {{
      startI18nObserver();

      // 1. Text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {{
          acceptNode: function(node) {{
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toUpperCase();
            if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA'].includes(tag)) {{
              return NodeFilter.FILTER_REJECT;
            }}
            if (parent.hasAttribute('data-i18n')) {{
              return NodeFilter.FILTER_REJECT;
            }}
            return NodeFilter.FILTER_ACCEPT;
          }}
        }}
      );

      const nodesToTranslate = [];
      while (walker.nextNode()) {{
        nodesToTranslate.push(walker.currentNode);
      }}

      nodesToTranslate.forEach((node) => {{
        const trimmed = node.nodeValue.trim();
        if (!trimmed) return;
        const translated = getEnglishTranslation(trimmed);
        if (translated) {{
          if (node.__orig_text === undefined) {{
            node.__orig_text = node.nodeValue;
          }}
          node.nodeValue = node.nodeValue.replace(trimmed, translated);
        }}
      }});

      // 2. Select Option elements
      document.querySelectorAll('option').forEach((opt) => {{
        const trimmed = opt.textContent.trim();
        if (trimmed) {{
          const translated = getEnglishTranslation(trimmed);
          if (translated) {{
            if (opt.__orig_text === undefined) {{
              opt.__orig_text = opt.textContent;
            }}
            opt.textContent = translated;
          }}
        }}
      }});

      // 3. Placeholders
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {{
        const placeholder = el.getAttribute('placeholder');
        if (placeholder && !el.hasAttribute('data-i18n-placeholder')) {{
          const trimmed = placeholder.trim();
          const translated = getEnglishTranslation(trimmed);
          if (translated) {{
            if (el.__orig_placeholder === undefined) {{
              el.__orig_placeholder = placeholder;
            }}
            el.setAttribute('placeholder', translated);
          }}
        }}
      }});

      // 4. Title attributes
      document.querySelectorAll('[title]').forEach((el) => {{
        const title = el.getAttribute('title');
        if (title && !el.hasAttribute('data-i18n-title')) {{
          const trimmed = title.trim();
          const translated = getEnglishTranslation(trimmed);
          if (translated) {{
            if (el.__orig_title === undefined) {{
              el.__orig_title = title;
            }}
            el.setAttribute('title', translated);
          }}
        }}
      }});

    }} else {{
      stopI18nObserver();

      // Revert to Bengali (lang === 'bn')
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {{
          acceptNode: function(node) {{
            return (node.__orig_text !== undefined) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }}
        }}
      );
      const nodesToRestore = [];
      while (walker.nextNode()) {{
        nodesToRestore.push(walker.currentNode);
      }}
      nodesToRestore.forEach((node) => {{
        if (node.__orig_text !== undefined) {{
          node.nodeValue = node.__orig_text;
        }}
      }});

      document.querySelectorAll('option').forEach((opt) => {{
        if (opt.__orig_text !== undefined) {{
          opt.textContent = opt.__orig_text;
        }}
      }});

      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {{
        if (el.__orig_placeholder !== undefined) {{
          el.setAttribute('placeholder', el.__orig_placeholder);
        }}
      }});

      document.querySelectorAll('[title]').forEach((el) => {{
        if (el.__orig_title !== undefined) {{
          el.setAttribute('title', el.__orig_title);
        }}
      }});
    }}
  }}
"""

# Replace the existing bilingual block in js_content
start_marker = "// =========================================================================\n  // 1.5. Comprehensive Inner DOM"
end_marker = "// =========================================================================\n  // 2. State Management"

if start_marker in js_content and end_marker in js_content:
    idx_start = js_content.find(start_marker)
    idx_end = js_content.find(end_marker)
    js_content = js_content[:idx_start] + dict_and_walker_code.strip() + "\n\n  " + js_content[idx_end:]
else:
    print("Markers not found, searching fallback...")
    target_mark = "// 2. State Management"
    parts = js_content.split(target_mark)
    js_content = parts[0] + dict_and_walker_code + "\n  // =========================================================================\n  " + target_mark + parts[1]

with open('js/theme-lang.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Updated js/theme-lang.js successfully with partial pattern matcher & MutationObserver!")
