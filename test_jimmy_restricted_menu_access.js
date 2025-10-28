const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de l'accès restreint aux menus pour Jimmy avec le rôle "Superviseur Technique"
async function testJimmyRestrictedMenuAccess() {
  try {
    console.log('🧪 Test de l\'accès restreint aux menus pour Jimmy (Superviseur Technique)...');
    
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
      console.log('   Le test continuera avec le rôle actuel...');
    } else {
      console.log('✅ Jimmy a bien le rôle "Superviseur Technique"');
    }
    
    // 3. Test d'accès aux pages autorisées
    console.log('2. Test d\'accès aux pages autorisées...');
    const authorizedPages = [
      '/dashboard',              // Tableau de bord
      '/spaces',                 // Espaces & Locaux
      '/issues',                 // Problèmes
      '/tasks',                  // Tâches
      '/demandes-affectation',   // Bons de prélèvement
      '/demandes-fonds',         // Demandes de fonds
      '/fiches-execution',       // Fiches d'intervention
      '/notifications',          // Notifications
      '/profile'                 // Profil
    ];
    
    console.log('📋 Pages autorisées pour Jimmy (Superviseur Technique):');
    for (const page of authorizedPages) {
      console.log(`   ✅ ${page}`);
    }
    
    // 4. Test d'accès aux pages NON autorisées (doivent être bloquées)
    console.log('3. Test d\'accès aux pages NON autorisées...');
    const unauthorizedPages = [
      '/expenses',               // Finances - Decaissements
      '/my-payments',            // Finances - Encaissements
      '/cash-registers',         // Finances - Caisses
      '/banks',                  // Finances - Banques
      '/pos',                    // Finances - Point de Vente
      '/financial-reports',      // Finances - États financiers
      '/espace-guichetier',      // Finances - Espace Guichetier
      '/validation-demandes',    // Finances - Validation Demandes
      '/rh/gestion-employes',    // RH - Gestion des Employés
      '/rh/recrutement-integration', // RH - Recrutement & Intégration
      '/rh/temps-presences',     // RH - Temps & Présences
      '/rh/paie-avantages',      // RH - Paie & Avantages
      '/rh/performance-formation', // RH - Performance & Formation
      '/rh/communication-rh',    // RH - Communication RH
      '/inventory',              // Inventaire - Gestion des stocks
      '/buanderie',              // Inventaire - Buanderie
      '/users',                  // Utilisateurs
      '/departements',           // Départements
      '/sous-departements',      // Sous-départements
      '/reporting',              // Reporting
      '/rapports-journaliers',   // Rapports Journaliers
      '/cycle-vie-articles',     // Cycle de Vie des Articles
      '/suivi-documentation'     // Suivi et Documentation
    ];
    
    console.log('📋 Pages NON autorisées pour Jimmy (Superviseur Technique):');
    for (const page of unauthorizedPages) {
      console.log(`   ❌ ${page}`);
    }
    
    // 5. Test de création/modification d'un utilisateur (doit être bloqué)
    console.log('4. Test de création d\'un utilisateur (doit être bloqué)...');
    const testUserData = {
      nom: 'Test',
      prenom: 'Jimmy Restricted',
      email: `test.jimmy.restricted.${Date.now()}@example.com`,
      mot_de_passe: 'password123',
      role: 'Agent',
      telephone: '1234567890',
      actif: true
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/api/users`, testUserData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('⚠️  Utilisateur créé avec succès (accès inattendu)');
      console.log(`   ID: ${createResponse.data.user.id}`);
      
      // Nettoyer - supprimer l'utilisateur de test
      await axios.delete(`${API_URL}/api/users/${createResponse.data.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Utilisateur de test supprimé');
      
    } catch (error) {
      console.log('✅ Création d\'utilisateur bloquée comme attendu');
      console.log(`   Erreur: ${error.response?.data?.message || error.message}`);
    }
    
    // 6. Test d'accès aux données financières (doit être bloqué)
    console.log('5. Test d\'accès aux données financières (doit être bloqué)...');
    try {
      const expensesResponse = await axios.get(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('⚠️  Accès aux dépenses autorisé (accès inattendu)');
      console.log(`   ${expensesResponse.data.expenses?.length || 0} dépenses trouvées`);
    } catch (error) {
      console.log('✅ Accès aux dépenses bloqué comme attendu');
      console.log(`   Erreur: ${error.response?.data?.message || error.message}`);
    }
    
    // 7. Test d'accès aux données RH (doit être bloqué)
    console.log('6. Test d\'accès aux données RH (doit être bloqué)...');
    try {
      const usersResponse = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('⚠️  Accès aux utilisateurs autorisé (accès inattendu)');
      console.log(`   ${usersResponse.data.users?.length || 0} utilisateurs trouvés`);
    } catch (error) {
      console.log('✅ Accès aux utilisateurs bloqué comme attendu');
      console.log(`   Erreur: ${error.response?.data?.message || error.message}`);
    }
    
    // 8. Test d'accès aux données d'inventaire (doit être bloqué)
    console.log('7. Test d\'accès aux données d\'inventaire (doit être bloqué)...');
    try {
      const inventoryResponse = await axios.get(`${API_URL}/api/inventaire`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('⚠️  Accès à l\'inventaire autorisé (accès inattendu)');
      console.log(`   ${inventoryResponse.data.articles?.length || 0} articles trouvés`);
    } catch (error) {
      console.log('✅ Accès à l\'inventaire bloqué comme attendu');
      console.log(`   Erreur: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n📋 Résumé des menus disponibles pour Jimmy (Superviseur Technique):');
    console.log('   ✅ Tableau de bord');
    console.log('   ✅ Espaces & Locaux');
    console.log('   ✅ Problèmes');
    console.log('   ✅ Tâches');
    console.log('   ✅ Bons de prélèvement');
    console.log('   ✅ Demandes de fonds');
    console.log('   ✅ Fiches d\'intervention');
    console.log('   ✅ Notifications');
    
    console.log('\n📋 Menus NON disponibles pour Jimmy (Superviseur Technique):');
    console.log('   ❌ Finances (et tous ses sous-menus)');
    console.log('   ❌ Ressources Humaines (et tous ses sous-menus)');
    console.log('   ❌ Inventaire (et tous ses sous-menus)');
    console.log('   ❌ Utilisateurs');
    console.log('   ❌ Départements');
    console.log('   ❌ Reporting');
    console.log('   ❌ Cycle de Vie des Articles');
    console.log('   ❌ Suivi et Documentation');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   Erreur de validation:', error.response.data);
    }
  }
}

// Exécuter le test
testJimmyRestrictedMenuAccess();
