const testText = `
২। 4x2-3y+7z, 8x2+5y-3z, y+2z তিনটি বীজগণিতীয় রাশি।
ক. ২য় রাশিতে পদের সংখ্যা কয়টি ও কী কী?
খ. রাশি তিনটির যোগফল কতো?
গ. a=7x-5y+7z, b=2x-3z+7y এবং c=8x+2y-3z হলে দেখাও যে, a+b+c=17x+4y+z
১৩। দৃশ্যকল্প ১: a=2,b=3,c=1
দৃশ্যকল্প ২: x=3,y=5,z=2
ক. a=2 হলে, 2a3×3a2 এর মান নির্ণয় করো।
খ. দৃশ্যকল্প ১ অনুসারে a2-b2+c2 এর মান নির্ণয় করো।
গ. দেখাও যে, (x+y)2=(x-y)2+4xy
`;

function autoHealAlgebra(str) {
  // 1. Parenthesized expressions followed by a power e.g. (x+y)2 -> $(x+y)^2$, (x-y)2 -> $(x-y)^2$
  str = str.replace(/(\([a-zA-Z0-9\s_+\-*\/=]+\))\s*([2-9]|\d{2,})(?![\$\w])/g, '$$$1^{$2}$$');

  // 2. Variable or coefficient+variable followed by power before operators or boundary
  // e.g. 4x2 -> $4x^2$, 8x2 -> $8x^2$, 2a3 -> $2a^3$, 3a2 -> $3a^2$, a2 -> $a^2$, b2 -> $b^2$, c2 -> $c^2$
  str = str.replace(/(?<![a-zA-Z0-9\$])(\d*[a-zA-Z])([2-9])(?=[-+=×\u00D7\u2A2F\/\*,\s\)]|$)/g, '$$$1^{$2}$$');

  // 3. Clean up any accidental adjacent $$ e.g. "$a^2$-$b^2$+$c^2$"
  return str;
}

const healed = autoHealAlgebra(testText);
console.log("HEALED OUTPUT:\n" + healed);

// Now test with DocxHandler EQ field generation
const EquationConverter = require('../js/equation-converter.js');
console.log("\n--- CONVERTING TO WORD EQ FIELD ---");
const segments = EquationConverter.splitTextAndMath(healed);
for (let s of segments) {
  if (s.type === 'math') {
    const eq = EquationConverter.latexToEqField(s.value, true);
    console.log("MATH:", s.value, "--> EQ FIELD:", eq);
  }
}
