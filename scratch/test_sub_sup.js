const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));

// Test renderSuperscriptsAndSubscripts with times replacement
function testRenderSubSup(raw) {
  let s = raw;
  s = s.replace(/\\times\b/g, ' × ').replace(/×/g, ' × ');
  s = s.replace(/\\div\b/g, ' ÷ ');
  s = s.replace(/\\pm\b/g, ' ± ');
  s = s.replace(/\\rightarrow|\\to/g, ' → ');
  s = s.replace(/\\cdot\b/g, ' · ');
  s = s.replace(/\s+/g, ' ').trim();

  const scriptSize = '8.0';

  // Subscripts first or superscripts
  s = s.replace(/\^\{([^}]+)\}|\^\(([^)]+)\)|\^([a-zA-Z0-9\u09E6-\u09EF+\-]+)/g, (m, g1, g2, g3) => {
    const val = g1 || g2 || g3;
    return `<sup style="font-size:${scriptSize}pt;vertical-align:super;mso-text-raise:3.0pt;">${val}</sup>`;
  });

  s = s.replace(/_\{([^}]+)\}|_\(([^)]+)\)|_([a-zA-Z0-9\u09E6-\u09EF+\-]+)/g, (m, g1, g2, g3) => {
    const val = g1 || g2 || g3;
    return `<sub style="font-size:${scriptSize}pt;vertical-align:sub;mso-text-raise:-2.0pt;">${val}</sub>`;
  });

  return s;
}

const items = [
  '6.023 \\times 10^{23}',
  '6.023 \\times 10^{22}',
  'CO_{2}',
  'H_{2}SO_{4}',
  'CCl_{4}',
  'CH_{4}',
  'CaCO_{3}',
  'N_{2} + 3H_{2} = 2NH_{3}'
];

for (const item of items) {
  console.log('INPUT: ', item);
  console.log('OUTPUT:', testRenderSubSup(item));
  console.log('');
}
