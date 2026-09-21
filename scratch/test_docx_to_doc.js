const fs = require('fs');

global.window = global;
require('../js/bangla-converter-engine.js');
require('../js/equation-converter.js');
require('../js/docx-handler.js');
require('../js/docx-to-doc-engine.js');

const converter = new DocxToDocConverter();
// Let's test _parseRun with mock run node
const { DOMParser } = require('@xmldom/xmldom');
global.DOMParser = DOMParser;
converter.domParser = new DOMParser();

const xmlDoc = new DOMParser().parseFromString(`
<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:r>
    <w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr>
    <w:t xml:space="preserve">(যেমন: বিতর্ক, বিজ্ঞান মেলা, চিত্রাঙ্কন) </w:t>
  </w:r>
  <w:r>
    <w:rPr><w:rFonts w:ascii="SutonnyMJ"/></w:rPr>
    <w:t>ব্যবস্থা</w:t>
  </w:r>
</w:p>
`, 'application/xml');

const pNode = xmlDoc.getElementsByTagName('w:p')[0];
const rNodes = pNode.getElementsByTagName('w:r');
const styleResolver = { docDefaults: { fontSizePt: 12, color: '000000' }, resolve: () => null };

for (let r of Array.from(rNodes)) {
  const parsed = converter._parseRun(r, null, styleResolver, {}, { direction: 'all_bijoy' });
  console.log("Parsed run HTML:", parsed.html);
}
