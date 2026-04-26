const BASE_URL = 'http://localhost:3000/api';

async function testCookies() {
  console.log('🧪 Testing Cookie-based Authentication...');
  
  try {
    // 1. Login to get cookie
    console.log('\n--- Step 1: Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@emis.mw',
        password: 'password123'
      })
    });
    
    // In Node fetch, cookies aren't automatically stored. We need to manually extract from set-cookie
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie header received:', setCookie ? '✅ Yes' : '❌ No');
    
    if (!setCookie) {
      console.error('❌ No Set-Cookie header found in login response');
      return;
    }

    // Extract access_token value
    const tokenMatch = setCookie.match(/access_token=([^;]+)/);
    if (!tokenMatch) {
      console.error('❌ access_token not found in Set-Cookie header');
      return;
    }
    const token = tokenMatch[1];
    console.log('Token extracted successfully');

    // 2. Access protected route with cookie
    console.log('\n--- Step 2: Access Protected Route with Cookie ---');
    const protectedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': `access_token=${token}`
      }
    });
    
    const protectedJson = await protectedRes.json();
    if (protectedRes.status === 200) {
      console.log('✅ Access Successful with Cookie!');
      console.log('User identity verified:', protectedJson.user.email);
    } else {
      console.error(`❌ Access Failed (${protectedRes.status}):`, protectedJson);
    }

  } catch (err) {
    console.error('💥 Test Execution Error:', err);
  }
}

testCookies();
