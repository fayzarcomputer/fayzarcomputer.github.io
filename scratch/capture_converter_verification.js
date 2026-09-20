const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9226/json/new?about:blank`, { method: 'PUT' });
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
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://localhost:3000/converter.html' });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Capture top title
    const topShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1280, height: 450, scale: 1 }
    });
    fs.writeFileSync(path.join(__dirname, 'converter_title_fixed.png'), Buffer.from(topShot.data, 'base64'));

    // 2. Scroll to bottom and capture footer
    await send('Runtime.evaluate', {
      expression: 'window.scrollTo(0, document.body.scrollHeight);'
    });
    await new Promise(r => setTimeout(r, 800));

    const bottomShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 350, width: 1280, height: 550, scale: 1 }
    });
    fs.writeFileSync(path.join(__dirname, 'converter_footer_fixed.png'), Buffer.from(bottomShot.data, 'base64'));

    console.log('Converter screenshots captured successfully');
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
