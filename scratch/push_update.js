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
    message: 'Remove lite models and optimize active Gemini OCR models',
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
  const ok2 = await updateFile('js/ai-ocr-engine.js');
  if (ok1 && ok2) {
    console.log('ALL FILES UPDATED SUCCESSFULLY ON GITHUB!');
  }
}

run();
