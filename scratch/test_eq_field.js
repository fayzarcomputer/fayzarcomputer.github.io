const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));

const mathList = [
  '$6.023 \\times 10^{23}$',
  '$6.023 \\times 10^{22}$',
  '$3.011 \\times 10^{23}$',
  '$CaCO_3$',
  '$O_2$',
  '$H_2$',
  '$Na_2CO_3$',
  '$2H_2 + O_2 = 2H_2O$',
  '$CH_2O$',
  '$C_2H_4O$',
  '$C_2H_4O_2$',
  '$\\frac{mol}{L}$',
  '$\\frac{g}{L}$',
  '$N_2 + 3H_2 = 2NH_3$'
];

for (const rawMath of mathList) {
  let cleanContent = rawMath.replace(/^\$\$|\$\$$|^\$|\$$|^\\\[|\\\]$|^\\\(|\\\)$/g, '').trim();
  let eqCode = EquationConverter.latexToEqField(cleanContent, true);
  let cleanEq = (eqCode || '').trim();
  let cleanEqCode = cleanEq.startsWith('EQ ') ? cleanEq.slice(3).trim() : cleanEq;
  let formattedEq = EquationConverter.formatEqCodeToWordHtml(cleanEqCode, 12, true);
  console.log('LATEX:', rawMath);
  console.log('EQ FIELD:', formattedEq);
  console.log('');
}
