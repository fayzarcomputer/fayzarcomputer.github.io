const fs = require('fs');

for (const p of [
  'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-web/converter.html',
  'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-v2/converter.html'
]) {
  console.log(`\n=== Checking: ${p} ===`);
  const html = fs.readFileSync(p, 'utf8');

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');

  const metaTitleMatch = html.match(/<meta name="title" content="(.*?)">/);
  console.log('Meta Title:', metaTitleMatch ? metaTitleMatch[1] : 'NOT FOUND');

  const subtitleMatch = html.match(/data-i18n="converter_page_subtitle">\s*([\s\S]*?)\s*<\/p>/);
  console.log('Subtitle in HTML:', subtitleMatch ? subtitleMatch[1].trim() : 'NOT FOUND');

  console.log('4-step guide present?:', html.includes('সহজ ৪-ধাপের ব্যবহার নির্দেশিকা'));
  console.log('SEO Tags section present?:', html.includes('id="converter-seo-tags"'));
  console.log('Model 3.5 option present?:', html.includes('value="gemini-3.5-flash"'));
  console.log('Model 2.5 option present?:', html.includes('value="gemini-2.5-flash"'));
}

for (const p of [
  'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-web/js/theme-lang.js',
  'c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-v2/js/theme-lang.js'
]) {
  console.log(`\n=== Checking theme-lang: ${p} ===`);
  const js = fs.readFileSync(p, 'utf8');
  const bnMatch = js.match(/converter_page_subtitle:\s*'([^']+)'/);
  console.log('First match (BN):', bnMatch ? bnMatch[1] : 'NOT FOUND');
  const allMatches = [...js.matchAll(/converter_page_subtitle:\s*'([^']+)'/g)];
  if (allMatches.length > 1) {
    console.log('Second match (EN):', allMatches[1][1]);
  }
}
