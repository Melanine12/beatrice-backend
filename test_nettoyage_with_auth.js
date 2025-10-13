const axios = require('axios');

const API_BASE_URL = 'https://beatrice-backend.onrender.com/api';

// Fonction pour obtenir un token d'authentification
async function getAuthToken() {
  try {
    console.log('🔐 Tentative de connexion...');
    
    // Essayer de se connecter avec des credentials de test
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@beatrice.com', // Remplacer par un email valide
      password: 'password123' // Remplacer par un mot de passe valide
    });
    
    console.log('✅ Connexion réussie');
    return loginResponse.data.token;
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    
    // Si la connexion échoue, essayer de créer un utilisateur de test
    try {
      console.log('🔄 Tentative de création d\'utilisateur de test...');
      
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        nom: 'Test',
        prenom: 'User',
        email: 'test@beatrice.com',
        password: 'password123',
        role: 'Agent'
      });
      
      console.log('✅ Utilisateur de test créé');
      return registerResponse.data.token;
      
    } catch (registerError) {
      console.error('❌ Impossible de créer un utilisateur de test:', registerError.response?.data || registerError.message);
      return null;
    }
  }
}

// Test avec authentification
async function testWithAuth() {
  const token = await getAuthToken();
  
  if (!token) {
    console.error('❌ Impossible d\'obtenir un token d\'authentification');
    return;
  }
  
  console.log('🔑 Token obtenu:', token.substring(0, 20) + '...');
  
  // Test des données de nettoyage
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
  
  try {
    console.log('\n🧹 Test de création de nettoyage avec authentification...');
    console.log('📤 Données:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Nettoyage créé avec succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    // Nettoyer - supprimer le test
    const nettoyageId = response.data.id;
    await axios.delete(`${API_BASE_URL}/nettoyage-espaces-publics/${nettoyageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('🧹 Test nettoyé');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      console.error('🔍 Erreurs de validation:');
      error.response.data.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.param}: ${err.msg}`);
      });
    }
  }
}

// Test sans authentification pour confirmer l'erreur 401
async function testWithoutAuth() {
  console.log('\n🔓 Test sans authentification (devrait échouer)...');
  
  try {
    await axios.post(`${API_BASE_URL}/nettoyage-espaces-publics`, {
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
    });
    
    console.log('❌ Le test sans auth a réussi (ne devrait pas)');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Erreur 401 attendue (pas d\'authentification)');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.status, error.response?.data);
    }
  }
}

async function runTests() {
  await testWithoutAuth();
  await testWithAuth();
}

runTests();
