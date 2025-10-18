const axios = require('axios');

async function testFrontendPaymentsFlow() {
  const baseURL = 'https://beatrice-backend.onrender.com';
  
  console.log('🔍 Testing frontend payments flow...\n');

  try {
    // Step 1: Login (simulate frontend login)
    console.log('1️⃣ Simulating frontend login...');
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
    const user = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log('   User:', user.prenom, user.nom);
    console.log('   Role:', user.role);
    console.log('   Token length:', token.length);

    // Step 2: Test the exact API call that PaiementsSalairesModal makes
    console.log('\n2️⃣ Testing PaiementsSalairesModal API call...');
    
    // This simulates: paiementsAPI.getByEmploye(employe.id, { page: 1, limit: 10 })
    const employeId = user.id; // Use the logged-in user's ID
    const params = {
      page: 1,
      limit: 10
    };
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const paymentsUrl = `${baseURL}/api/paiements-salaires/employe/${employeId}?${queryParams}`;
    console.log('   URL:', paymentsUrl);
    
    const paymentsResponse = await axios.get(paymentsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employee payments API call successful');
    console.log('   Status:', paymentsResponse.status);
    console.log('   Response data:', JSON.stringify(paymentsResponse.data, null, 2));

    // Step 3: Test with a different employee ID (like employee ID 3 that has payments)
    console.log('\n3️⃣ Testing with employee ID 3 (who has payments)...');
    
    const paymentsUrl3 = `${baseURL}/api/paiements-salaires/employe/3?${queryParams}`;
    console.log('   URL:', paymentsUrl3);
    
    const paymentsResponse3 = await axios.get(paymentsUrl3, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employee 3 payments API call successful');
    console.log('   Status:', paymentsResponse3.status);
    console.log('   Response data:', JSON.stringify(paymentsResponse3.data, null, 2));

    // Step 4: Test the general payments endpoint
    console.log('\n4️⃣ Testing general payments endpoint...');
    
    const generalPaymentsUrl = `${baseURL}/api/paiements-salaires?${queryParams}`;
    console.log('   URL:', generalPaymentsUrl);
    
    const generalPaymentsResponse = await axios.get(generalPaymentsUrl, {
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
    console.error('❌ Error during frontend simulation:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
      console.error('   Headers:', error.config?.headers);
      console.error('   Message:', error.response.data?.message || error.response.data?.error);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Network error:', error.message);
    }
  }
}

testFrontendPaymentsFlow();
