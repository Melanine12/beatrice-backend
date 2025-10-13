const axios = require('axios');

const API_BASE_URL = 'https://beatrice-backend.onrender.com/api';

// Test avec des données minimales pour identifier le problème
const testData = {
  date_nettoyage: '2024-01-15',
  shift: 'Matin',
  agent_id: 1,
  nom_agent: 'Test Agent',
  superviseur_id: 2,
  nom_superviseur: 'Test Superviseur',
  espaces_nettoyes: {
    hall_principal: {
      nettoye: true,
      heure_debut: '08:00',
      heure_fin: '09:00',
      remarques: 'Test'
    }
  },
  taches_effectuees: {
    balayage: {
      terminee: true,
      remarques: 'Test'
    }
  },
  verification_finale: {
    qualite_nettoyage: {
      oui: true,
      non: false,
      commentaires: 'Test'
    }
  },
  observations_generales: 'Test',
  statut: 'En cours'
};

async function testAPI() {
  console.log('🔍 Test de l\'API Nettoyage avec données minimales\n');
  
  try {
    console.log('📤 Données envoyées:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n🚀 Envoi de la requête...');
    
    const response = await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, testData);
    
    console.log('✅ Succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur détectée:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.errors) {
      console.error('\n🔍 Erreurs de validation détaillées:');
      error.response.data.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. Champ: ${err.param}`);
        console.error(`     Message: ${err.msg}`);
        console.error(`     Valeur: ${JSON.stringify(err.value)}`);
        console.error(`     Localisation: ${err.location}`);
        console.error('');
      });
    }
  }
}

// Test avec des données encore plus minimales
async function testMinimalData() {
  console.log('\n🔍 Test avec données ultra-minimales\n');
  
  const minimalData = {
    date_nettoyage: '2024-01-15',
    shift: 'Matin',
    agent_id: 1,
    nom_agent: 'Test',
    superviseur_id: 2,
    nom_superviseur: 'Test',
    espaces_nettoyes: {},
    taches_effectuees: {},
    verification_finale: {},
    statut: 'En cours'
  };
  
  try {
    console.log('📤 Données minimales:');
    console.log(JSON.stringify(minimalData, null, 2));
    console.log('\n🚀 Envoi de la requête...');
    
    const response = await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, minimalData);
    
    console.log('✅ Succès avec données minimales!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur avec données minimales:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.errors) {
      console.error('\n🔍 Erreurs de validation:');
      error.response.data.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.param}: ${err.msg}`);
      });
    }
  }
}

async function runAllTests() {
  await testAPI();
  await testMinimalData();
}

runAllTests();
