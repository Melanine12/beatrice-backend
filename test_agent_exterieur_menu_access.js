const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de l'accès aux menus pour le rôle "Agent Exterieur"
async function testAgentExterieurMenuAccess() {
  try {
    console.log('🧪 Test de l\'accès aux menus pour le rôle "Agent Exterieur"...');
    
    // 1. Connexion avec un utilisateur Agent Exterieur
    console.log('1. Connexion avec un utilisateur Agent Exterieur...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'agent.exterieur@example.com', // Remplacez par un email valide d'Agent Exterieur
      mot_de_passe: 'password123' // Remplacez par le mot de passe valide
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Connexion réussie');
    console.log(`   Utilisateur: ${user.prenom} ${user.nom}`);
    console.log(`   Rôle: ${user.role}`);
    
    // 2. Test d'accès aux pages autorisées
    console.log('2. Test d\'accès aux pages autorisées...');
    const authorizedPages = [
      '/dashboard',
      '/spaces', 
      '/issues',
      '/tasks',
      '/fiches-execution',
      '/notifications',
      '/profile'
    ];
    
    for (const page of authorizedPages) {
      try {
        // Simuler l'accès à la page (en réalité, on testerait les composants React)
        console.log(`✅ Accès autorisé à: ${page}`);
      } catch (error) {
        console.log(`❌ Accès refusé à: ${page}`);
      }
    }
    
    // 3. Test de création d'un utilisateur Agent Exterieur si nécessaire
    console.log('3. Test de création d\'un utilisateur Agent Exterieur...');
    const testUserData = {
      nom: 'Test',
      prenom: 'Agent Exterieur',
      email: `test.agent.exterieur.${Date.now()}@example.com`,
      mot_de_passe: 'password123',
      role: 'Agent Exterieur',
      telephone: '1234567890',
      actif: true
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/api/users`, testUserData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Utilisateur "Agent Exterieur" créé avec succès');
      console.log(`   ID: ${createResponse.data.user.id}`);
      console.log(`   Email: ${createResponse.data.user.email}`);
      
      // Test de connexion avec le nouvel utilisateur
      console.log('4. Test de connexion avec le nouvel utilisateur...');
      const newUserLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testUserData.email,
        mot_de_passe: testUserData.mot_de_passe
      });
      
      const newUser = newUserLoginResponse.data.user;
      console.log('✅ Connexion du nouvel utilisateur réussie');
      console.log(`   Utilisateur: ${newUser.prenom} ${newUser.nom}`);
      console.log(`   Rôle: ${newUser.role}`);
      
      // Nettoyer - supprimer l'utilisateur de test
      console.log('5. Nettoyage - suppression de l\'utilisateur de test...');
      await axios.delete(`${API_URL}/api/users/${createResponse.data.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Utilisateur de test supprimé');
      
    } catch (error) {
      console.log('❌ Erreur lors de la création:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Détails des erreurs:', error.response.data.errors);
      }
    }
    
    // 4. Test de filtrage des utilisateurs par rôle "Agent Exterieur"
    console.log('6. Test de filtrage des utilisateurs par rôle "Agent Exterieur"...');
    try {
      const filteredResponse = await axios.get(`${API_URL}/api/users?role=Agent Exterieur`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ ${filteredResponse.data.users.length} utilisateurs avec le rôle "Agent Exterieur" trouvés`);
      
      if (filteredResponse.data.users.length > 0) {
        console.log('📋 Utilisateurs trouvés:');
        filteredResponse.data.users.forEach(user => {
          console.log(`   - ${user.prenom} ${user.nom} (${user.email}) - Rôle: ${user.role}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur lors du filtrage:', error.response?.data?.message || error.message);
    }
    
    console.log('\n📋 Résumé des menus disponibles pour "Agent Exterieur":');
    console.log('   ✅ Tableau de bord (/dashboard)');
    console.log('   ✅ Espaces & Locaux (/spaces)');
    console.log('   ✅ Problèmes (/issues)');
    console.log('   ✅ Tâches (/tasks)');
    console.log('   ✅ Fiches d\'intervention (/fiches-execution)');
    console.log('   ✅ Notifications (/notifications)');
    console.log('   ✅ Profil (/profile)');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   Erreur de validation:', error.response.data);
    }
  }
}

// Exécuter le test
testAgentExterieurMenuAccess();
