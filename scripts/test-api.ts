const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('🧪 Starting API Integration Testing...');
  
  try {
    // 1. Test Signup
    console.log('\n--- Test 1: Signup ---');
    const signupData = {
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test Tester'
    };
    
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const signupJson = await signupRes.json();
    if (signupRes.status === 201) {
      console.log('✅ Signup Successful (201)');
    } else {
      console.error(`❌ Signup Failed (${signupRes.status}):`, signupJson);
    }

    // 2. Test Login
    console.log('\n--- Test 2: Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupData.email,
        password: signupData.password
      })
    });
    
    const loginJson = await loginRes.json();
    if (loginRes.status === 200) {
      console.log('✅ Login Successful (200)');
      const token = loginJson.access_token;

      // 3. Test Protected Route: Attendance
      console.log('\n--- Test 3: Protected Route (Attendance) ---');
      const attendanceRes = await fetch(`${BASE_URL}/attendance`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const attendanceJson = await attendanceRes.json();
      if (attendanceRes.status === 200) {
        console.log('✅ Protected Attendance Access successful');
      } else {
        console.error(`❌ Protected Attendance Access failed (${attendanceRes.status}):`, attendanceJson);
      }

      // 3.1 Test Teachers
      console.log('\n--- Test 3.1: Teachers ---');
      const teachersRes = await fetch(`${BASE_URL}/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (teachersRes.status === 200) {
        console.log('✅ Teachers fetch successful');
      } else {
        console.error(`❌ Teachers fetch failed (${teachersRes.status})`);
      }

      // 3.2 Test EMIS Examination Results
      console.log('\n--- Test 3.2: Examination Results ---');
      const examRes = await fetch(`${BASE_URL}/emis/examination-results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (examRes.status === 200) {
        console.log('✅ Examination Results fetch successful');
      } else {
        console.error(`❌ Examination Results fetch failed (${examRes.status})`);
      }

      // 3.3 Test EMIS Exam Administration
      console.log('\n--- Test 3.3: Exam Administration ---');
      const adminRes = await fetch(`${BASE_URL}/emis/exam-administration`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (adminRes.status === 200) {
        console.log('✅ Exam Administration fetch successful');
      } else {
        const json = await adminRes.json();
        console.error(`❌ Exam Administration fetch failed (${adminRes.status}):`, json);
      }
    } else {
      console.error(`❌ Login Failed (${loginRes.status}):`, loginJson);
    }

    // 4. Test Unauthorized Access
    console.log('\n--- Test 4: Unauthorized Access ---');
    const unauthRes = await fetch(`${BASE_URL}/attendance`);
    if (unauthRes.status === 401) {
      console.log('✅ Unauthorized block working (401)');
    } else {
      console.error(`❌ Unauthorized block failed! Got status: ${unauthRes.status}`);
    }

  } catch (err) {
    console.error('💥 Test Execution Error:', err);
  }
}

test();
