const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\03ea088d-4397-4387-b80a-cb0c4b872d36';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function capturePage(url, setLang, outFile, clip = null) {
    const res = await fetch(`http://127.0.0.1:9227/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
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
    await new Promise(r => setTimeout(r, 1500));

    if (setLang) {
      await send('Runtime.evaluate', {
        expression: `
          if (typeof window.setLanguage === 'function') {
            window.setLanguage('${setLang}');
          } else if (window.FayzarLang && window.FayzarLang.setLanguage) {
            window.FayzarLang.setLanguage('${setLang}');
          }
        `
      });
      await new Promise(r => setTimeout(r, 800));
    }

    const screenshotParams = {};
    if (clip) {
      screenshotParams.clip = clip;
    }

    const clipResult = await send('Page.captureScreenshot', screenshotParams);
    fs.writeFileSync(outFile, Buffer.from(clipResult.data, 'base64'));
    
    // Also copy to artifact dir
    const artifactPath = path.join(artifactDir, path.basename(outFile));
    fs.writeFileSync(artifactPath, Buffer.from(clipResult.data, 'base64'));
    console.log(`Saved screenshot to ${outFile} and ${artifactPath}`);

    // Check navbar font size
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navEl = document.querySelector('#desktop-nav-links a');
          const heroH1 = document.querySelector('h1');
          return {
            navFontSize: navEl ? window.getComputedStyle(navEl).fontSize : 'null',
            navFontFamily: navEl ? window.getComputedStyle(navEl).fontFamily : 'null',
            heroText: heroH1 ? heroH1.innerText : 'null'
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`Page Info (${url}, lang=${setLang}):`, evalRes.result?.value);

    ws.close();
  }

  try {
    // 1. Results navbar top clip
    await capturePage('http://localhost:3000/results.html', null, 'scratch/results_nav_fixed.png', {
      x: 0, y: 0, width: 1280, height: 120, scale: 1
    });

    // 2. Results page in English mode
    await capturePage('http://localhost:3000/results.html', 'en', 'scratch/results_en_mode.png');

    // 3. Notices page in English mode
    await capturePage('http://localhost:3000/notices.html', 'en', 'scratch/notices_en_mode.png');

    // 4. Services page in English mode
    await capturePage('http://localhost:3000/services.html', 'en', 'scratch/services_en_mode.png');

    // 5. Converter page in English mode
    await capturePage('http://localhost:3000/converter.html', 'en', 'scratch/converter_en_mode.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

run();
