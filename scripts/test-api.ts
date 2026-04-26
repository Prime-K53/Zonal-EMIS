const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('Starting API integration testing...');

  try {
    console.log('\n--- Test 1: Signup ---');
    const signupData = {
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test Tester',
    };

    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    });

    const signupJson = await signupRes.json();
    if (signupRes.status === 201) {
      console.log('Signup successful (201)');
    } else {
      console.error(`Signup failed (${signupRes.status}):`, signupJson);
    }

    console.log('\n--- Test 2: Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupData.email,
        password: signupData.password,
      }),
    });

    const loginJson = await loginRes.json();
    if (loginRes.status === 200) {
      console.log('Login successful (200)');
      const token = loginJson.access_token;
      const cookie = loginRes.headers.get('set-cookie') || '';

      console.log('\n--- Test 2.1: Current User Session ---');
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Cookie: cookie,
        },
      });
      if (meRes.status === 200) {
        console.log('auth/me successful with session cookie');
      } else {
        console.error(`auth/me failed (${meRes.status}):`, await meRes.json());
      }

      console.log('\n--- Test 3: Protected Route (Attendance) ---');
      const attendanceRes = await fetch(`${BASE_URL}/attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const attendanceJson = await attendanceRes.json();
      if (attendanceRes.status === 200) {
        console.log('Protected attendance access successful');
      } else {
        console.error(`Protected attendance access failed (${attendanceRes.status}):`, attendanceJson);
      }

      console.log('\n--- Test 3.1: Teachers ---');
      const teachersRes = await fetch(`${BASE_URL}/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (teachersRes.status === 200) {
        console.log('Teachers fetch successful');
      } else {
        console.error(`Teachers fetch failed (${teachersRes.status})`);
      }

      console.log('\n--- Test 3.2: Examination Results ---');
      const examRes = await fetch(`${BASE_URL}/emis/examination-results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (examRes.status === 200) {
        console.log('Examination results fetch successful');
      } else {
        console.error(`Examination results fetch failed (${examRes.status})`);
      }

      console.log('\n--- Test 3.3: Exam Administration ---');
      const adminRes = await fetch(`${BASE_URL}/emis/exam-administration`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (adminRes.status === 200) {
        console.log('Exam administration fetch successful');
      } else {
        const json = await adminRes.json();
        console.error(`Exam administration fetch failed (${adminRes.status}):`, json);
      }

      console.log('\n--- Test 3.4: All Data Summary ---');
      const allDataRes = await fetch(`${BASE_URL}/emis/all-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (allDataRes.status === 200) {
        const allData = await allDataRes.json();
        console.log('All data summary fetch successful');
        console.log(`Loaded: ${allData.schools?.length || 0} schools, ${allData.teachers?.length || 0} teachers`);
      } else {
        const json = await allDataRes.json().catch(() => ({}));
        console.error(`All data summary fetch failed (${allDataRes.status}):`, json);
      }
    } else {
      console.error(`Login failed (${loginRes.status}):`, loginJson);
    }

    console.log('\n--- Test 4: Unauthorized Access ---');
    const unauthRes = await fetch(`${BASE_URL}/attendance`);
    if (unauthRes.status === 401) {
      console.log('Unauthorized block working (401)');
    } else {
      console.error(`Unauthorized block failed. Got status: ${unauthRes.status}`);
    }
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

test();
