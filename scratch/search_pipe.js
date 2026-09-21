const fs = require('fs');

const files = [
  './js/bangla-converter-engine.js',
  './js/docx-handler.js',
  './js/docx-to-doc-engine.js',
  './js/main.js',
  './js/ai-ocr-engine.js',
  './fayzar-converter/js/bangla-converter-engine.js',
  './fayzar-converter/js/docx-handler.js',
  './fayzar-converter/js/docx-to-doc-engine.js',
  './fayzar-converter/js/main.js',
  './fayzar-converter/js/ai-ocr-engine.js'
];

for (let file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('|') && (l.includes('replace') || l.includes('join') || l.includes('split'))) {
      if (/['"]\s*\|\s*['"]|\\\|/.test(l)) {
        console.log(`${file}:${i + 1}: ${l.trim()}`);
      }
    }
  });
}
