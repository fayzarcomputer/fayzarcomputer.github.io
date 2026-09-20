const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const pages = [
  { url: 'http://localhost:3000/index.html', name: 'index_hero_opt2.png' },
  { url: 'http://localhost:3000/services.html', name: 'services_hero_opt2.png' },
  { url: 'http://localhost:3000/portal.html', name: 'portal_hero_opt2.png' },
  { url: 'http://localhost:3000/notices.html', name: 'notices_hero_opt2.png' },
  { url: 'http://localhost:3000/results.html', name: 'results_hero_opt2.png' },
  { url: 'http://localhost:3000/contact.html', name: 'contact_hero_opt2.png' }
];

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9232/json/new?about:blank`, { method: 'PUT' });
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
      height: 820,
      deviceScaleFactor: 1,
      mobile: false
    });

    for (const p of pages) {
      await send('Page.navigate', { url: p.url });
      await new Promise(r => setTimeout(r, 1200));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, p.name), Buffer.from(shot.data, 'base64'));
      console.log(`Captured ${p.name}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
