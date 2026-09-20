const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\03ea088d-4397-4387-b80a-cb0c4b872d36';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9233/json/new?about:blank`, { method: 'PUT' });
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

    // 1. Navigate to index.html
    await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture Slide 1 (Initial 2 notices)
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'hero_notice_board_slide1.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved hero_notice_board_slide1.png');

    // Wait 5 seconds for auto-cycle to slide 2
    await new Promise(r => setTimeout(r, 5000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'hero_notice_board_slide2.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved hero_notice_board_slide2.png');

    // Click dark mode toggle
    await send('Runtime.evaluate', {
      expression: `document.getElementById('theme-toggle-btn')?.click()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture in Dark Mode
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'hero_notice_board_dark.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved hero_notice_board_dark.png');

    // Click on the first notice card to verify modal popup
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#hero-notices-container > div')?.click()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'hero_notice_board_modal.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved hero_notice_board_modal.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
