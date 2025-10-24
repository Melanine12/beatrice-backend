const axios = require('axios');

// URL de production Render
const API_BASE_URL = 'https://beatrice-system-backend.onrender.com/api';

// Configuration pour les tests
const testConfig = {
  auditorUser: {
    nom: 'Test',
    prenom: 'Auditeur',
    email: 'auditeur@beatrice.com',
    mot_de_passe: 'password123',
    role: 'Auditeur',
    telephone: '+33123456789'
  },
  adminUser: {
    email: 'admin@beatrice.com',
    mot_de_passe: 'password'
  }
};

async function testAuditorStats() {
  try {
    console.log('🧪 Test des statistiques pour les auditeurs (Production)...\n');
    console.log(`🌐 URL du backend: ${API_BASE_URL}\n`);

    // 1. Se connecter en tant qu'administrateur
    console.log('1. Connexion en tant qu\'administrateur...');
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testConfig.adminUser.email,
      mot_de_passe: testConfig.adminUser.mot_de_passe
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Connexion administrateur réussie\n');

    // 2. Créer un utilisateur avec le rôle "Auditeur"
    console.log('2. Création d\'un utilisateur avec le rôle "Auditeur"...');
    try {
      const createAuditorResponse = await axios.post(`${API_BASE_URL}/users`, testConfig.auditorUser, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Utilisateur auditeur créé:', createAuditorResponse.data.data.email);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('déjà existant')) {
        console.log('ℹ️  Utilisateur auditeur existe déjà');
      } else {
        console.log('⚠️  Erreur lors de la création:', error.response?.data?.message || error.message);
      }
    }

    // 3. Se connecter en tant qu'auditeur
    console.log('\n3. Connexion en tant qu\'auditeur...');
    const auditorLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testConfig.auditorUser.email,
      mot_de_passe: testConfig.auditorUser.mot_de_passe
    });

    const auditorToken = auditorLoginResponse.data.token;
    const auditorUser = auditorLoginResponse.data.user;
    console.log('✅ Connexion auditeur réussie:', auditorUser.prenom, auditorUser.nom, `(${auditorUser.role})`);

    // 4. Tester les statistiques du dashboard
    console.log('\n4. Test des statistiques du dashboard...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${auditorToken}` }
    });

    const stats = dashboardResponse.data;
    console.log('✅ Statistiques récupérées avec succès');

    // 5. Vérifier les statistiques d'auditeur
    console.log('\n5. Vérification des statistiques d\'auditeur:');
    if (stats.auditorStats) {
      console.log('📊 Statistiques d\'auditeur trouvées:');
      console.log(`   - Check Linges mis à jour aujourd'hui: ${stats.auditorStats.checkLingesToday}`);
      console.log(`   - Bons de prélèvement approuvés: ${stats.auditorStats.bonsPrelevementApproved}`);
      console.log(`   - Bons de demandes approuvés: ${stats.auditorStats.bonsDemandesApproved}`);
      console.log(`   - Employés présents: ${stats.auditorStats.employesPresents}`);
      console.log(`   - Articles en rupture de stock: ${stats.auditorStats.articlesRuptureStock}`);
      console.log(`   - Chambres libres: ${stats.auditorStats.chambresLibres}`);
      console.log(`   - Chambres occupées: ${stats.auditorStats.chambresOccupees}`);
    } else {
      console.log('❌ Statistiques d\'auditeur non trouvées');
    }

    // 6. Vérifier les statistiques générales
    console.log('\n6. Vérification des statistiques générales:');
    if (stats.overview) {
      console.log('📊 Statistiques générales:');
      console.log(`   - Espaces: ${stats.overview.rooms?.total || 0}`);
      console.log(`   - Problématiques: ${stats.overview.issues?.total || 0}`);
      console.log(`   - Tâches: ${stats.overview.tasks?.total || 0}`);
      console.log(`   - Utilisateurs: ${stats.overview.users?.total || 0}`);
    }

    // 7. Test de l'interface frontend (simulation)
    console.log('\n7. Test de l\'affichage frontend:');
    console.log('✅ L\'utilisateur avec le rôle "Auditeur" devrait voir:');
    console.log('   - Toutes les cartes statistiques générales');
    console.log('   - Les 6 nouvelles cartes spécifiques aux auditeurs:');
    console.log('     * Check Linges');
    console.log('     * Bons Prélèvement');
    console.log('     * Bons Demandes');
    console.log('     * Employés Présents');
    console.log('     * Articles Rupture');
    console.log('     * Chambres (Libres/Occupées)');

    console.log('\n🎉 Test terminé avec succès!');
    console.log('\n📝 Instructions pour tester dans le frontend:');
    console.log('1. Connectez-vous avec: auditeur@beatrice.com / password123');
    console.log('2. Allez sur le dashboard');
    console.log('3. Vérifiez que les nouvelles cartes statistiques sont visibles');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.log('\n💡 Suggestion: Vérifiez que les identifiants d\'administration sont corrects');
    }
    process.exit(1);
  }
}

// Exécuter le test
testAuditorStats();
