const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
console.log('Unicode to Bijoy of "-":', JSON.stringify(BanglaConverter.unicodeToBijoy('-')));
console.log('Unicode to Bijoy of "নবী-রাসুলদের":', JSON.stringify(BanglaConverter.unicodeToBijoy('নবী-রাসুলদের')));
console.log('Unicode to Bijoy of "ভিত্তি ছিল-":', JSON.stringify(BanglaConverter.unicodeToBijoy('ভিত্তি ছিল-')));
console.log('Unicode to Bijoy of "ভিত্তি ছিল—":', JSON.stringify(BanglaConverter.unicodeToBijoy('ভিত্তি ছিল—')));
console.log('Unicode to Bijoy of "কোনটি সঠিক-":', JSON.stringify(BanglaConverter.unicodeToBijoy('কোনটি সঠিক-')));
console.log('Unicode to Bijoy of "কোনটি সঠিক—":', JSON.stringify(BanglaConverter.unicodeToBijoy('কোনটি সঠিক—')));

console.log('Bijoy to Unicode of "-":', JSON.stringify(BanglaConverter.bijoyToUnicode('-')));
console.log('Bijoy to Unicode of "wfQj-":', JSON.stringify(BanglaConverter.bijoyToUnicode(BanglaConverter.unicodeToBijoy('ভিত্তি ছিল-'))));
console.log('Bijoy to Unicode of "wfQj—":', JSON.stringify(BanglaConverter.bijoyToUnicode(BanglaConverter.unicodeToBijoy('ভিত্তি ছিল—'))));
