const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const pages = [
  { name: 'index', url: 'http://localhost:3000/index.html' },
  { name: 'services', url: 'http://localhost:3000/services.html' },
  { name: 'converter', url: 'http://localhost:3000/converter.html' },
  { name: 'portal', url: 'http://localhost:3000/portal.html' },
  { name: 'tools', url: 'http://localhost:3000/tools.html' },
  { name: 'results', url: 'http://localhost:3000/results.html' },
  { name: 'notices', url: 'http://localhost:3000/notices.html' },
  { name: 'contact', url: 'http://localhost:3000/contact.html' }
];

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9225/json/new?about:blank`, { method: 'PUT' });
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    for (const p of pages) {
      await send('Page.navigate', { url: p.url });
      await new Promise(r => setTimeout(r, 1200));

      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: 1280, height: 450, scale: 1 }
      });

      const outPath = path.join(__dirname, `${p.name}_top.png`);
      fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Captured: ${p.name} -> ${outPath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
