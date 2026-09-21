const fs = require('fs');

global.window = global;
require('../js/bangla-converter-engine.js');
require('../js/equation-converter.js');
require('../js/docx-handler.js');

function patchedRenderWordWhitespace(ws) {
  if (!ws) return "";
  let res = "";
  for (let ch of ws) {
    if (ch === '\t') res += "<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
    else res += "<span style='mso-spacerun:yes'>&nbsp;</span>";
  }
  return res;
}

// Test formatQuestionNumber fix:
function patchedFormatQuestionNumber(line, isBijoy = false) {
  if (!line) return line;
  if (DocxHandler.isEnglishQuestionLine(line)) return line;

  // Unicode Bengali Question: e.g. ১. or ১) or ১: or 1. (with Bengali text)
  // Must NOT match multi-dot or decimal numbered items like ৪.১. or ৫.২.
  if (/[\u0980-\u09FF]/.test(line)) {
    return line.replace(/^[ \t]*(?:প্রশ্ন|প্রশ্ন নং|প্রশ্ননং|Question)?\s*([০-৯0-9]+)[\.\)\:\-](?!\s*[০-৯0-9])\s*/i, (match, p1) => {
      const bnDigits = p1.replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
      return `${bnDigits}। `;
    });
  }

  // Bijoy Question: 1. or 1) or 1:
  if (isBijoy || /[\u0080-\u00FF‡‰†Š&|]/.test(line)) {
    if (/^[ \t]*(?:cÖkœ|cÖkœ bs)?\s*([0-9]+)[\.\)\:\-](?!\s*[0-9])\s*/i.test(line)) {
      return line.replace(/^[ \t]*(?:cÖkœ|cÖkœ bs)?\s*([0-9]+)[\.\)\:\-](?!\s*[0-9])\s*/i, '$1| ');
    }
    if (/^[ \t]*([0-9]+)[\.\)\:\-](?!\s*[0-9])\s*/.test(line)) {
      return line.replace(/^[ \t]*([0-9]+)[\.\)\:\-](?!\s*[0-9])\s*/, '$1| ');
    }
  }

  return line;
}

console.log("=== Testing patchedFormatQuestionNumber ===");
console.log("Input: '৪.১. শিবনগর' ->", patchedFormatQuestionNumber("৪.১. শিবনগর", false));
console.log("Input: '১. প্রথম প্রশ্ন' ->", patchedFormatQuestionNumber("১. প্রথম প্রশ্ন", false));
console.log("Input: '1. What is' ->", patchedFormatQuestionNumber("1. What is", false));
console.log("Input: 'cÖkœ 1. cÖ_g' ->", patchedFormatQuestionNumber("cÖkœ 1. cÖ_g", true));
console.log("Input: '4.1. cÖ_g' ->", patchedFormatQuestionNumber("4.1. cÖ_g", true));

// Test spacerun on (বেঞ্চ/টেবিল) থাকবে
function testMixedHtml(str) {
  const mixedParts = BanglaConverter.splitMixedBengaliAndEnglish(str);
  let out = "";
  const fontName = "SutonnyMJ";
  for (const part of mixedParts) {
    const escaped = (part.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const leadSpMatch = part.text.match(/^\s+/);
    const trailSpMatch = part.text.match(/\s+$/);
    const leadSp = leadSpMatch ? patchedRenderWordWhitespace(leadSpMatch[0]) : "";
    const trailSp = trailSpMatch ? patchedRenderWordWhitespace(trailSpMatch[0]) : "";
    
    if (part.type === 'english') {
      const trimmedEn = part.text.trim();
      const formattedEn = escaped.trim().replace(/\t/g, "<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
      out += `${leadSp}<span lang="EN-US" style="font-family:'Times New Roman',serif;mso-ascii-font-family:'Times New Roman';mso-hansi-font-family:'Times New Roman';">${formattedEn}</span>${trailSp}`;
    } else {
      const targetText = BanglaConverter.unicodeToBijoy(part.text);
      const escapedBn = (targetText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const formattedBn = escapedBn.trim().replace(/\t/g, "<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
      out += `${leadSp}<span style="font-family:'${fontName}',Arial,sans-serif;mso-ascii-font-family:'${fontName}';mso-hansi-font-family:'${fontName}';mso-bidi-font-family:'${fontName}';">${formattedBn}</span>${trailSp}`;
    }
  }
  return out;
}

console.log("\n=== Testing testMixedHtml on '(বেঞ্চ/টেবিল) থাকবে' ===");
console.log(testMixedHtml("(বেঞ্চ/টেবিল) থাকবে"));
