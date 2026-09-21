const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));
const EquationConverter = global.EquationConverter;
const DocxHandler = global.DocxHandler;

const text = `
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

function processOutsideMath(text, fn) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) parts[i] = fn(parts[i]);
  }
  return parts.join('');
}

function healAll(input) {
  let s = input;

  // 1. Convert Unicode superscripts & subscripts to standard ASCII LaTeX format
  const supChars = '[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]';
  const subChars = '[₀₁₂₃₄₅₆₇₈₉₊₋]';
  const supMap = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
  const subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-'};

  // Convert sequences of unicode superscripts: e.g. 10²³ -> 10^{23}
  s = s.replace(new RegExp('(' + supChars + '+)', 'g'), (m, g) => {
    let digits = g.split('').map(c => supMap[c] || c).join('');
    return '^{' + digits + '}';
  });

  // Convert sequences of unicode subscripts: e.g. CaCO₃ -> CaCO_{3}, Na₂co₃ -> Na_{2}co_{3}
  s = s.replace(new RegExp('(' + subChars + '+)', 'g'), (m, g) => {
    let digits = g.split('').map(c => subMap[c] || c).join('');
    return '_{' + digits + '}';
  });

  // Fix lowercase typos in common formulas like Na_{2}co_{3} -> Na_{2}CO_{3}
  s = s.replace(/\b([A-Z][a-z]?)_\{?(\d+)\}?co_\{?(\d+)\}?/g, '$1_{$2}CO_{$3}');
  s = s.replace(/([A-Z][a-z]?)_\{?(\d+)\}?co([0-9])/g, '$1_{$2}CO$3');
  s = s.replace(/\b([a-z]{1,2})_\{?(\d+)\}?/g, (m, el, sub) => el.toUpperCase() + '_{' + sub + '}');

  // 2. Scientific notation outside math: 6.023 × 10^{23} or 6.023imes1023 -> $6.023 \times 10^{23}$
  s = processOutsideMath(s, str => {
    return str.replace(/(?<![\$\d])(\d+(?:\.\d+)?)\s*(?:\\*times|imes|[×x*\u00D7\u2A2F])\s*10\s*\^?\s*\{?(\d{1,3})\}?(?!\d)/gi, (m, coeff, exp) => {
      return '$' + coeff + ' \\times 10^{' + exp + '}$';
    });
  });

  // Standalone 10^{23}
  s = processOutsideMath(s, str => {
    return str.replace(/(?<!(?:\$|\\times\s*|[×*]\s*))\b10\s*\^\s*\{?(-?\d{1,3})\}?(?![\$\w])/g, '$10^{$1}$');
  });

  // 3. Slash units: mol/L, g/L, L/mol, g/mol -> $\frac{mol}{L}$, etc.
  s = processOutsideMath(s, str => {
    return str.replace(/\b(mol\/L|g\/L|L\/mol|g\/mol|km\/h|m\/s|m\/s\^2)\b/gi, (m) => {
      let parts = m.split('/');
      return '$\\frac{' + parts[0] + '}{' + parts[1] + '}$';
    });
  });

  // 4. Chemical equations in parentheses or standalone: e.g. (2H_{2} + O_{2} = 2H_{2}O)
  s = processOutsideMath(s, str => {
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

  // 5. Individual chemical formulas outside math: CaCO_{3}, O_{2}, H_{2}, Na_{2}CO_{3}, CH_{2}O, C_{2}H_{4}O, C_{2}H_{4}O_{2}
  s = processOutsideMath(s, str => {
    const chemUnit = /(?<![\$a-zA-Z0-9])(\d*)((?:[A-Z][a-z]?(?:_\{?\d+\}?|\d+)?)+)(?![\$a-zA-Z0-9])/g;
    return str.replace(chemUnit, (m, coeff, formula) => {
      if (!/_{|\d/.test(formula)) return m;
      if (/^(?:MCQ|CQ|CPU|RAM|LED|DNA|RNA|A4|B5|Q\d+|P\d+|ID|OK|AM|PM|US|UK|BD|HTML|CSS|JS|PDF|DOC|DOCX)$/i.test(m)) return m;
      let cleanFormula = formula.replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}');
      cleanFormula = cleanFormula.replace(/_(\d+)(?!\})/g, '_{$1}');
      return '$' + (coeff || '') + cleanFormula + '$';
    });
  });

  return s;
}

const healed = healAll(text);
console.log('--- HEALED TEXT ---');
console.log(healed);

console.log('--- SPLIT AND CONVERTED TO WORD EQ FIELDS ---');
const segs = EquationConverter.splitTextAndMath(healed);
for (const seg of segs) {
  if (seg.type === 'math') {
    const eq = EquationConverter.latexToEqField(seg.value, true);
    console.log(`[MATH] ${seg.value}  ===>  EQ ${eq}`);
  }
}
