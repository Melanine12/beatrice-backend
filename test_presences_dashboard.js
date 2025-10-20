const axios = require('axios');

// URL de votre backend sur Render
const BASE_URL = 'https://beatrice-backend.onrender.com'; // Remplacez par votre URL

async function testPresencesDashboard() {
  try {
    console.log('🔍 Test du dashboard des présences...\n');
    
    // Step 1: Login
    console.log('1️⃣ Connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@beatrice.com',
      mot_de_passe: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    console.log('   Token length:', token.length);

    // Step 2: Test des statistiques du dashboard
    console.log('\n2️⃣ Test des statistiques du dashboard...');
    const statsResponse = await axios.get(`${BASE_URL}/api/presences-dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Statistiques récupérées:');
    console.log('   Status:', statsResponse.status);
    console.log('   Données:', JSON.stringify(statsResponse.data, null, 2));

    // Step 3: Test de la liste des employés
    console.log('\n3️⃣ Test de la liste des employés...');
    const employesResponse = await axios.get(`${BASE_URL}/api/presences-dashboard/employes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Employés récupérés:');
    console.log('   Status:', employesResponse.status);
    console.log('   Nombre d\'employés:', employesResponse.data.count);
    console.log('   Premiers employés:', employesResponse.data.data.slice(0, 3).map(emp => 
      `${emp.prenoms} ${emp.nom_famille} (${emp.poste})`
    ));

    // Step 4: Test des pointages d'un employé
    if (employesResponse.data.data.length > 0) {
      const premierEmploye = employesResponse.data.data[0];
      console.log(`\n4️⃣ Test des pointages de ${premierEmploye.prenoms} ${premierEmploye.nom_famille}...`);
      
      const pointagesResponse = await axios.get(`${BASE_URL}/api/presences-dashboard/pointages/${premierEmploye.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });
      
      console.log('✅ Pointages récupérés:');
      console.log('   Status:', pointagesResponse.status);
      console.log('   Nombre de pointages:', pointagesResponse.data.count);
    }

    console.log('\n🎉 Tous les tests sont passés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

testPresencesDashboard();
