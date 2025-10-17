const axios = require('axios');

// Configuration
const BASE_URL = 'https://beatrice-backend.onrender.com/api';
// Remplacez par votre token d'authentification
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testPaiementsSalairesAPI() {
  console.log('🧪 Test de l\'API des paiements de salaires...\n');

  try {
    // 1. Tester la récupération des paiements de l'employé ID 3
    console.log('1️⃣ Récupération des paiements de l\'employé ID 3...');
    const response = await api.get('/paiements-salaires/employe/3');
    
    if (response.data.success) {
      console.log('✅ Succès!');
      console.log(`📊 Nombre de paiements trouvés: ${response.data.paiements.length}`);
      
      response.data.paiements.forEach((paiement, index) => {
        console.log(`\n💰 Paiement ${index + 1}:`);
        console.log(`   - Période: ${paiement.periode_paiement}`);
        console.log(`   - Montant: ${paiement.montant} ${paiement.devise}`);
        console.log(`   - Statut: ${paiement.statut}`);
        console.log(`   - Date: ${paiement.date_paiement}`);
        console.log(`   - Type: ${paiement.type_paiement}`);
        console.log(`   - Méthode: ${paiement.methode_paiement}`);
      });
    } else {
      console.log('❌ Erreur:', response.data.message);
    }

    // 2. Tester les statistiques
    console.log('\n2️⃣ Récupération des statistiques...');
    const statsResponse = await api.get('/paiements-salaires/stats');
    
    if (statsResponse.data.success) {
      console.log('✅ Statistiques récupérées!');
      console.log('📈 Statistiques:', JSON.stringify(statsResponse.data.stats, null, 2));
    } else {
      console.log('❌ Erreur stats:', statsResponse.data.message);
    }

    // 3. Tester la récupération de tous les paiements
    console.log('\n3️⃣ Récupération de tous les paiements...');
    const allResponse = await api.get('/paiements-salaires');
    
    if (allResponse.data.success) {
      console.log('✅ Tous les paiements récupérés!');
      console.log(`📊 Total: ${allResponse.data.pagination.total} paiements`);
      console.log(`📄 Page: ${allResponse.data.pagination.page}/${allResponse.data.pagination.pages}`);
    } else {
      console.log('❌ Erreur tous paiements:', allResponse.data.message);
    }

    // 4. Tester les filtres
    console.log('\n4️⃣ Test des filtres (statut = Payé)...');
    const filteredResponse = await api.get('/paiements-salaires?statut=Payé&employe_id=3');
    
    if (filteredResponse.data.success) {
      console.log('✅ Filtres appliqués!');
      console.log(`📊 Paiements payés trouvés: ${filteredResponse.data.paiements.length}`);
    } else {
      console.log('❌ Erreur filtres:', filteredResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Problème d\'authentification. Veuillez:');
      console.log('1. Obtenir un token d\'authentification valide');
      console.log('2. Remplacer YOUR_AUTH_TOKEN_HERE dans le script');
      console.log('3. Relancer le test');
    }
  }
}

// Fonction pour tester la création d'un paiement (nécessite des permissions)
async function testCreatePaiement() {
  console.log('\n5️⃣ Test de création d\'un paiement...');
  
  const nouveauPaiement = {
    employe_id: 3,
    nom_employe: 'Dupont',
    prenom_employe: 'Jean',
    email_employe: 'jean.dupont@example.com',
    montant: 1000.00,
    devise: 'USD',
    type_paiement: 'Salaire',
    periode_paiement: '2025-02',
    date_paiement: '2025-02-25',
    description: 'Salaire du mois de février 2025 - Test API',
    statut: 'En attente',
    methode_paiement: 'Virement bancaire'
  };

  try {
    const response = await api.post('/paiements-salaires', nouveauPaiement);
    
    if (response.data.success) {
      console.log('✅ Paiement créé avec succès!');
      console.log('📄 Détails:', JSON.stringify(response.data.paiement, null, 2));
    } else {
      console.log('❌ Erreur création:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Erreur création paiement:', error.response?.data?.message || error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  await testPaiementsSalairesAPI();
  await testCreatePaiement();
  
  console.log('\n🏁 Tests terminés!');
  console.log('\n📝 Instructions:');
  console.log('1. Exécutez d\'abord le script SQL create_demo_employee_and_payments.sql');
  console.log('2. Remplacez YOUR_AUTH_TOKEN_HERE par un token valide');
  console.log('3. Relancez ce script pour tester l\'API');
}

runAllTests();
