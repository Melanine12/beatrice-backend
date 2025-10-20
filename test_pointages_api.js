const axios = require('axios');

async function testPointagesAPI() {
  const baseURL = 'https://beatrice-backend.onrender.com';
  
  console.log('🔍 Testing pointages API...\n');

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

    // Step 2: Test GET pointages
    console.log('\n2️⃣ Testing GET /api/pointages...');
    const getResponse = await axios.get(`${baseURL}/api/pointages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ GET pointages successful');
    console.log('   Status:', getResponse.status);
    console.log('   Data:', getResponse.data);

    // Step 3: Test GET pointages by month
    console.log('\n3️⃣ Testing GET /api/pointages/mois/2025/10...');
    const monthResponse = await axios.get(`${baseURL}/api/pointages/mois/2025/10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ GET pointages by month successful');
    console.log('   Status:', monthResponse.status);
    console.log('   Data:', monthResponse.data);

    // Step 4: Test POST pointages (create)
    console.log('\n4️⃣ Testing POST /api/pointages...');
    const postData = {
      employe_id: 1,
      date_pointage: '2025-10-18',
      present: true,
      type_pointage: 'Manuel',
      commentaires: 'Test pointage'
    };
    
    const postResponse = await axios.post(`${baseURL}/api/pointages`, postData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ POST pointages successful');
    console.log('   Status:', postResponse.status);
    console.log('   Data:', postResponse.data);

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

testPointagesAPI();
