const https = require('https');

const VAULT_KEYS = [
  "a3sEa0gSeGQcYG1AZxJdZ0kaZWh7ZnB8W05tfh5AXhNLXVJTfnJhUnxsRX9CH2JrGm9+GF0=",
  "a3sEa0gSeGQcYU8daFkYcl9dE10aTRMYZGgSUGNtcEleblJkWB1HaFpzaUFOXkdcWQdAHXs=",
  "a3sEa0gSeGQcYXBpZ1lMex4HWGJhfW8SHnUdW1pbUk1tYXpmGUZSGXtQb1prQVMSB2BEHU0=",
  "a2NQS3lTaU9NUElzQ2d1bUleaWl8Xlh8Z2ZAfW9zbEIfZVNae0Zd",
  "a3sEa0gSeGQcYGN9XUwYSFlMHhxGaQdTextiYklzfn1sRHx9QxNlBxxueWdzcE4fUk1+Wns="
];

function unpack(encodedStr, salt = 42) {
  const raw = Buffer.from(encodedStr, 'base64').toString('binary');
  const chars = [];
  for (let i = 0; i < raw.length; i++) {
    chars.push(String.fromCharCode(raw.charCodeAt(i) ^ salt));
  }
  return chars.join('');
}

const keys = VAULT_KEYS.map(k => unpack(k));

async function testKey(key, model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: '1' }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    const req = https.request('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body.slice(0, 150) });
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  const models = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (let i = 0; i < keys.length; i++) {
    console.log('--- Key ' + i + ' (' + keys[i].slice(0, 10) + '...) ---');
    for (const m of models) {
      const res = await testKey(keys[i], m);
      console.log(m, 'status:', res.status, res.body.replace(/\n/g, ' '));
    }
  }
})();
