const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\\\Users\\\\Admin\\\\.gemini\\\\antigravity-ide\\\\brain\\\\03ea088d-4397-4387-b80a-cb0c4b872d36';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9238',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9238/json/new?about:blank`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. index.html scrolled to useful links area
    await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
    await new Promise(r => setTimeout(r, 1500));
    
    // Evaluate position of #useful-links
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('useful-links');
        el ? el.offsetTop - 150 : 1500;
      `
    });
    const scrollPos = evalRes.result.value || 1500;

    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${scrollPos})`
    });
    await new Promise(r => setTimeout(r, 800));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'index_clean_after_sections_removal.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved index_clean_after_sections_removal.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
