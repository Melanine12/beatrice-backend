const axios = require('axios');

async function testFixedPaymentsAPI() {
  const baseURL = 'https://beatrice-backend.onrender.com';
  
  console.log('🔍 Testing fixed payments API with tbl_employes...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@beatrice.com',
      mot_de_passe: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Test with employee ID 3 (from tbl_employes)
    console.log('\n2️⃣ Testing with employee ID 3 from tbl_employes...');
    
    const paymentsResponse = await axios.get(`${baseURL}/api/paiements-salaires/employe/3?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employee 3 payments API call successful');
    console.log('   Status:', paymentsResponse.status);
    console.log('   Response data:', JSON.stringify(paymentsResponse.data, null, 2));

    // Step 3: Test with employee ID 1 (from tbl_employes)
    console.log('\n3️⃣ Testing with employee ID 1 from tbl_employes...');
    
    const paymentsResponse1 = await axios.get(`${baseURL}/api/paiements-salaires/employe/1?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employee 1 payments API call successful');
    console.log('   Status:', paymentsResponse1.status);
    console.log('   Response data:', JSON.stringify(paymentsResponse1.data, null, 2));

    // Step 4: Test general payments endpoint
    console.log('\n4️⃣ Testing general payments endpoint...');
    
    const generalPaymentsResponse = await axios.get(`${baseURL}/api/paiements-salaires?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ General payments API call successful');
    console.log('   Status:', generalPaymentsResponse.status);
    console.log('   Response data:', JSON.stringify(generalPaymentsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error during testing:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
      console.error('   Message:', error.response.data?.message || error.response.data?.error);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Network error:', error.message);
    }
  }
}

testFixedPaymentsAPI();
