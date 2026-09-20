const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function capture(url, outFile) {
    const res = await fetch(`http://127.0.0.1:9225/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
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
    await new Promise(r => setTimeout(r, 2000));

    // Capture navbar clip
    const clipResult = await send('Page.captureScreenshot', {
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 120,
        scale: 1
      }
    });

    fs.writeFileSync(outFile, Buffer.from(clipResult.data, 'base64'));
    ws.close();
    console.log(`Saved screenshot to ${outFile}`);
  }

  try {
    await capture('http://localhost:3000/index.html', 'scratch/index_nav.png');
    await capture('http://localhost:3000/services.html', 'scratch/services_nav.png');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
