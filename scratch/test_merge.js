const EquationConverter = require('../js/equation-converter.js');

function healAlgebraicPowers(raw) {
  if (!raw) return '';
  let s = raw;

  // Step 1: Parenthesized expressions followed by a power e.g. (x+y)2 -> $(x+y)^2$, (x-y)2 -> $(x-y)^2$
  s = s.replace(/(\([a-zA-Z0-9\s_+\-*\/=]+\))\s*([2-9]|\d{2,})(?![\$\w])/g, (m, g1, g2) => '$(' + g1.slice(1, -1) + ')^{' + g2 + '}$');

  // Step 2: Variables or coeff+var followed by power (2-9) before operators or boundaries
  // e.g. 4x2 -> $4x^2$, 8x2 -> $8x^2$, 2a3 -> $2a^3$, 3a2 -> $3a^2$, a2 -> $a^2$, b2 -> $b^2$, c2 -> $c^2$
  s = s.replace(/(?<![a-zA-Z0-9\$])(\d*[a-zA-Z])([2-9])(?=[-+=×\u00D7\u2A2F\/\*,\s\)]|$)/g, (m, g1, g2) => '$' + g1 + '^{' + g2 + '}$');

  // Step 3: Merge adjacent math segments separated by operators e.g. $a^2$-$b^2$ -> $a^2 - b^2$
  let merged = true;
  while (merged) {
    const next = s.replace(/\$([^\$]+)\$\s*([-+=×\u00D7\u2A2F\/\*])\s*\$([^\$]+)\$/g, '$$$1 $2 $3$$');
    if (next === s) merged = false;
    else s = next;
  }

  // Step 4: Include attached terms like "$4x^2$-3y+7z" -> "$4x^2 - 3y + 7z$"
  s = s.replace(/\$([^\$]+)\$\s*([-+])\s*(\d*[a-zA-Z][a-zA-Z0-9]*(?:\s*[-+]\s*\d*[a-zA-Z][a-zA-Z0-9]*)*)/g, '$$$1 $2 $3$$');
  s = s.replace(/\$([^\$]+)\$\s*([-+=])\s*(\d*[a-zA-Z][a-zA-Z0-9]*)/g, '$$$1 $2 $3$$');

  // Step 5: Wrap algebraic assignments/equalities like a=7x-5y+7z, b=2x-3z+7y, c=8x+2y-3z, a+b+c=17x+4y+z
  s = s.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d*[a-zA-Z][0-9a-zA-Z\s+\-*\/]+)(?![\$\w])/g, (m, g1) => '$' + g1.trim() + '$');
  s = s.replace(/(?<![\$\w])([a-zA-Z0-9\s+\-*\/]+=[0-9a-zA-Z\s+\-*\/]+)(?![\$\w])/g, (m, g1) => {
    if (/[\u0980-\u09FF]/.test(g1)) return m;
    if (!/[=]/.test(g1) || !/[a-zA-Z]/.test(g1)) return m;
    return '$' + g1.trim() + '$';
  });

  // Step 6: Wrap comma-separated variable assignments e.g. a=2,b=3,c=1 or x=3,y=5,z=2
  s = s.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d+(?:\s*,\s*[a-zA-Z]\s*=\s*\d+)+)(?![\$\w])/g, (m, g1) => '$' + g1.trim() + '$');
  s = s.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d+)(?![\$\w])/g, (m, g1) => '$' + g1.trim() + '$');

  return s;
}

const input = `
২। 4x2-3y+7z, 8x2+5y-3z, y+2z তিনটি বীজগণিতীয় রাশি।
ক. ২য় রাশিতে পদের সংখ্যা কয়টি ও কী কী?
খ. রাশি তিনটির যোগফল কতো?
গ. a=7x-5y+7z, b=2x-3z+7y এবং c=8x+2y-3z হলে দেখাও যে, a+b+c=17x+4y+z
১৩। দৃশ্যকল্প ১: a=2,b=3,c=1
দৃশ্যকল্প ২: x=3,y=5,z=2
ক. a=2 হলে, 2a3×3a2 এর মান নির্ণয় করো।
খ. দৃশ্যকল্প ১ অনুসারে a2-b2+c2 এর মান নির্ণয় করো।
গ. দেখাও যে, (x+y)2=(x-y)2+4xy
`;

const healed = healAlgebraicPowers(input);
console.log("HEALED TEXT:\n" + healed);

console.log("\n--- CONVERTED WORD EQ FIELDS ---");
const segments = EquationConverter.splitTextAndMath(healed);
for (let seg of segments) {
  if (seg.type === 'math') {
    const eq = EquationConverter.latexToEqField(seg.value, true);
    console.log("MATH:", seg.value, "--> WORD EQ:", eq);
  }
}
