const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9230/json/new?about:blank`, { method: 'PUT' });
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

    await send('Page.navigate', { url: 'http://localhost:3000/services.html' });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll with window.scrollTo
    const info = await send('Runtime.evaluate', {
      expression: `(() => {
        const f = document.querySelector('footer');
        f.scrollIntoView({ behavior: 'instant', block: 'end' });
        return {
          docHeight: document.documentElement.scrollHeight,
          bodyHeight: document.body.scrollHeight,
          scrollY: window.scrollY,
          footerTop: f ? f.offsetTop : null,
          footerHeight: f ? f.offsetHeight : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Scroll Info:', info.result.value);

    await new Promise(r => setTimeout(r, 500));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'services_footer_verified.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved services_footer_verified.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
