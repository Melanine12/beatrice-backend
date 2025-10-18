const axios = require('axios');

async function testPaymentsAPI() {
  const baseURL = 'https://beatrice-backend.onrender.com';
  
  console.log('🔍 Testing payments API with Render server...\n');

  try {
    // Step 1: Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Step 2: Test CORS endpoint
    console.log('\n2️⃣ Testing CORS configuration...');
    const corsResponse = await axios.get(`${baseURL}/api/cors-test`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ CORS test passed:', corsResponse.data.message);
    console.log('   CORS config:', corsResponse.data.cors);

    // Step 3: Login to get token
    console.log('\n3️⃣ Testing login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@beatrice.com',
      mot_de_passe: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.user.prenom, loginResponse.data.user.nom);
    console.log('   Token length:', token.length);

    // Step 4: Test payments endpoint with token
    console.log('\n4️⃣ Testing payments endpoint...');
    const paymentsResponse = await axios.get(`${baseURL}/api/paiements-salaires?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Payments endpoint accessible');
    console.log('   Status:', paymentsResponse.status);
    console.log('   Data:', paymentsResponse.data);

    // Step 5: Test specific employee payments
    console.log('\n5️⃣ Testing employee-specific payments...');
    const employeePaymentsResponse = await axios.get(`${baseURL}/api/paiements-salaires/employe/2?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employee payments endpoint accessible');
    console.log('   Status:', employeePaymentsResponse.status);
    console.log('   Data:', employeePaymentsResponse.data);

  } catch (error) {
    console.error('❌ Error during testing:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.data?.error);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Network error:', error.message);
    }
  }
}

testPaymentsAPI();
