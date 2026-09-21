const fs = require('fs');
require('../js/jszip.min.js');
const JSZip = global.JSZip;

// Mock DOMParser / XMLSerializer / window
const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.JSZip = JSZip;
global.Blob = dom.window.Blob || class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
    this.size = parts.reduce((acc, p) => acc + (typeof p === 'string' ? Buffer.byteLength(p) : p.length || p.byteLength || 0), 0);
  }
  async arrayBuffer() {
    let bufs = this.parts.map(p => typeof p === 'string' ? Buffer.from(p) : Buffer.from(p));
    return Buffer.concat(bufs);
  }
};

require('../js/bangla-converter-engine.js');
require('../js/equation-converter.js');
require('../js/docx-handler.js');
require('../js/docx-to-doc-engine.js');

async function run() {
  // Let's create a real minimal DOCX with JSZip containing the sample text
  const paragraphs = [
    "দ্বিতীয় অধ্যায়: লক্ষ্য, উদ্দেশ্য ও রূপকল্প (Vision & Mission)",
    "",
    "ধারা ৪: মূল উদ্দেশ্যসমূহ",
    "৪.১. শিবনগর ইউনিয়নসহ ফুলবাড়ী উপজেলার শিশুদের জন্য আধুনিক, যুগোপযোগী এবং মানসম্মত প্রাথমিক শিক্ষা নিশ্চিত করা।",
    "৪.২. শিক্ষার্থীদের নৈতিকতা, শিষ্টাচার, দেশপ্রেম এবং মুক্তিযুদ্ধের চেতনায় উদ্বুদ্ধ করে সুনাগরিক হিসেবে গড়ে তোলা।",
    "৪.৩. মুখস্থ বিদ্যার পরিবর্তে সৃজনশীল মেধা বিকাশ এবং একটি ভয়হীন, আনন্দদায়ক পরিবেশে শিক্ষাদান করা।",
    "৪.৪. শিক্ষার্থীদের শারীরিক ও মানসিক বিকাশের জন্য নিয়মিত খেলাধুলা, শিল্প-সংস্কৃতি এবং সহশিক্ষামূলক কার্যক্রমের (যেমন: বিতর্ক, বিজ্ঞান মেলা, চিত্রাঙ্কন) ব্যবস্থা করা।",
    "৪.৫. সমাজের পিছিয়ে পড়া, সুবিধাবঞ্চিত ও বিশেষ চাহিদাসম্পন্ন শিশুদের জন্য শিক্ষার সমান সুযোগ সৃষ্টি করা।",
    "",
    "তৃতীয় অধ্যায়: অবকাঠামো, পরিবেশ ও সুবিধা",
    "",
    "ধারা ৫: জমি ও ভবন",
    "৫.১. সরকারি বিধি মোতাবেক ইউনিয়ন পর্যায়ের জন্য নির্ধারিত আয়তনের নিজস্ব বা ভাড়াকৃত জমিতে বিদ্যালয়ের নিরাপদ ভবন থাকবে।",
    "৫.২. শ্রেণিকক্ষগুলোতে পর্যাপ্ত আলো-বাতাস চলাচলের ব্যবস্থা এবং প্রতিটি শিশুর জন্য বয়স ও উচ্চতা অনুযায়ী স্বাচ্ছন্দ্যদায়ক বসার ব্যবস্থা (বেঞ্চ/টেবিল) থাকবে。"
  ];

  let pXml = paragraphs.map(pText => {
    return `<w:p><w:r><w:rPr><w:rFonts w:ascii="Kalpurush" w:hAnsi="Kalpurush" w:cs="Kalpurush"/></w:rPr><w:t xml:space="preserve">${pText}</w:t></w:r></w:p>`;
  }).join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXml}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("word/document.xml", documentXml);
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`);

  const docxBuffer = await zip.generateAsync({ type: 'arraybuffer' });

  console.log("--- 1. Testing DocxHandler.convertDocx ---");
  const handler = new DocxHandler({ direction: 'all_bijoy' });
  const converted = await handler.convertDocx(docxBuffer, { direction: 'all_bijoy' });
  console.log("convertDocx finished.");

  // Check what's inside word/document.xml of converted
  const cZip = await JSZip.loadAsync(converted.blob || converted.convertedBlob);
  const cDocXml = await cZip.file("word/document.xml").async("string");
  fs.writeFileSync('./scratch/converted_document.xml', cDocXml);
  console.log("Saved converted_document.xml (length: " + cDocXml.length + ")");

  console.log("\n--- 2. Testing DocxToDocConverter.convertDocxToDoc ---");
  const docxToDoc = new DocxToDocConverter();
  const docResult = await docxToDoc.convertDocxToDoc(converted.blob || converted.convertedBlob, { direction: 'all_bijoy' });
  
  const docHtml = docResult.blob.parts ? docResult.blob.parts.join('') : 'no parts';
  fs.writeFileSync('./scratch/output.doc', docHtml);
  console.log("Saved output.doc (length: " + docHtml.length + ")");
}

run().catch(console.error);
