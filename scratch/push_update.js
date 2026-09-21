const fs = require('fs');
const config = JSON.parse(fs.readFileSync('github-config.json', 'utf8'));

async function updateFile(relPath) {
  const filePath = relPath.replace(/\\/g, '/');
  console.log('Fetching remote info for:', filePath);
  const getUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`;
  const getRes = await fetch(getUrl, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'FayzarComputer-AutoSync'
    }
  });

  if (!getRes.ok) {
    console.error('Failed to get remote sha:', getRes.status, await getRes.text());
    return false;
  }

  const fileData = await getRes.json();
  const remoteSha = fileData.sha;
  console.log('Remote SHA for', filePath, ':', remoteSha);

  const localContent = fs.readFileSync(filePath);
  const base64Content = localContent.toString('base64');

  const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
  const putBody = {
    message: 'Fix Word equations: heal Unicode scripts to LaTeX, auto-generate real Word EQ fields and Office Math OMML for formulas, powers, and fractions',
    content: base64Content,
    sha: remoteSha,
    branch: config.branch
  };

  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'FayzarComputer-AutoSync'
    },
    body: JSON.stringify(putBody)
  });

  if (putRes.ok) {
    const resData = await putRes.json();
    console.log('SUCCESS: Updated ' + filePath + ' (Commit: ' + resData.commit?.sha?.slice(0, 7) + ')');
    return true;
  } else {
    console.error('ERROR updating ' + filePath + ':', putRes.status, await putRes.text());
    return false;
  }
}

async function run() {
  const ok1 = await updateFile('converter.html');
  await new Promise(r => setTimeout(r, 1200));
  const ok2 = await updateFile('js/equation-converter.js');
  await new Promise(r => setTimeout(r, 1200));
  const ok3 = await updateFile('js/docx-handler.js');
  await new Promise(r => setTimeout(r, 1200));
  const ok4 = await updateFile('js/ai-ocr-engine.js');
  if (ok1 && ok2 && ok3 && ok4) {
    console.log('ALL FILES UPDATED SUCCESSFULLY ON GITHUB!');
  }
}

run();
