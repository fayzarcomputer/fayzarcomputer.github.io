const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));

function healScientificAndChemical(text) {
  if (!text) return text;
  let s = text;

  // 1. Heals broken scientific notation e.g. "6.023imes1022", "6.023 imes 1023", "6.023\times 1023", "6.023×10^23"
  // Match: (number) [optional \times, times, imes, ×, *, x] 10 [optional ^] (exponent 1-3 digits or {1-3 digits})
  s = s.replace(/(?<!\$)\b(\d+(?:\.\d+)?)\s*(?:\\*times|imes|[×x*\u00D7\u2A2F])\s*10\s*(?:\^\s*\{?(\d{1,3})\}?|(?:\^|\s*\{)?(1[0-9]|2[0-9]|3[0-9]|\d{1,2})\b\}?)(?!\$)/gi, (m, coeff, exp1, exp2) => {
    const exp = exp1 || exp2;
    return `$${coeff} \\times 10^{${exp}}$`;
  });
  // If there was no multiplication sign but wrote "6.023 10^23" or "6.023 1023"
  s = s.replace(/(?<!\$)\b(\d+(?:\.\d+)?)\s+10\s*(?:\^\s*\{?(\d{1,3})\}?|(?:1[0-9]|2[0-9]|3[0-9]))\b(?!\$)/g, (m, coeff, exp1) => {
    let exp = exp1;
    if (!exp) {
      const match10 = m.match(/10(1[0-9]|2[0-9]|3[0-9])/);
      if (match10) exp = match10[1];
    }
    return exp ? `$${coeff} \\times 10^{${exp}}$` : m;
  });

  // 1b. Match standalone "10^23" or "10^{23}" or "10^{-3}"
  s = s.replace(/(?<![\$\w\\])\b10\s*\^\s*\{?(-?\d{1,3})\}?(?![\$\w])/g, '$$10^{$1}$$');

  // 2. Fix broken space in split formulas: "H_2 O" -> "H_2O", "H_2 SO_4" -> "H_2SO_4", "H2 SO4" -> "H2SO4"
  s = s.replace(/\b([A-Z][a-z]?(?:_\d+|\d+))\s+([A-Z][a-z]?(?:_\d+|\d+)?)\b/g, '$1$2');
  s = s.replace(/\b([A-Z][a-z]?(?:_\d+|\d+)[A-Z][a-z]?(?:_\d+|\d+))\s+([A-Z][a-z]?(?:_\d+|\d+)?)\b/g, '$1$2');

  // 3. Match and wrap chemical reaction equations e.g. "N_2 + 3H_2 = 2NH_3" or "2H_2 + O_2 = 2H_2O" or with arrows
  s = s.replace(/(?<!\$)\b(\d*[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?(?:\s*[-+]\s*\d*[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)*\s*(=|→|->|──>)\s*\d*[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?(?:\s*[-+]\s*\d*[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)*)(?!\$)/g, (m, eq) => {
    // Standardize subscripts
    let cleanEq = eq.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
    cleanEq = cleanEq.replace(/_(\d+)/g, '_{$1}');
    return `$${cleanEq}$`;
  });

  // 4. Wrap chemical formulas with or without existing underscores outside $...$
  // Atoms: [A-Z][a-z]?(?:_\{?\d+\}?|\d+)?
  const atomPattern = '[A-Z][a-z]?(?:_\\{?\\d+\\}?|\\d+)?';
  const chemRegex = new RegExp(`(?<![\\$a-zA-Z0-9])(\\d*)((?:${atomPattern}){1,6})(?![\\$a-zA-Z0-9])`, 'g');
  s = s.replace(chemRegex, (m, coeff, formula) => {
    // Must contain at least one digit or underscore to be a formula (e.g. CO_2, H2O, CCl_4, CaCO_3, N_2, O2)
    if (!/\d|_/.test(formula)) return m;
    if (/^(?:MCQ|CQ|CPU|RAM|LED|DNA|RNA|A4|B5|Q\d+|P\d+|ID|OK|AM|PM|US|UK|BD|HTML|CSS|JS|PDF|DOC|DOCX)$/i.test(m)) return m;
    let cleanFormula = formula.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
    cleanFormula = cleanFormula.replace(/_(\d+)(?!\})/g, '_{$1}');
    return '$' + (coeff || '') + cleanFormula + '$';
  });

  return s;
}

const samples = [
  'ক. 6.023imes1022  খ. 6.023imes1023  গ. 6.023imes1024  ঘ. 6.023imes1022',
  'ক. 6.023 \\times 10^{23}',
  'ক. 6.023 \\times 1023',
  'ক. 6.023×1023 টি  খ. 3.011imes1023 টি',
  'ঘ. H_2 O',
  'ক. CCl_4  খ. CH_4  গ. HCl  ঘ. চিনি',
  '১৫। 44 গ্রাম CO_2 এ কত মোল আছে?',
  '১৬। ১ মোল H_2 SO_4 এর ভর কত?',
  '১৬। ১ মোল H_2SO_4 এর ভর কত?',
  '১৭। N_2 + 3H_2 = 2NH_3 - ১ মোল N_2 থেকে কত মোল NH_3 পাওয়া যায়?',
  '১৯। CaCO_3 এর আণবিক ভর কত?'
];

console.log('=== TEST HEALING FUNCTION 2 ===');
for (const samp of samples) {
  const healed = healScientificAndChemical(samp);
  console.log('\nINPUT: ', samp);
  console.log('HEALED:', healed);
}
