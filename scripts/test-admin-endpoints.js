const http = require('http');

async function post(path, body) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3001${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let raw = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw), cookies }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function get(path, cookieStr) {
  return new Promise((resolve) => {
    const req = http.request(`http://localhost:3001${path}`, {
      method: 'GET',
      headers: { 'Cookie': cookieStr }
    }, r => {
      let raw = '';
      r.on('data', d => raw += d);
      r.on('end', () => resolve({ status: r.statusCode, body: raw.substring(0, 80) }));
    });
    req.on('error', (e) => resolve({ status: 'CONN_ERR', body: e.message }));
    req.end();
  });
}

async function main() {
  console.log('=== ADMIN ENDPOINT AUDIT ===\n');
  const login = await post('/auth/login', { email: 'admin@sudoku.com', password: 'Admin@Sudoku2026!' });
  const cookie = login.cookies.map(c => c.split(';')[0]).join('; ');
  console.log(`Login: ${login.status} | Role: ${login.body.role}\n`);

  const endpoints = [
    '/admin/analytics/overview',
    '/admin/analytics/chart?period=7d',
    '/admin/users?page=1&pageSize=20',
    '/admin/reports',
    '/admin/audit?limit=50',
    '/daily/admin/config',
    '/config/game-modes/all',
    '/forum/posts',
    '/admin/tickets',
    '/config/homepage/draft',
    '/config/homepage/defaults',
    '/content/admin/articles',
    '/media',
    '/admin/marketing-settings',
    '/admin/email-templates',
    '/shop/admin/products',
    '/admin/features',
    '/admin/ads',
    '/analytics/totals?days=7',
    '/analytics/insights?locale=en',
    '/analytics/realtime',
    '/config/theme/draft',
    '/admin/system/health',
  ];

  let pass = 0, fail = 0;
  for (const ep of endpoints) {
    const res = await get(ep, cookie);
    const ok = res.status === 200;
    if (ok) pass++; else fail++;
    console.log(`${ok ? '✅' : '❌'} [${res.status}] GET ${ep}`);
    if (!ok) console.log(`    └─ ${res.body}`);
  }

  console.log(`\n=== RESULT: ${pass} OK, ${fail} FAILED ===`);
}

main().catch(console.error);
