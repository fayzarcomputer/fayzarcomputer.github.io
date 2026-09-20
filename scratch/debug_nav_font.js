const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch(`http://127.0.0.1:9241/json/new?about:blank`, { method: 'PUT' });
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

    for (const page of ['index.html', 'results.html', 'services.html', 'converter.html']) {
      await send('Page.navigate', { url: `http://localhost:3000/${page}` });
      await new Promise(r => setTimeout(r, 1200));

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.getElementById('desktop-nav-links');
            if (!nav) return { error: 'No #desktop-nav-links' };
            const navComputed = window.getComputedStyle(nav);
            const firstA = nav.querySelector('a');
            const firstAComputed = firstA ? window.getComputedStyle(firstA) : null;
            const allLinks = Array.from(nav.querySelectorAll('a')).map(a => ({
              text: a.innerText.trim(),
              fontSize: window.getComputedStyle(a).fontSize,
              fontWeight: window.getComputedStyle(a).fontWeight,
              fontFamily: window.getComputedStyle(a).fontFamily
            }));
            return {
              navFontSize: navComputed.fontSize,
              navClasses: nav.className,
              allLinks
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`\n=== Page: ${page} ===`);
      console.log(JSON.stringify(evalRes.result.value, null, 2));
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
