const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-computer-web/js/fayzar-ocr-config.js', 'utf8');
const sandbox = { console, Buffer };
vm.createContext(sandbox);
vm.runInContext(code + '; this.FayzarOcrConfig = FayzarOcrConfig;', sandbox);
const keys = sandbox.FayzarOcrConfig.getAllSystemKeys();
console.log('Total valid keys in vault:', keys.length);

async function test() {
  console.log('--- Testing All 16 Keys for gemini-3.5-flash & gemini-3.6-flash ---');
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${k}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: '1' }] }] })
      });
      if (r.status === 200) {
        console.log(`Key #${i+1} (${k.slice(0, 10)}...${k.slice(-4)}): ACTIVE 200 OK ✅`);
      } else if (r.status === 429) {
        const err = await r.json().catch(() => ({}));
        console.log(`Key #${i+1} (${k.slice(0, 10)}...${k.slice(-4)}): 429 QUOTA RATE-LIMIT ⚠️ (${err.error?.message?.slice(0, 80)}...)`);
      } else {
        const err = await r.json().catch(() => ({}));
        console.log(`Key #${i+1} (${k.slice(0, 10)}...${k.slice(-4)}): Status ${r.status} ❌ (${err.error?.message?.slice(0, 80)}...)`);
      }
    } catch(e) {
      console.log(`Key #${i+1}: Fetch error: ${e.message}`);
    }
  }
}
test();

