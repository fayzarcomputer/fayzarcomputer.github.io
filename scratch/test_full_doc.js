const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));

const EquationConverter = global.EquationConverter;
const DocxHandler = global.DocxHandler;

// Update EquationConverter.needsEqField to include ^, _, and \times
EquationConverter.needsEqField = function(latex) {
  if (!latex) return false;
  let s = latex.trim();
  if (s.startsWith('$$') && s.endsWith('$$')) s = s.slice(2, -2).trim();
  else if (s.startsWith('$') && s.endsWith('$')) s = s.slice(1, -1).trim();
  else if (s.startsWith('\\[') && s.endsWith('\\]')) s = s.slice(2, -2).trim();
  else if (s.startsWith('\\(') && s.endsWith('\\)')) s = s.slice(2, -2).trim();

  if (/^[\d\s,.\u09E6-\u09EF\-]+$/.test(s)) return false;
  if (/^[\d\s,.\u09E6-\u09EF]+[a-zA-Z\u0980-\u09FF\s.]+$/.test(s)) return false;
  if (/^(?:cm|mm|m|km|gm|kg|sec|s|hr|min|V|W|kW|A|mA|Hz|N|Pa|J)$/i.test(s)) return false;

  return /\\frac|\\dfrac|\\tfrac|\\sqrt|\\int|\\sum|\\prod|\\lim|\\matrix|\\binom|\\overline|\\underline|\\vec|\\dot|\\ddot|\\partial|\^|_|\\times/.test(s);
};

const sampleText = `
১৮ । ১৮ গ্রাম পানিতে কতটি অণু থাকে?
   ক. 6.023 × 10²³ টি   খ. 3.011 × 10²³ টি   গ. 12.046 × 10²³ টি   ঘ. 6.023 × 10²² টি
১৯ । CaCO₃ এর আণবিক ভর কত?
   ক. ১০০ খ. ৮০  গ. ৫০  ঘ. ১২০
২০ । ১১.২ লিটার O₂ গ্যাস STP তে কত গ্রাম?
   ক. ৮ g  খ. ১৬ g  গ. ৩২ g  ঘ. ৬৪ g
২১ । লিমিটিং বিক্রিয়ক কী?
২২ । মোলারিটি প্রকাশ করা হয় কোন এককে?
   ক. mol/L  খ. g/L  গ. L/mol  ঘ. g/mol
২৩ । ১০০ mL ০.৫ M Na₂co₃ দ্রবণে কত গ্রাম Na₂co₃ আছে?
   ক. ৫.৩ g  খ. ১০.৬ g  গ. ৫৩ g  ঘ. ১০৬ g
২৪ । ৪ গ্রাম H₂ এর সাথে বিক্রিয়ার জন্য কত গ্রাম O₂ লাগবে? (2H₂ + O₂ = 2H₂O)
   ক. ১৬g  খ. ৩২g  গ. ৮g  ঘ. ৬৪g
২৫ । ৪০% C, ৬.৬৭% H, ৫৩.৩৩% O যুক্ত যৌগের স্থূল সংকেত কী?
   ক. CH₂O  খ. C₂H₄O  গ. C₂H₄O₂  ঘ. CHO
`;

// Test healing
const supChars = '[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]';
const subChars = '[₀₁₂₃₄₅₆₇₈₉₊₋]';
const supMap = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
const subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-'};

let s = sampleText;
s = s.replace(new RegExp('(' + supChars + '+)', 'g'), (m, g) => {
  let digits = g.split('').map(c => supMap[c] || c).join('');
  return '^{' + digits + '}';
});
s = s.replace(new RegExp('(' + subChars + '+)', 'g'), (m, g) => {
  let digits = g.split('').map(c => subMap[c] || c).join('');
  return '_{' + digits + '}';
});

s = s.replace(/\b([A-Z][a-z]?)_\{?(\d+)\}?co_\{?(\d+)\}?/g, '$1_{$2}CO_{$3}');
s = s.replace(/([A-Z][a-z]?)_\{?(\d+)\}?co([0-9])/g, '$1_{$2}CO$3');
s = s.replace(/\b([a-z]{1,2})_\{?(\d+)\}?/g, (m, el, sub) => el.toUpperCase() + '_{' + sub + '}');

s = DocxHandler.processOutsideMath(s, str => {
  return str.replace(/(?<![\$\d])(\d+(?:\.\d+)?)\s*(?:\\*times|imes|[×x*\u00D7\u2A2F])\s*10\s*\^?\s*\{?(\d{1,3})\}?(?!\d)/gi, (m, coeff, exp) => {
    return '$' + coeff + ' \\times 10^{' + exp + '}$';
  });
});

s = DocxHandler.processOutsideMath(s, str => {
  return str.replace(/(?<!(?:\$|\\times\s*|[×*]\s*))\b10\s*\^\s*\{?(-?\d{1,3})\}?(?![\$\w])/g, '$10^{$1}$');
});

s = DocxHandler.processOutsideMath(s, str => {
  return str.replace(/\b(mol\/L|g\/L|L\/mol|g\/mol|km\/h|m\/s|m\/s\^2)\b/gi, (m) => {
    let parts = m.split('/');
    return '$\\frac{' + parts[0] + '}{' + parts[1] + '}$';
  });
});

s = DocxHandler.processOutsideMath(s, str => {
  const chemReaction = /(\(?\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+(?:\s*[-+]\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)*\s*(?:=|→|->|──>)\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+(?:\s*[-+]\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)*\)?)/g;
  return str.replace(chemReaction, (m) => {
    if (!/_{|\d/.test(m)) return m;
    let hasParen = m.startsWith('(') && m.endsWith(')');
    let clean = hasParen ? m.slice(1, -1) : m;
    clean = clean.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
    clean = clean.replace(/_(\d+)(?!\})/g, '_{$1}');
    return hasParen ? '($' + clean + '$)' : '$' + clean + '$';
  });
});

s = DocxHandler.processOutsideMath(s, str => {
  const chemUnit = /(?<![\$a-zA-Z0-9])(\d*)((?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)(?![\$a-zA-Z0-9])/g;
  return str.replace(chemUnit, (m, coeff, formula) => {
    if (!/_{|\d/.test(formula)) return m;
    if (/^(?:MCQ|CQ|CPU|RAM|LED|DNA|RNA|A4|B5|Q\d+|P\d+|ID|OK|AM|PM|US|UK|BD|HTML|CSS|JS|PDF|DOC|DOCX)$/i.test(m)) return m;
    let cleanFormula = formula.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
    cleanFormula = cleanFormula.replace(/_(\d+)(?!\})/g, '_{$1}');
    return '$' + (coeff || '') + cleanFormula + '$';
  });
});

console.log('=== HEALED ===');
console.log(s);

// Check DocxHandler.createDocFromText
const docBlob = DocxHandler.createDocFromText(s, 'SutonnyMJ', true);
console.log('=== DOC BLOB GENERATED SUCCESS ===, size:', docBlob.size);

// Read back the string from Blob
docBlob.text().then(html => {
  const eqCount = (html.match(/EQ\s+/g) || []).length;
  console.log('Total EQ fields in Word 2003 DOC:', eqCount);
  const eqMatches = html.match(/EQ\s+[^<]+/g);
  console.log('Sample EQ fields in output:', eqMatches?.slice(0, 8));
});
