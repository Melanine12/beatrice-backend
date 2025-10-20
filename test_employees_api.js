const axios = require('axios');

// URL de votre backend sur Render (remplacez par votre vraie URL)
const BASE_URL = 'https://beatrice-backend.onrender.com'; // Remplacez par votre URL

async function testEmployeesAPI() {
  try {
    console.log('🔍 Test de l\'API des employés...');
    console.log(`URL: ${BASE_URL}/api/employees`);
    
    // Test sans authentification d'abord
    try {
      const response = await axios.get(`${BASE_URL}/api/employees`, {
        timeout: 10000
      });
      
      console.log('✅ Réponse reçue:');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Erreur API:');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data);
      } else if (error.request) {
        console.log('❌ Pas de réponse du serveur');
        console.log('Erreur:', error.message);
      } else {
        console.log('❌ Erreur de configuration:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testEmployeesAPI();
