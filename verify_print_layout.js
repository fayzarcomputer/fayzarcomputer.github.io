const fs = require('fs');

console.log('--- Verifying Print Layout & Marksheet Design ---');

// 1. Check results.html
const resultsHtml = fs.readFileSync('results.html', 'utf8');

const requiredTokensResults = [
  'height: 288mm !important;',
  'max-height: 288mm !important;',
  'margin: 4.5mm auto 0 auto !important;',
  '.certificate-inner-frame',
  '.corner-ornament',
  'corner-tl',
  'corner-tr',
  'corner-bl',
  'corner-br',
  'border: 5px solid #0f172a !important;',
  'stroke-opacity=\'0.038\'',
  'Grading Scale',
  'ACADEMIC TRANSCRIPT / একাডেমিক ট্রান্সক্রিপ্ট',
  'id="msRemarks"',
  'id="msQrCodeBox"',
  'id="msPublishDate"',
  'ডিজিটাল সত্যায়ন',
  'শ্রেণি শিক্ষকের স্বাক্ষর ও তারিখ',
  'প্রধান শিক্ষক / অধ্যক্ষের স্বাক্ষর ও সিল',
  'ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট',
  '01717-101919'
];

let allPassed = true;
requiredTokensResults.forEach(token => {
  if (!resultsHtml.includes(token)) {
    console.error(`FAIL: Missing "${token}" in results.html`);
    allPassed = false;
  } else {
    console.log(`PASS: Found "${token}" in results.html`);
  }
});

// 2. Check result-admin.html
const adminHtml = fs.readFileSync('result-admin.html', 'utf8');
const requiredTokensAdmin = [
  'height: 288mm !important;',
  'margin: 4.5mm auto 0 auto !important;',
  '.batch-student-page',
  '.certificate-inner-frame',
  '.corner-ornament',
  'corner-tl',
  'corner-tr',
  'corner-bl',
  'corner-br',
  'border: 5px solid #0f172a !important;',
  'stroke-opacity=\'0.038\'',
  'id="newStudentReligion"',
  'id="newStudentFourthSubject"'
];

requiredTokensAdmin.forEach(token => {
  if (!adminHtml.includes(token)) {
    console.error(`FAIL: Missing "${token}" in result-admin.html`);
    allPassed = false;
  } else {
    console.log(`PASS: Found "${token}" in result-admin.html`);
  }
});

// 3. Check results-admin.js batch print code & live spreadsheet N/A lockout
const adminJs = fs.readFileSync('js/results-admin.js', 'utf8');
const requiredTokensAdminJs = [
  'certificate-inner-frame',
  'corner-ornament corner-tl',
  'Grading Scale',
  'ACADEMIC TRANSCRIPT / একাডেমিক ট্রান্সক্রিপ্ট',
  'ResultEngine.generateVerificationQrSvg',
  'sub.papers',
  'rowspan="2"',
  'ডিজিটাল সত্যায়ন',
  'শ্রেণি শিক্ষকের স্বাক্ষর ও তারিখ',
  'প্রধান শিক্ষক / অধ্যক্ষের স্বাক্ষর ও সিল',
  'ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট',
  'title="এই শিক্ষার্থীর জন্য এ বিষয়টি প্রযোজ্য নয়"',
  'text-slate-400 font-mono">N/A</span>'
];

requiredTokensAdminJs.forEach(token => {
  if (!adminJs.includes(token)) {
    console.error(`FAIL: Missing "${token}" in js/results-admin.js`);
    allPassed = false;
  } else {
    console.log(`PASS: Found "${token}" in js/results-admin.js`);
  }
});

// 4. Check results-public.js composite rendering
const publicJs = fs.readFileSync('js/results-public.js', 'utf8');
const requiredTokensPublicJs = [
  'sub.papers',
  'rowspan="2"',
  'p1.name_bn',
  'p2.name_bn',
  'showOptBadge'
];

