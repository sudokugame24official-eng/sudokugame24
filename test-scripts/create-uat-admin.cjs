// Create SUPER_ADMIN user for UAT testing
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const API = 'http://localhost:3001';
  
  // First register normal user
  const email = 'uat.superadmin@test.sudoku';
  const username = 'UATSuperAdmin';
  const password = 'SuperAdmin123!';
  
  console.log('Creating UAT SUPER_ADMIN user...');
  
  // Register
  const reg = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  
  if (reg.status === 201) {
    console.log('✓ User registered');
  } else if (reg.status === 409) {
    console.log('~ User already exists, proceeding with login');
  } else {
    const b = await reg.json().catch(() => ({}));
    console.log('? Register status:', reg.status, JSON.stringify(b));
  }
  
  // Login
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const loginBody = await login.json().catch(() => ({}));
  const setCookie = login.headers.get('set-cookie') || '';
  const m = setCookie.match(/jwt=([^;]+)/);
  const cookie = m ? `jwt=${m[1]}` : '';
  
  console.log('Login status:', login.status);
  console.log('User ID:', loginBody.user?.id);
  console.log('Cookie:', cookie ? 'obtained' : 'MISSING');
  
  if (cookie) {
    const me = await fetch(`${API}/auth/me`, { headers: { Cookie: cookie } });
    const meBody = await me.json();
    console.log('Current role:', meBody.role);
    console.log('User ID from /me:', meBody.id);
    
    // Output cookie for use in UAT
    console.log('\nAdmin credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Cookie:', cookie);
    console.log('  User ID:', meBody.id);
    console.log('  Role:', meBody.role, '(upgrade needed: will be done via DB if required)');
  }
}

createAdmin().catch(console.error);
