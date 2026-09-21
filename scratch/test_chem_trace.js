const fs = require('fs');
eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf8'));
eval(fs.readFileSync('js/equation-converter.js', 'utf8'));
eval(fs.readFileSync('js/docx-handler.js', 'utf8'));
const DocxHandler = global.DocxHandler;

const tests = [
  'ক. 6.023 \\times 10^{22}',
  'ক. 6.023 \\times 10^{23}',
  'ক. 6.023 \\times 1023',
  'ক. CCl_4  খ. CH_4  গ. HCl  ঘ. চিনি',
  '১৫। 44 গ্রাম CO_2 এ কত মোল আছে?',
  '১৬। ১ মোল H_2 SO_4 এর ভর কত?',
  '১৬। ১ মোল H_2SO_4 এর ভর কত?',
  '১৭। N_2 + 3H_2 = 2NH_3 - ১ মোল N_2 থেকে কত মোল NH_3 পাওয়া যায়?',
  'ঘ. H_2 O'
];

async function run() {
  for (const t of tests) {
    const blob = DocxHandler.createDocFromText(t, 'SutonnyMJ', true);
    const html = await blob.text();
    const body = html.slice(html.indexOf('<body'), html.indexOf('</body>') + 7);
    console.log('\n--- INPUT:', t);
    console.log('OUTPUT:', body.replace(/[\r\n]+/g, ' '));
  }
}

run();
