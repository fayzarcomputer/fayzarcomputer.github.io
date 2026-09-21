const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));

let str = '\tক. 6.023 \\times $10^{23}$\tখ. 6.023 \\times $10^{22}';
console.log('Original str:', str);
console.log('hasMath:', /\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/.test(str));
let segs = EquationConverter.splitTextAndMath(str);
console.log('segments:', JSON.stringify(segs, null, 2));

// Test what EquationConverter does with scientific powers
console.log('\n--- Testing split on full LaTeX:');
let str2 = '\tক. $6.023 \\times 10^{23}$\tখ. $6.023 \\times 10^{22}$';
console.log('str2 hasMath:', /\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/.test(str2));
console.log('str2 segments:', JSON.stringify(EquationConverter.splitTextAndMath(str2), null, 2));
