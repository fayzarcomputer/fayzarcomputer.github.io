const fs = require('fs');
const window = {
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {}
};
global.window = window;
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};

// Mock JSZip
eval(fs.readFileSync('js/jszip.min.js', 'utf8'));

// Load files
const bc = fs.readFileSync('js/bangla-converter-engine.js', 'utf8');
const eq = fs.readFileSync('js/equation-converter.js', 'utf8');
const dh = fs.readFileSync('js/docx-handler.js', 'utf8');
eval(bc);
eval(eq);
eval(dh);
const DocxHandler = global.DocxHandler || window.DocxHandler;

const testInputs = [
  '১৩। অ্যাভোগাড্রো সংখ্যা কত?\n\tক. 6.023 \\times 10^{23}\tখ. 6.023 \\times 10^{22}\tগ. 6.023 \\times 10^{24}\tঘ. 6.023 \\times 10^{20}',
  '১০। কোন যৌগটি সমযোজী হয়েও পানিতে বিদ্যুৎ পরিবহন করে?\n\tক. CCl_4\tখ. CH_4\tগ. HCl\tঘ. চিনি',
  '১৫। 44 গ্রাম CO_2 এ কত মোল আছে?',
  '১৬। ১ মোল H_2SO_4 এর ভর কত?',
  '১৭। N_2 + 3H_2 = 2NH_3 - ১ মোল N_2 থেকে কত মোল NH_3 পাওয়া যায়?'
];

async function runTests() {
  console.log('=== TEST 1: DocxHandler.createDocFromText ===');
  for (const inp of testInputs) {
    const docBlob = DocxHandler.createDocFromText(inp, 'SutonnyMJ', true);
    const html = await docBlob.text();
    const body = html.slice(html.indexOf('<body'), html.indexOf('</body>') + 7);
    console.log('\n--- INPUT: ---', inp);
    console.log('--- OUTPUT BODY: ---', body);
  }
}

runTests();
