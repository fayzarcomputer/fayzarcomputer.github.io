const fs = require('fs');

function processOutsideMath(text, fn) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) parts[i] = fn(parts[i]);
  }
  return parts.join('');
}

function healDocumentText(text) {
  if (!text) return text;
  let s = text;

  // 1. Fix scientific notation variants e.g. "6.023imes1022", "6.023 imes 1023", "6.023\times 1023", "6.023×10^23", "6.023 \times 10^{23}"
  s = processOutsideMath(s, str => {
    return str.replace(/(?<![\$\d])(\d+(?:\.\d+)?)\s*(?:\\*times|imes|[×x*\u00D7\u2A2F])\s*10\s*(?:\^\s*\{?(\d{1,3})\}?|\^?\{?(\d{1,3})\}?)(?!\d)/gi, (m, coeff, exp1, exp2) => {
      let exp = exp1 || exp2;
      return `$${coeff} \\times 10^{${exp}}$`;
    });
  });

  // 1b. Match standalone "10^23" or "10^{23}" or "10^{-3}"
  s = processOutsideMath(s, str => {
    return str.replace(/(?<!(?:\$|\\times\s*|[×*]\s*))\b10\s*\^\s*\{?(-?\d{1,3})\}?(?![\$\w])/g, (m, g1) => `$10^{${g1}}$`);
  });

  // 2. Fix broken space in split formulas: "H_2 O" -> "H_2O", "H_2 SO_4" -> "H_2SO_4", "H2 SO4" -> "H2SO4"
  s = s.replace(/\b([A-Z][a-z]?(?:_\d+|\d+))\s+([A-Z][a-z]?(?:_\d+|\d+)?)\b/g, '$1$2');
  s = s.replace(/\b([A-Z][a-z]?(?:_\d+|\d+)[A-Z][a-z]?(?:_\d+|\d+))\s+([A-Z][a-z]?(?:_\d+|\d+)?)\b/g, '$1$2');

  // 3. Match and wrap chemical reaction equations e.g. "N_2 + 3H_2 = 2NH_3" or "2H_2 + O_2 = 2H_2O" or with arrows
  s = processOutsideMath(s, str => {
    const chemReaction = /(?<![\$a-zA-Z0-9])(\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+(?:\s*[-+]\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)*\s*(?:=|→|->|──>)\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+(?:\s*[-+]\s*\d*(?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)*)(?![\$a-zA-Z0-9])/g;
    return str.replace(chemReaction, (m, eq) => {
      if (!/\d|_/.test(eq)) return m;
      let cleanEq = eq.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
      cleanEq = cleanEq.replace(/_(\d+)(?!\})/g, '_{$1}');
      return `$${cleanEq}$`;
    });
  });

  // 4. Wrap chemical formulas with or without existing underscores outside $...$
  s = processOutsideMath(s, str => {
    const chemUnit = /(?<![\$a-zA-Z0-9])(\d*)((?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)(?![\$a-zA-Z0-9])/g;
    return str.replace(chemUnit, (m, coeff, formula) => {
      if (!/\d|_/.test(formula)) return m;
      if (/^(?:MCQ|CQ|CPU|RAM|LED|DNA|RNA|A4|B5|Q\d+|P\d+|ID|OK|AM|PM|US|UK|BD|HTML|CSS|JS|PDF|DOC|DOCX)$/i.test(m)) return m;
      let cleanFormula = formula.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
      cleanFormula = cleanFormula.replace(/_(\d+)(?!\})/g, '_{$1}');
      return '$' + (coeff || '') + cleanFormula + '$';
    });
  });

  return s;
}

const questions = [
  '১৩। অ্যাভোগাড্রো সংখ্যা কত?\n\tক. 6.023imes1022\tখ. 6.023imes1023\tগ. 6.023imes1024\tঘ. 6.023imes1022',
  '৯। ধাতব বন্ধন কোনটিতে থাকে?\n\tক. NaCl\tখ. Fe\tগ. HCl\tঘ. H_2 O',
  '১০। কোন যৌগটি সমযোজী হয়েও পানিতে বিদ্যুৎ পরিবহন করে?\n\tক. CCl_4\tখ. CH_4\tগ. HCl\tঘ. চিনি',
  '১৫। 44 গ্রাম CO_2 এ কত মোল আছে?',
  '১৬। ১ মোল H_2 SO_4 এর ভর কত?',
  '১৬। ১ মোল H_2SO_4 এর ভর কত?',
  '১৭। N_2 + 3H_2 = 2NH_3 - ১ মোল N_2 থেকে কত মোল NH_3 পাওয়া যায়?',
  '১৮। ১৮ গ্রাম পানিতে কয়টি অণু থাকে?\n\tক. 6.023imes1023 টি\tখ. 3.011imes1023 টি\tগ. 12.046imes1023 টি\tঘ. 6.023imes1022 টি',
  '১৯। CaCO_3 এর আণবিক ভর কত?'
];

for (const q of questions) {
  const healed = healDocumentText(q);
  console.log('\n----------------------------------------');
  console.log('INPUT:', q.split('\n')[0]);
  console.log('HEALED:', healed.split('\n').join(' | '));
}
