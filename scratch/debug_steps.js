const fs = require('fs');
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));
const dh = global.DocxHandler || window.DocxHandler;

let s = '\tক. $6.023 \\times 10^{23}$';
console.log('Original:', s);

// Step 1:
let s1 = s.replace(/(\([a-zA-Z0-9\s_+\-*\/=]+\))\s*([2-9]|\d{2,})(?![\$\w])/g, (m, g1, g2) => '$(' + g1.slice(1, -1) + ')^{' + g2 + '}$');
console.log('Step 1:', s1);

// Step 2:
let s2 = s1.replace(/(?<![a-zA-Z0-9\$])(\d*[a-zA-Z])([2-9])(?=[-+=×\u00D7\u2A2F\/\*,\s\)]|$)/g, (m, g1, g2) => '$' + g1 + '^{' + g2 + '}$');
console.log('Step 2:', s2);

// Step 3:
let s3 = s2;
let merged = true;
while (merged) {
  const next = s3.replace(/\$([^\$]+)\$\s*([-+=×\u00D7\u2A2F\/\*])\s*\$([^\$]+)\$/g, '$$$1 $2 $3$$');
  if (next === s3) merged = false;
  else s3 = next;
}
console.log('Step 3:', s3);

// Step 4:
let s4 = s3.replace(/\$([^\$]+)\$\s*([-+])\s*(\d*[a-zA-Z][a-zA-Z0-9]*(?:\s*[-+]\s*\d*[a-zA-Z][a-zA-Z0-9]*)*)/g, '$$$1 $2 $3$$');
console.log('Step 4:', s4);

// Step 5:
let s5 = s4.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d*[a-zA-Z][0-9a-zA-Z\s+\-*\/]+)(?![\$\w])/g, (m, g1) => ' $' + g1.trim() + '$ ');
console.log('Step 5a:', s5);

let s5b = s5.replace(/(?<![\$\w])([a-zA-Z0-9\s+\-*\/]+=[0-9a-zA-Z\s+\-*\/]+)(?![\$\w])/g, (m, g1) => {
  if (/[\u0980-\u09FF]/.test(g1)) return m;
  if (!/[=]/.test(g1) || !/[a-zA-Z]/.test(g1)) return m;
  return ' $' + g1.trim() + '$ ';
});
console.log('Step 5b:', s5b);

// Step 6:
let s6 = s5b.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d+(?:\s*,\s*[a-zA-Z]\s*=\s*\d+)+)(?![\$\w])/g, (m, g1) => ' $' + g1.trim() + '$ ');
let s6b = s6.replace(/(?<![\$\w])([a-zA-Z]\s*=\s*\d+)(?![\$\w])/g, (m, g1) => ' $' + g1.trim() + '$ ');
console.log('Step 6:', s6b);

console.log('\nDirect dh.healAlgebraicPowers:', dh.healAlgebraicPowers(s));
