const http = require('http');

const webUrls = [
  'http://localhost:3000/fr',
  'http://localhost:3000/fr/forum',
  'http://localhost:3000/fr/questions',
  'http://localhost:3000/fr/learn',
  'http://localhost:3000/fr/shop',
  'http://localhost:3000/fr/daily',
  'http://localhost:3000/fr/leaderboard',
  'http://localhost:3000/fr/duel',
  'http://localhost:3000/fr/auth',
  'http://localhost:3000/fr/admin',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  console.log('=== VERIFYING PUBLIC AND ADMIN WEB ROUTES ===');
  for (const url of webUrls) {
    const res = await checkUrl(url);
    console.log(`${res.status === 200 ? '✅ [200 OK]' : '❌ [' + (res.status || 'ERR') + ']'} ${url}`);
  }
}

main();
