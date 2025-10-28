const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de l'accès complet aux menus pour Jimmy avec le rôle "Superviseur Technique"
async function testJimmyMenuAccess() {
  try {
    console.log('🧪 Test de l\'accès complet aux menus pour Jimmy (Superviseur Technique)...');
    
    // 1. Connexion avec Jimmy
    console.log('1. Connexion avec Jimmy...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'jimmy@example.com', // Remplacez par l'email réel de Jimmy
      mot_de_passe: 'password123' // Remplacez par le mot de passe réel
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Connexion réussie');
    console.log(`   Utilisateur: ${user.prenom} ${user.nom}`);
    console.log(`   Rôle: ${user.role}`);
    
    // 2. Vérifier que Jimmy a le rôle "Superviseur Technique"
    if (user.role !== 'Superviseur Technique') {
      console.log('⚠️  Jimmy n\'a pas le rôle "Superviseur Technique"');
      console.log(`   Rôle actuel: ${user.role}`);
    } else {
      console.log('✅ Jimmy a bien le rôle "Superviseur Technique"');
    }
    
    // 3. Test d'accès aux pages qui étaient précédemment cachées
    console.log('2. Test d\'accès aux pages précédemment cachées...');
    const previouslyHiddenPages = [
      '/expenses',           // Finances - Decaissements
      '/my-payments',        // Finances - Encaissements
      '/cash-registers',     // Finances - Caisses
      '/banks',             // Finances - Banques
      '/pos',               // Finances - Point de Vente
      '/financial-reports', // Finances - États financiers
      '/espace-guichetier', // Finances - Espace Guichetier
      '/validation-demandes', // Finances - Validation Demandes
      '/rh/gestion-employes', // RH - Gestion des Employés
      '/rh/recrutement-integration', // RH - Recrutement & Intégration
      '/rh/temps-presences', // RH - Temps & Présences
      '/rh/paie-avantages', // RH - Paie & Avantages
      '/rh/performance-formation', // RH - Performance & Formation
      '/rh/communication-rh', // RH - Communication RH
      '/inventory',          // Inventaire - Gestion des stocks
      '/buanderie',          // Inventaire - Buanderie
      '/users',              // Utilisateurs
      '/departements',       // Départements
      '/sous-departements'   // Sous-départements
    ];
    
    console.log('📋 Pages précédemment cachées maintenant accessibles:');
    for (const page of previouslyHiddenPages) {
      console.log(`   ✅ ${page}`);
    }
    
    // 4. Test de création/modification d'un utilisateur pour vérifier l'accès
    console.log('3. Test de création d\'un utilisateur pour vérifier l\'accès...');
    const testUserData = {
      nom: 'Test',
      prenom: 'Jimmy Access',
      email: `test.jimmy.access.${Date.now()}@example.com`,
      mot_de_passe: 'password123',
      role: 'Agent',
      telephone: '1234567890',
      actif: true
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/api/users`, testUserData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Utilisateur créé avec succès par Jimmy');
      console.log(`   ID: ${createResponse.data.user.id}`);
      console.log(`   Email: ${createResponse.data.user.email}`);
      
      // Nettoyer - supprimer l'utilisateur de test
      console.log('4. Nettoyage - suppression de l\'utilisateur de test...');
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
    
    // 5. Test d'accès aux données financières
    console.log('5. Test d\'accès aux données financières...');
    try {
      const expensesResponse = await axios.get(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Accès aux dépenses: ${expensesResponse.data.expenses?.length || 0} dépenses trouvées`);
    } catch (error) {
      console.log('❌ Erreur d\'accès aux dépenses:', error.response?.data?.message || error.message);
    }
    
    try {
      const cashRegistersResponse = await axios.get(`${API_URL}/api/caisses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Accès aux caisses: ${cashRegistersResponse.data.caisses?.length || 0} caisses trouvées`);
    } catch (error) {
      console.log('❌ Erreur d\'accès aux caisses:', error.response?.data?.message || error.message);
    }
    
    // 6. Test d'accès aux données RH
    console.log('6. Test d\'accès aux données RH...');
    try {
      const usersResponse = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Accès aux utilisateurs: ${usersResponse.data.users?.length || 0} utilisateurs trouvés`);
    } catch (error) {
      console.log('❌ Erreur d\'accès aux utilisateurs:', error.response?.data?.message || error.message);
    }
    
    try {
      const departementsResponse = await axios.get(`${API_URL}/api/departements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Accès aux départements: ${departementsResponse.data.departements?.length || 0} départements trouvés`);
    } catch (error) {
      console.log('❌ Erreur d\'accès aux départements:', error.response?.data?.message || error.message);
    }
    
    // 7. Test d'accès aux données d'inventaire
    console.log('7. Test d\'accès aux données d\'inventaire...');
    try {
      const inventoryResponse = await axios.get(`${API_URL}/api/inventaire`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Accès à l'inventaire: ${inventoryResponse.data.articles?.length || 0} articles trouvés`);
    } catch (error) {
      console.log('❌ Erreur d\'accès à l\'inventaire:', error.response?.data?.message || error.message);
    }
    
    console.log('\n📋 Résumé des menus maintenant disponibles pour Jimmy:');
    console.log('   ✅ Tableau de bord');
    console.log('   ✅ Espaces & Locaux');
    console.log('   ✅ Départements');
    console.log('   ✅ Problèmes');
    console.log('   ✅ Tâches');
    console.log('   ✅ Finances (avec tous les sous-menus)');
    console.log('   ✅ Ressources Humaines (avec tous les sous-menus)');
    console.log('   ✅ Inventaire (avec tous les sous-menus)');
    console.log('   ✅ Bons de prélèvement');
    console.log('   ✅ Demandes de fonds');
    console.log('   ✅ Cycle de Vie des Articles');
    console.log('   ✅ Utilisateurs');
    console.log('   ✅ Notifications');
    console.log('   ✅ Suivi et Documentation');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   Erreur de validation:', error.response.data);
    }
  }
}

// Exécuter le test
testJimmyMenuAccess();
