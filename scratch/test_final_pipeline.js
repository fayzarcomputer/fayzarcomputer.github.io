const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));

const EquationConverter = global.EquationConverter;
const DocxHandler = global.DocxHandler;

const sample = `
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

const docBlob = DocxHandler.createDocFromText(sample, 'SutonnyMJ', true);
docBlob.text().then(html => {
  const eqCount = (html.match(/EQ\s+/g) || []).length;
  console.log('SUCCESS: Total Word 2003 EQ fields generated:', eqCount);
  const eqMatches = html.match(/EQ\s+[^<]+/g);
  console.log('EQ matches sample:', eqMatches?.slice(0, 10));
});
