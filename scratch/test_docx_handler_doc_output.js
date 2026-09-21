const fs = require('fs');

global.window = global;
global.Blob = class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
  }
};

require('../js/bangla-converter-engine.js');
require('../js/equation-converter.js');
require('../js/docx-handler.js');

const sampleText = `দ্বিতীয় অধ্যায়: লক্ষ্য, উদ্দেশ্য ও রূপকল্প (Vision & Mission)

ধারা ৪: মূল উদ্দেশ্যসমূহ
৪.১. শিবনগর ইউনিয়নসহ ফুলবাড়ী উপজেলার শিশুদের জন্য আধুনিক, যুগোপযোগী এবং মানসম্মত প্রাথমিক শিক্ষা নিশ্চিত করা।
৪.২. শিক্ষার্থীদের নৈতিকতা, শিষ্টাচার, দেশপ্রেম এবং মুক্তিযুদ্ধের চেতনায় উদ্বুদ্ধ করে সুনাগরিক হিসেবে গড়ে তোলা।
৪.৩. মুখস্থ বিদ্যার পরিবর্তে সৃজনশীল মেধা বিকাশ এবং একটি ভয়হীন, আনন্দদায়ক পরিবেশে শিক্ষাদান করা।
৪.৪. শিক্ষার্থীদের শারীরিক ও মানসিক বিকাশের জন্য নিয়মিত খেলাধুলা, শিল্প-সংস্কৃতি এবং সহশিক্ষামূলক কার্যক্রমের (যেমন: বিতর্ক, বিজ্ঞান মেলা, চিত্রাঙ্কন) ব্যবস্থা করা।
৪.৫. সমাজের পিছিয়ে পড়া, সুবিধাবঞ্চিত ও বিশেষ চাহিদাসম্পন্ন শিশুদের জন্য শিক্ষার সমান সুযোগ সৃষ্টি করা।

তৃতীয় অধ্যায়: অবকাঠামো, পরিবেশ ও সুবিধা

ধারা ৫: জমি ও ভবন
৫.১. সরকারি বিধি মোতাবেক ইউনিয়ন পর্যায়ের জন্য নির্ধারিত আয়তনের নিজস্ব বা ভাড়াকৃত জমিতে বিদ্যালয়ের নিরাপদ ভবন থাকবে।
৫.২. শ্রেণিকক্ষগুলোতে পর্যাপ্ত আলো-বাতাস চলাচলের ব্যবস্থা এবং প্রতিটি শিশুর জন্য বয়স ও উচ্চতা অনুযায়ী স্বাচ্ছন্দ্যদায়ক বসার ব্যবস্থা (বেঞ্চ/টেবিল) থাকবে।`;

// Generate Word 2003 HTML via DocxHandler
const docBlob = DocxHandler.createDocFromText(sampleText, 'SutonnyMJ', true, 12, { direction: 'all_bijoy' });
const docHtml = docBlob.parts[0];

fs.writeFileSync('./scratch/sample_output_word2003.doc', docHtml, 'utf-8');
console.log("Successfully generated sample_output_word2003.doc (length: " + docHtml.length + ")");

console.log("\n--- Checking key segments in generated .doc HTML ---");

function checkSegment(name, regex) {
  const match = docHtml.match(regex);
  if (match) {
    console.log(`[PASS] ${name}: found -> ${match[0].slice(0, 150)}`);
  } else {
    console.log(`[FAIL] ${name}: not found!`);
  }
}

checkSegment("Vision & Mission in Times New Roman", /<span lang="EN-US"[^>]*>Vision &amp; Mission<\/span>/);
checkSegment("Clause 4.1 preserved (not changed to ৪।)", /৪\.১\./);
checkSegment("Clause 5.1 preserved (not changed to ৫।)", /৫\.১\./);
checkSegment("Hyphen in shilpo-shongskriti isolated to Times New Roman", /<span lang="EN-US"[^>]*>-<\/span>/);
checkSegment("Spacerun between closing paren and byabostha", /\)<\/span><span style='mso-spacerun:yes'>&nbsp;<\/span><span[^>]*>[^<]*ব্যবস্থা/);
checkSegment("Spacerun between closing paren and thakbe", /\)<\/span><span style='mso-spacerun:yes'>&nbsp;<\/span><span[^>]*>[^<]*_vK‡e/);

// Also check that paragraphs are separate <p class="MsoNormal">
const pMatches = docHtml.match(/<p class="MsoNormal"[^>]*>[\s\S]*?<\/p>/g);
console.log(`\nTotal paragraphs generated: ${pMatches ? pMatches.length : 0}`);
pMatches.forEach((p, idx) => {
  const plain = p.replace(/<[^>]+>/g, '').trim();
  if (plain) {
    console.log(`  P${idx+1}: ${plain.slice(0, 70)}...`);
  }
});
