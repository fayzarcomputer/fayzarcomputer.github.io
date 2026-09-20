const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function inspectPage(url) {
    // Create new tab
    const createRes = await fetch(`http://127.0.0.1:9223/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const target = await createRes.json();
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

    // Wait for load
    await new Promise(r => setTimeout(r, 2000));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const body = getComputedStyle(document.body);
        const navContainer = document.querySelector('#desktop-nav-links');
        const navStyle = navContainer ? getComputedStyle(navContainer) : null;
        const links = Array.from(document.querySelectorAll('#desktop-nav-links a')).map(a => {
          const cs = getComputedStyle(a);
          const rect = a.getBoundingClientRect();
          return {
            text: a.innerText.trim().replace(/\\s+/g, ' '),
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            padding: cs.padding,
            height: rect.height,
            width: rect.width
          };
        });

        const capsule = document.querySelector('.bg-gradient-to-r.from-emerald-600');
        const capsuleStyle = capsule ? getComputedStyle(capsule) : null;
        const capsuleRect = capsule ? capsule.getBoundingClientRect() : null;

        return {
          bodyFont: body.fontFamily,
          bodyFontSize: body.fontSize,
          navFont: navStyle ? navStyle.fontFamily : null,
          navFontSize: navStyle ? navStyle.fontSize : null,
          capsuleHeight: capsuleRect ? capsuleRect.height : null,
          links
        };
      })()`,
      returnByValue: true
    });

    ws.close();
    return evalResult.result.value;
  }

  try {
    const indexData = await inspectPage('http://localhost:3000/index.html');
    const servicesData = await inspectPage('http://localhost:3000/services.html');

    console.log('=== INDEX.HTML DATA ===');
    console.log(JSON.stringify(indexData, null, 2));

    console.log('\n=== SERVICES.HTML DATA ===');
    console.log(JSON.stringify(servicesData, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
