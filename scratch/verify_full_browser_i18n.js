const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\03ea088d-4397-4387-b80a-cb0c4b872d36';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,1000'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function testPage(file, outFile) {
    console.log(`\nTesting page: ${file}`);
    const url = `http://localhost:3000/${file}?lang=en&t=${Date.now()}`;
    const res = await fetch(`http://127.0.0.1:9229/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
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
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 1500));

    // Evaluate setLang('en')
    await send('Runtime.evaluate', {
      expression: `
        if (window.FayzarUI) {
          window.FayzarUI.setLang('en');
        }
      `
    });

    await new Promise(r => setTimeout(r, 800));

    // Audit remaining Bengali text nodes
    const auditRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const remainingBn = [];
          while (walker.nextNode()) {
            const val = walker.currentNode.nodeValue.trim();
            const parent = walker.currentNode.parentElement;
            if (!parent) continue;
            const tag = parent.tagName.toUpperCase();
            if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(tag)) continue;
            if (/[\\u0980-\\u09FF]/.test(val)) {
              remainingBn.push({
                tag: tag,
                text: val.substring(0, 50)
              });
            }
          }
          return {
            count: remainingBn.length,
            samples: remainingBn.slice(0, 6)
          };
        })()
      `,
      returnByValue: true
    });

    const info = auditRes.result.value;
    console.log(`  Remaining Bengali text nodes in ${file}: ${info.count}`);
    if (info.count > 0) {
      console.log('  Samples:', JSON.stringify(info.samples, null, 2));
    }

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const localPath = path.join(__dirname, outFile);
    fs.writeFileSync(localPath, buf);
    fs.writeFileSync(path.join(artifactDir, outFile), buf);
    console.log(`  Captured screenshot: ${outFile}`);

    ws.close();
    await fetch(`http://127.0.0.1:9229/json/close/${target.id}`);
  }

  try {
    await testPage('services.html', 'services_full_en.png');
    await testPage('converter.html', 'converter_full_en.png');
    await testPage('portal.html', 'portal_full_en.png');
    await testPage('results.html', 'results_full_en.png');
    await testPage('tools.html', 'tools_full_en.png');
    await testPage('contact.html', 'contact_full_en.png');
    await testPage('index.html', 'index_full_en.png');
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    chrome.kill();
    console.log("\nBrowser tests completed!");
  }
}

run();
