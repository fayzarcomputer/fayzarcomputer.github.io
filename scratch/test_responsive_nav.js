const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function inspectAtWidth(width) {
    const res = await fetch(`http://127.0.0.1:9224/json/new?about:blank`, { method: 'PUT' });
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
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768
    });

    async function getMetrics(url) {
      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 1500));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const nav = document.querySelector('nav');
          const navRect = nav ? nav.getBoundingClientRect() : null;
          const logo = nav ? nav.querySelector('a') : null;
          const logoRect = logo ? logo.getBoundingClientRect() : null;
          const topCapsule = document.querySelector('.bg-gradient-to-r.from-emerald-600');
          const capsuleRect = topCapsule ? topCapsule.getBoundingClientRect() : null;
          const navLinks = document.querySelector('#desktop-nav-links');
          const navLinksRect = navLinks ? navLinks.getBoundingClientRect() : null;
          const navLinksStyle = navLinks ? getComputedStyle(navLinks) : null;

          return {
            navHeight: navRect ? navRect.height : null,
            logoHeight: logoRect ? logoRect.height : null,
            logoWidth: logoRect ? logoRect.width : null,
            capsuleHeight: capsuleRect ? capsuleRect.height : null,
            capsuleWidth: capsuleRect ? capsuleRect.width : null,
            navLinksHeight: navLinksRect ? navLinksRect.height : null,
            navLinksWidth: navLinksRect ? navLinksRect.width : null,
            navFontSize: navLinksStyle ? navLinksStyle.fontSize : null,
            navGap: navLinksStyle ? navLinksStyle.gap : null
          };
        })()`,
        returnByValue: true
      });
      return res.result.value;
    }

    const indexM = await getMetrics('http://localhost:3000/index.html');
    const servicesM = await getMetrics('http://localhost:3000/services.html');

    ws.close();
    return { width, index: indexM, services: servicesM };
  }

  try {
    for (const w of [1536, 1280, 1024, 768, 400]) {
      const comparison = await inspectAtWidth(w);
      console.log(`\n=== WIDTH: ${w}px ===`);
      console.log('INDEX:   ', JSON.stringify(comparison.index));
      console.log('SERVICES:', JSON.stringify(comparison.services));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
