const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9235/json/new?about:blank`, { method: 'PUT' });
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
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. Admin PIN screen
    await send('Page.navigate', { url: 'http://localhost:3000/admin.html' });
    await new Promise(r => setTimeout(r, 1200));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'admin_auth_screen.png'), Buffer.from(shot.data, 'base64'));
    console.log('Captured admin_auth_screen.png');

    // 2. Admin Dashboard (authenticate via sessionStorage and reload or DOM reveal)
    await send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('fayzar_admin_auth', 'authenticated');
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'admin_dashboard.png'), Buffer.from(shot.data, 'base64'));
    console.log('Captured admin_dashboard.png');

    // 3. Result Admin PIN screen
    await send('Page.navigate', { url: 'http://localhost:3000/result-admin.html' });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'result_admin_auth.png'), Buffer.from(shot.data, 'base64'));
    console.log('Captured result_admin_auth.png');

    // 4. Result Admin Dashboard (authenticated with super)
    await send('Page.navigate', { url: 'http://localhost:3000/result-admin.html?auth=super&tab=batchPrint' });
    await new Promise(r => setTimeout(r, 1500));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'result_admin_dashboard.png'), Buffer.from(shot.data, 'base64'));
    console.log('Captured result_admin_dashboard.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
