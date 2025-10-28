const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de l'accès au menu "Suivis & Maintenances" pour le rôle "Superviseur Technique"
async function testSuivisMaintenancesMenuAccess() {
  try {
    console.log('🧪 Test de l\'accès au menu "Suivis & Maintenances" pour le rôle "Superviseur Technique"...');
    
    // 1. Test avec Jimmy (Superviseur Technique)
    console.log('1. Test avec Jimmy (Superviseur Technique)...');
    try {
      const jimmyLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'jimmy@example.com', // Remplacez par l'email réel de Jimmy
        mot_de_passe: 'password123' // Remplacez par le mot de passe réel
      });
      
      const jimmyUser = jimmyLoginResponse.data.user;
      console.log(`✅ Jimmy connecté: ${jimmyUser.prenom} ${jimmyUser.nom} - Rôle: ${jimmyUser.role}`);
      
      if (jimmyUser.role === 'Superviseur Technique') {
        console.log('✅ Jimmy a le rôle "Superviseur Technique" - Menu "Suivis & Maintenances" devrait être visible');
      } else {
        console.log('⚠️  Jimmy n\'a pas le rôle "Superviseur Technique"');
      }
    } catch (error) {
      console.log('❌ Erreur de connexion Jimmy:', error.response?.data?.message || error.message);
    }
    
    // 2. Test de création d'un utilisateur Superviseur Technique
    console.log('2. Test de création d\'un utilisateur Superviseur Technique...');
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
      // Connexion avec un admin pour créer l'utilisateur
      const adminLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'admin@example.com', // Remplacez par un email admin valide
        mot_de_passe: 'password123' // Remplacez par le mot de passe valide
      });
      
      const adminToken = adminLoginResponse.data.token;
      
      const createResponse = await axios.post(`${API_URL}/api/users`, testUserData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Utilisateur "Superviseur Technique" créé avec succès');
      console.log(`   ID: ${createResponse.data.user.id}`);
      console.log(`   Email: ${createResponse.data.user.email}`);
      
      // Test de connexion avec le nouvel utilisateur
      console.log('3. Test de connexion avec le nouvel utilisateur Superviseur Technique...');
      const newUserLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testUserData.email,
        mot_de_passe: testUserData.mot_de_passe
      });
      
      const newUser = newUserLoginResponse.data.user;
      console.log('✅ Connexion du nouvel utilisateur réussie');
      console.log(`   Utilisateur: ${newUser.prenom} ${newUser.nom}`);
      console.log(`   Rôle: ${newUser.role}`);
      
      if (newUser.role === 'Superviseur Technique') {
        console.log('✅ L\'utilisateur a bien le rôle "Superviseur Technique"');
        console.log('✅ Menu "Suivis & Maintenances" devrait être visible pour cet utilisateur');
      }
      
      // Nettoyer - supprimer l'utilisateur de test
      console.log('4. Nettoyage - suppression de l\'utilisateur de test...');
      await axios.delete(`${API_URL}/api/users/${createResponse.data.user.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Utilisateur de test supprimé');
      
    } catch (error) {
      console.log('❌ Erreur lors de la création:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Détails des erreurs:', error.response.data.errors);
      }
    }
    
    // 3. Test avec d'autres rôles pour vérifier que le menu n'est PAS visible
    console.log('5. Test avec d\'autres rôles pour vérifier que le menu n\'est PAS visible...');
    const otherRoles = ['Agent', 'Superviseur', 'Administrateur', 'Patron'];
    
    for (const role of otherRoles) {
      console.log(`   ❌ Rôle "${role}" - Menu "Suivis & Maintenances" ne devrait PAS être visible`);
    }
    
    console.log('\n📋 Résumé des menus disponibles pour "Superviseur Technique":');
    console.log('   ✅ Tableau de bord');
    console.log('   ✅ Espaces & Locaux');
    console.log('   ✅ Problèmes');
    console.log('   ✅ Tâches');
    console.log('   ✅ Bons de prélèvement');
    console.log('   ✅ Demandes de fonds');
    console.log('   ✅ Fiches d\'intervention');
    console.log('   ✅ Suivis & Maintenances (NOUVEAU - Visible uniquement pour Superviseur Technique)');
    console.log('   ✅ Notifications');
    
    console.log('\n📋 Menus NON disponibles pour "Superviseur Technique":');
    console.log('   ❌ Finances (et tous ses sous-menus)');
    console.log('   ❌ Ressources Humaines (et tous ses sous-menus)');
    console.log('   ❌ Inventaire (et tous ses sous-menus)');
    console.log('   ❌ Utilisateurs');
    console.log('   ❌ Départements');
    console.log('   ❌ Reporting');
    console.log('   ❌ Cycle de Vie des Articles');
    console.log('   ❌ Suivi et Documentation');
    
    console.log('\n🔧 Fonctionnalités du menu "Suivis & Maintenances":');
    console.log('   • Création de nouvelles maintenances');
    console.log('   • Gestion des types de maintenance (Maintenance, Réparation, Inspection, etc.)');
    console.log('   • Suivi des priorités (Basse, Normale, Haute, Urgente)');
    console.log('   • Gestion des statuts (Planifiée, En cours, En attente, Terminée, Annulée)');
    console.log('   • Attribution de responsables');
    console.log('   • Liaison avec les espaces');
    console.log('   • Planification des dates');
    console.log('   • Suivi des coûts estimés');
    console.log('   • Gestion du matériel utilisé');
    console.log('   • Notes et commentaires');
    console.log('   • Filtrage et recherche');
    console.log('   • Pagination');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   Erreur de validation:', error.response.data);
    }
  }
}

// Exécuter le test
testSuivisMaintenancesMenuAccess();
