const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de filtrage des utilisateurs par rôle "Superviseur Technique"
async function testUserRoleFiltering() {
  try {
    console.log('🧪 Test de filtrage des utilisateurs par rôle "Superviseur Technique"...');
    
    // 1. Connexion avec un utilisateur admin
    console.log('1. Connexion...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@example.com', // Remplacez par un email admin valide
      mot_de_passe: 'password123' // Remplacez par le mot de passe valide
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    // 2. Test de récupération de tous les utilisateurs
    console.log('2. Test de récupération de tous les utilisateurs...');
    const allUsersResponse = await axios.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${allUsersResponse.data.users.length} utilisateurs récupérés`);
    
    // 3. Test de filtrage par "Superviseur Technique"
    console.log('3. Test de filtrage par "Superviseur Technique"...');
    const filteredResponse = await axios.get(`${API_URL}/api/users?role=Superviseur Technique`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${filteredResponse.data.users.length} utilisateurs avec le rôle "Superviseur Technique" trouvés`);
    
    if (filteredResponse.data.users.length > 0) {
      console.log('📋 Utilisateurs trouvés:');
      filteredResponse.data.users.forEach(user => {
        console.log(`   - ${user.prenom} ${user.nom} (${user.email}) - Rôle: ${user.role}`);
      });
    } else {
      console.log('ℹ️  Aucun utilisateur avec le rôle "Superviseur Technique" trouvé');
    }
    
    // 4. Test de filtrage par d'autres rôles pour vérifier la cohérence
    console.log('4. Test de filtrage par d\'autres rôles...');
    const testRoles = ['Agent', 'Superviseur', 'Administrateur', 'Agent Chambre', 'Superviseur Resto'];
    
    for (const role of testRoles) {
      try {
        const roleResponse = await axios.get(`${API_URL}/api/users?role=${encodeURIComponent(role)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Filtrage par "${role}": ${roleResponse.data.users.length} utilisateurs`);
      } catch (error) {
        console.log(`❌ Erreur pour le rôle "${role}":`, error.response?.data?.message || error.message);
      }
    }
    
    // 5. Test de création d'un utilisateur avec le rôle "Superviseur Technique"
    console.log('5. Test de création d\'un utilisateur avec le rôle "Superviseur Technique"...');
    const testUserData = {
      nom: 'Test',
      prenom: 'Superviseur Technique',
      email: `test.superviseur.technique.${Date.now()}@example.com`,
      mot_de_passe: 'password123',
      role: 'Superviseur Technique',
      telephone: '1234567890',
      actif: true
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/api/users`, testUserData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Utilisateur "Superviseur Technique" créé avec succès');
      console.log(`   ID: ${createResponse.data.user.id}`);
      console.log(`   Email: ${createResponse.data.user.email}`);
      
      // Nettoyer - supprimer l'utilisateur de test
      console.log('6. Nettoyage - suppression de l\'utilisateur de test...');
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
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   Erreur de validation:', error.response.data);
    }
  }
}

// Exécuter le test
testUserRoleFiltering();
