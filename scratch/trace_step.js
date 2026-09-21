const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));

function processOutsideMath(text, fn) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) parts[i] = fn(parts[i]);
  }
  return parts.join('');
}

let text = '\tক. $6.023 \\times 10^{23}$ টি\tখ. $3.011 \\times 10^{23}$ টি';

let s = text.replace(/\*\*/g, '').replace(/\r/g, '');

// Clean replacement outside math:
s = processOutsideMath(s, str => {
  return str.replace(/(?<![\$\d])(\d+(?:\.\d+)?)\s*(?:\\*times|imes|[×x*\u00D7\u2A2F])\s*10\s*(?:\^\s*\{?(\d{1,3})\}?|\^?\{?(\d{1,3})\}?)(?!\d)/gi, (m, coeff, exp1, exp2) => {
    let exp = exp1 || exp2;
    return `$${coeff} \\times 10^{${exp}}$`;
  });
});
console.log('After clean 1b:', s);

let formattedLine = DocxHandler.formatQuestionPaperLine(s, true);
console.log('formattedLine:', formattedLine);

let segs = EquationConverter.splitTextAndMath(formattedLine);
console.log('segs:', segs);