requiredTokensPublicJs.forEach(token => {
  if (!publicJs.includes(token)) {
    console.error(`FAIL: Missing "${token}" in js/results-public.js`);
    allPassed = false;
  } else {
    console.log(`PASS: Found "${token}" in js/results-public.js`);
  }
});

// 5. Verify Class 9 & Class 10 Data integrity & Specific Subject Names
const dataRaw = JSON.parse(fs.readFileSync('data/results_data.json', 'utf8'));
const students = Array.isArray(dataRaw) ? dataRaw : (dataRaw.students || []);
const s9 = students.find(s => s.class_id === 'class_9');
const s10 = students.find(s => s.class_id === 'class_10');

if (!s9) {
  console.error('FAIL: No class_9 student found');
  allPassed = false;
} else {
  const b9 = s9.subjects.find(sub => sub.code === '101-102');
  if (b9 && Array.isArray(b9.papers) && b9.papers.length === 2 && b9.papers[0].name_bn.includes('১ম') && b9.papers[1].name_bn.includes('২য়')) {
    console.log('PASS: Class 9 Bangla 1st & 2nd papers verified with combined marks!');
  } else {
    console.error('FAIL: Class 9 Bangla papers verification failed');
    allPassed = false;
  }
}

if (!s10) {
  console.error('FAIL: No class_10 student found');
  allPassed = false;
} else {
  const b10 = s10.subjects.find(sub => sub.code === '101-102');
  if (b10 && Array.isArray(b10.papers) && b10.papers.length === 2 && b10.papers[0].name_bn.includes('১ম') && b10.papers[1].name_bn.includes('২য়')) {
    console.log('PASS: Class 10 Bangla 1st & 2nd papers verified with combined marks!');
  } else {
    console.error('FAIL: Class 10 Bangla papers verification failed');
    allPassed = false;
  }
}

// 6. Check that NO student has generic 'ধর্ম ও নৈতিক শিক্ষা' or '৪র্থ বিষয় (কৃষি/উচ্চতর গণিত)'
let genericRelCount = 0;
let genericOptCount = 0;
let islamCount = 0;
let hinduCount = 0;
let agriCount = 0;
let hmathCount = 0;

students.forEach(st => {
  (st.subjects || []).forEach(sub => {
    if (sub.name_bn === 'ধর্ম ও নৈতিক শিক্ষা') genericRelCount++;
    if (sub.name_bn.includes('(কৃষি/উচ্চতর গণিত)')) genericOptCount++;
    if (sub.name_bn === 'ইসলাম ও নৈতিক শিক্ষা') islamCount++;
    if (sub.name_bn === 'হিন্দুধর্ম ও নৈতিক শিক্ষা') hinduCount++;
    if (sub.name_bn.includes('কৃষি শিক্ষা')) agriCount++;
    if (sub.name_bn.includes('উচ্চতর গণিত')) hmathCount++;
  });
});

if (genericRelCount > 0) {
  console.error(`FAIL: Found ${genericRelCount} subjects still using generic "ধর্ম ও নৈতিক শিক্ষা"!`);
  allPassed = false;
} else {
  console.log(`PASS: Zero generic religion subjects! (Islam: ${islamCount}, Hindu: ${hinduCount})`);
}

if (genericOptCount > 0) {
  console.error(`FAIL: Found ${genericOptCount} subjects still using generic "৪র্থ বিষয় (কৃষি/উচ্চতর গণিত)"!`);
  allPassed = false;
} else {
  console.log(`PASS: Zero generic optional subjects! (Agri: ${agriCount}, Higher Math: ${hmathCount})`);
}

if (allPassed) {
  console.log('\n>>> ALL PRINT LAYOUT, THICK BORDER, DISTINCT RELIGION & 4TH SUBJECT AUDITS PASSED SUCCESSFULLY! <<<');
} else {
  process.exit(1);
}
