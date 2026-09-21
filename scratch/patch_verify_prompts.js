const fs = require('fs');

['./js/ai-ocr-engine.js', './fayzar-converter/js/ai-ocr-engine.js'].forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  const isCRLF = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  const oldVerify = "   - No board tags/references (e.g., omit [ঢাকা বোর্ড-২০২৩]).";
  const newVerify = `   - No exam board tags/references (e.g., omit [ঢাকা বোর্ড-২০২৩]).
   - Preserve all legitimate content parentheses e.g. (Vision & Mission), (যেমন: ...), (বেঞ্চ/টেবিল), and retain hyphens in compound words (শিল্প-সংস্কৃতি, আলো-বাতাস, শিক্ষক-শিক্ষিকাদের).
   - Never merge or collapse sub-articles or clause lines (৪.১, ৪.২, ৫.১, ৫.২); ensure each remains on its own separate line.`;

  if (!content.includes(oldVerify)) {
    console.error(`oldVerify not found in ${filePath}`);
    return;
  }

  content = content.replace(oldVerify, newVerify);
  if (isCRLF) {
    content = content.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully updated verify prompt in ${filePath}`);
});
