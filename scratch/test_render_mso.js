function renderMsoSpaces(str) {
  if (!str) return '';
  if (/^ +$/.test(str)) {
    return "<span style='mso-spacerun:yes'>" + '&nbsp;'.repeat(str.length) + '</span>';
  }
  str = str.replace(/^( +)/, (m) => "<span style='mso-spacerun:yes'>" + '&nbsp;'.repeat(m.length) + '</span>');
  str = str.replace(/( +)$/, (m) => "<span style='mso-spacerun:yes'>" + '&nbsp;'.repeat(m.length) + '</span>');
  str = str.replace(/ {2,}/g, (m) => " <span style='mso-spacerun:yes'>" + '&nbsp;'.repeat(m.length - 1) + '</span>');
  return str;
}

console.log('Single space:', JSON.stringify(renderMsoSpaces(' ')));
console.log('Trailing space:', JSON.stringify(renderMsoSpaces('(যেমন: চিত্রাঙ্কন) ')));
console.log('Leading space:', JSON.stringify(renderMsoSpaces(' ব্যবস্থা')));
console.log('Double space:', JSON.stringify(renderMsoSpaces('ক  খ')));
