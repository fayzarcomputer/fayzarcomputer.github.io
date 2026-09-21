const fs = require('fs');

const filePath = './fayzar-converter/js/docx-handler.js';
let raw = fs.readFileSync(filePath, 'utf-8');
const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

console.log('Line 1502:', lines[1502]);
console.log('Line 1521:', lines[1521]);

if (lines[1502].trim() === '} else {' && lines[1503].includes('BanglaConverter.unicodeToBijoy') && lines[1521].trim() === '}') {
  const newLines = [
`          } else {
            const targetText = (isBijoy && !isInputBijoy && typeof BanglaConverter !== 'undefined') ? BanglaConverter.unicodeToBijoy(part.text) : part.text;
            if (!targetText || !targetText.trim()) {
              out += DocxHandler.renderWordWhitespace(part.text);
              continue;
            }
            if (isBijoy && /[-–—−‒―]/.test(targetText)) {
              const dParts = targetText.trim().split(/([-–—−‒―]+)/);
              let splitBn = '';
              for (let dp of dParts) {
                if (!dp) continue;
                const escDp = dp.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const fmtDp = escDp.replace(/\\t/g, "<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
                if (/[-–—−‒―]/.test(dp)) {
                  splitBn += \`<span lang="EN-US" style="font-family:'Times New Roman',serif;mso-ascii-font-family:'Times New Roman';">\${fmtDp}</span>\`;
                } else {
                  splitBn += \`<span style="font-family:'\${fontName}',Arial,sans-serif;mso-ascii-font-family:'\${fontName}';mso-bidi-font-family:'\${fontName}';">\${fmtDp}</span>\`;
                }
              }
              out += \`\${leadSp}\${splitBn}\${trailSp}\`;
            } else {
              const escapedBn = (targetText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const formattedBn = escapedBn.trim().replace(/\\t/g, "<span style='mso-tab-count:1'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
              out += \`\${leadSp}<span style="font-family:'\${fontName}',Arial,sans-serif;mso-ascii-font-family:'\${fontName}';mso-bidi-font-family:'\${fontName}';">\${formattedBn}</span>\${trailSp}\`;
            }
          }`
  ];

  lines.splice(1502, 20, ...newLines);
  const updated = lines.join(isCRLF ? '\r\n' : '\n');
  fs.writeFileSync(filePath, updated, 'utf-8');
  console.log('Successfully replaced lines in ' + filePath);
} else {
  console.error('Validation failed at line 1502/1521');
}
