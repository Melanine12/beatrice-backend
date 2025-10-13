const axios = require('axios');

const API_BASE_URL = 'https://beatrice-backend.onrender.com/api';

// Test avec des données correctement formatées
async function testCorrectData() {
  console.log('🧪 Test avec données correctement formatées\n');
  
  const correctData = {
    date_nettoyage: '2024-01-15',
    shift: 'Matin',
    agent_id: 1, // Entier, pas de chaîne
    nom_agent: 'Test Agent',
    superviseur_id: 2, // Entier, pas de chaîne
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
  
  try {
    console.log('📤 Données correctes:');
    console.log(JSON.stringify(correctData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, correctData);
    console.log('✅ Succès avec données correctes!');
    console.log('📊 ID créé:', response.data.id);
    
    // Nettoyer
    await axios.delete(`${API_BASE_URL}/nettoyage-espaces-publics/${response.data.id}`);
    console.log('🧹 Test nettoyé');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.response?.data || error.message);
  }
}

// Test avec des données incorrectes (IDs en chaînes vides)
async function testIncorrectData() {
  console.log('\n🧪 Test avec données incorrectes (IDs en chaînes vides)\n');
  
  const incorrectData = {
    date_nettoyage: '2024-01-15',
    shift: 'Matin',
    agent_id: '', // Chaîne vide - devrait échouer
    nom_agent: 'Test Agent',
    superviseur_id: '', // Chaîne vide - devrait échouer
    nom_superviseur: 'Test Superviseur',
    espaces_nettoyes: {},
    taches_effectuees: {},
    verification_finale: {},
    observations_generales: 'Test',
    statut: 'En cours'
  };
  
  try {
    console.log('📤 Données incorrectes:');
    console.log(JSON.stringify(incorrectData, null, 2));
    
    await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, incorrectData);
    console.log('❌ Le test a réussi (ne devrait pas)');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Erreur 400 attendue');
      console.log('📊 Erreurs:', error.response.data.errors);
      
      error.response.data.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.param}: ${err.msg} (valeur: "${err.value}")`);
      });
    } else {
      console.error('❌ Erreur inattendue:', error.response?.status, error.response?.data);
    }
  }
}

// Test avec des IDs null
async function testNullIds() {
  console.log('\n🧪 Test avec IDs null\n');
  
  const nullData = {
    date_nettoyage: '2024-01-15',
    shift: 'Matin',
    agent_id: null, // null - devrait échouer
    nom_agent: 'Test Agent',
    superviseur_id: null, // null - devrait échouer
    nom_superviseur: 'Test Superviseur',
    espaces_nettoyes: {},
    taches_effectuees: {},
    verification_finale: {},
    observations_generales: 'Test',
    statut: 'En cours'
  };
  
  try {
    console.log('📤 Données avec IDs null:');
    console.log(JSON.stringify(nullData, null, 2));
    
    await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, nullData);
    console.log('❌ Le test a réussi (ne devrait pas)');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Erreur 400 attendue');
      console.log('📊 Erreurs:', error.response.data.errors);
      
      error.response.data.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.param}: ${err.msg} (valeur: ${err.value})`);
      });
    } else {
      console.error('❌ Erreur inattendue:', error.response?.status, error.response?.data);
    }
  }
}

// Test avec des IDs en chaînes numériques
async function testStringIds() {
  console.log('\n🧪 Test avec IDs en chaînes numériques\n');
  
  const stringData = {
    date_nettoyage: '2024-01-15',
    shift: 'Matin',
    agent_id: '1', // Chaîne numérique - devrait fonctionner
    nom_agent: 'Test Agent',
    superviseur_id: '2', // Chaîne numérique - devrait fonctionner
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
  
  try {
    console.log('📤 Données avec IDs en chaînes numériques:');
    console.log(JSON.stringify(stringData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, stringData);
    console.log('✅ Succès avec IDs en chaînes numériques!');
    console.log('📊 ID créé:', response.data.id);
    
    // Nettoyer
    await axios.delete(`${API_BASE_URL}/nettoyage-espaces-publics/${response.data.id}`);
    console.log('🧹 Test nettoyé');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  await testCorrectData();
  await testIncorrectData();
  await testNullIds();
  await testStringIds();
}

runAllTests();
