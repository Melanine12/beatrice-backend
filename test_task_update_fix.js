const axios = require('axios');

const API_URL = 'https://beatrice-backend.onrender.com';

// Test de modification de tâche avec champ duree_estimee vide
async function testTaskUpdateWithEmptyDuration() {
  try {
    console.log('🧪 Test de modification de tâche avec durée estimée vide...');
    
    // 1. Connexion de Jimmy
    console.log('1. Connexion de Jimmy...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'jimmy@example.com', // Remplacez par l'email réel de Jimmy
      mot_de_passe: 'password123' // Remplacez par le mot de passe réel
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Jimmy connecté avec succès');
    
    // 2. Récupérer les tâches existantes
    console.log('2. Récupération des tâches...');
    const tasksResponse = await axios.get(`${API_URL}/api/taches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tasks = tasksResponse.data.taches;
    console.log(`✅ ${tasks.length} tâches récupérées`);
    
    if (tasks.length === 0) {
      console.log('❌ Aucune tâche trouvée pour le test');
      return;
    }
    
    // 3. Prendre la première tâche pour le test
    const taskToUpdate = tasks[0];
    console.log(`3. Test de modification de la tâche ID: ${taskToUpdate.id}`);
    console.log(`   Titre actuel: ${taskToUpdate.titre}`);
    
    // 4. Modifier la tâche avec des champs vides (cas problématique)
    const updateData = {
      titre: taskToUpdate.titre + ' - Test correction',
      description: taskToUpdate.description || 'Description test',
      type: taskToUpdate.type || 'Maintenance',
      priorite: taskToUpdate.priorite || 'Normale',
      statut: taskToUpdate.statut || 'À faire',
      assigne_id: taskToUpdate.assigne_id || '',
      chambre_id: taskToUpdate.chambre_id || '',
      problematique_id: taskToUpdate.problematique_id || '',
      date_limite: taskToUpdate.date_limite || '',
      duree_estimee: '', // Champ vide - c'était le problème !
      notes: taskToUpdate.notes || 'Test correction champ vide',
      tags: taskToUpdate.tags || ''
    };
    
    console.log('4. Données de mise à jour (avec duree_estimee vide):', updateData);
    
    const updateResponse = await axios.put(`${API_URL}/api/taches/${taskToUpdate.id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Tâche modifiée avec succès !');
    console.log('   Réponse:', updateResponse.data);
    
    // 5. Test avec duree_estimee null
    console.log('5. Test avec duree_estimee null...');
    const updateDataNull = {
      ...updateData,
      duree_estimee: null
    };
    
    const updateResponseNull = await axios.put(`${API_URL}/api/taches/${taskToUpdate.id}`, updateDataNull, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Tâche modifiée avec duree_estimee null !');
    
    // 6. Test avec duree_estimee valide
    console.log('6. Test avec duree_estimee valide...');
    const updateDataValid = {
      ...updateData,
      duree_estimee: 30
    };
    
    const updateResponseValid = await axios.put(`${API_URL}/api/taches/${taskToUpdate.id}`, updateDataValid, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Tâche modifiée avec duree_estimee valide !');
    
    // 7. Vérifier que la modification a été appliquée
    console.log('7. Vérification de la modification...');
    const updatedTaskResponse = await axios.get(`${API_URL}/api/taches/${taskToUpdate.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedTask = updatedTaskResponse.data.tache;
    console.log('✅ Tâche mise à jour récupérée:');
    console.log(`   Nouveau titre: ${updatedTask.titre}`);
    console.log(`   Durée estimée: ${updatedTask.duree_estimee}`);
    console.log(`   Notes: ${updatedTask.notes}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('   Erreur serveur:', error.response.data);
    }
  }
}

// Exécuter le test
testTaskUpdateWithEmptyDuration();
