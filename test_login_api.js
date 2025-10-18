const axios = require('axios');

async function testLoginAPI() {
  const baseURL = 'http://localhost:3001'; // Assuming backend runs on port 3001
  
  console.log('🔍 Testing login API with existing users...\n');

  // Test with existing user credentials
  const testCredentials = [
    { email: 'admin@beatrice.com', password: 'password' },
    { email: 'test@admin.com', password: 'password' },
    { email: 'andy.kadima@beatricehotel.com', password: 'password' }
  ];

  for (const creds of testCredentials) {
    console.log(`\n📧 Testing login for: ${creds.email}`);
    
    try {
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: creds.email,
        mot_de_passe: creds.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login successful!');
      console.log(`   Status: ${response.status}`);
      console.log(`   User: ${response.data.user.prenom} ${response.data.user.nom}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Token: ${response.data.token ? 'Present' : 'Missing'}`);

    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed: ${error.response.status} - ${error.response.data.message || error.response.data.error}`);
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
  }

  // Test with non-existent user
  console.log('\n📧 Testing with non-existent user: eli@gmail.com');
  try {
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'eli@gmail.com',
      mot_de_passe: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    if (error.response) {
      console.log(`✅ Expected failure: ${error.response.status} - ${error.response.data.message || error.response.data.error}`);
    } else {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the backend server first with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testLoginAPI();
  }
  process.exit(0);
}

main();
