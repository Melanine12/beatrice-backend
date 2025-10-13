const admin = require('firebase-admin');
const path = require('path');

console.log('🔥 Test Push Notification Immédiat');
console.log('==================================');

// Initialiser Firebase
const serviceAccountPath = path.join(__dirname, 'beatricehotel-668f6-firebase-adminsdk-fbsvc-7758c1d5c7.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'beatricehotel-668f6'
  });
  console.log('✅ Firebase initialisé');
} catch (error) {
  console.error('❌ Erreur Firebase:', error.message);
  process.exit(1);
}

// Test 1: Notification simple
async function testSimpleNotification() {
  console.log('\n📱 Test 1: Notification simple...');
  
  try {
    const message = {
      notification: {
        title: '🎯 Test Hôtel Beatrice',
        body: 'Ceci est un test de notification push !'
      },
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        hotel: 'beatrice'
      },
      topic: 'test' // Utiliser un topic pour le test
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification simple envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification simple:', error.message);
  }
}

// Test 2: Notification de tâche (simulation)
async function testTaskNotification() {
  console.log('\n🎯 Test 2: Notification de tâche...');
  
  try {
    const message = {
      notification: {
        title: '🎯 Nouvelle tâche assignée',
        body: 'Nettoyage chambre 101 - Priorité: Haute'
      },
      data: {
        type: 'task_assignment',
        task_id: '123',
        priority: 'Haute',
        task_type: 'Nettoyage',
        chambre_id: '101',
        action: 'view_task'
      },
      topic: 'test'
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification de tâche envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification tâche:', error.message);
  }
}

// Test 3: Notification de problématique (simulation)
async function testProblematiqueNotification() {
  console.log('\n🚨 Test 3: Notification de problématique...');
  
  try {
    const message = {
      notification: {
        title: '🚨 Problématique assignée',
        body: 'Panne climatisation chambre 205 - Priorité: Urgente'
      },
      data: {
        type: 'problematique_assignment',
        problematique_id: '456',
        priority: 'Urgente',
        problematique_type: 'Maintenance',
        chambre_id: '205',
        action: 'view_problematique'
      },
      topic: 'test'
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification de problématique envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification problématique:', error.message);
  }
}

// Test 4: Notification de changement de statut
async function testStatusNotification() {
  console.log('\n📝 Test 4: Notification de changement de statut...');
  
  try {
    const message = {
      notification: {
        title: '📝 Statut mis à jour',
        body: 'Tâche #123 - Nouveau statut: En cours'
      },
      data: {
        type: 'task_status_update',
        task_id: '123',
        new_status: 'En cours',
        previous_status: 'À faire',
        action: 'view_task'
      },
      topic: 'test'
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification de statut envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification statut:', error.message);
  }
}

// Test 5: Notification avec données personnalisées
async function testCustomNotification() {
  console.log('\n🎨 Test 5: Notification personnalisée...');
  
  try {
    const message = {
      notification: {
        title: '🏨 Hôtel Beatrice - Notification',
        body: 'Système de notifications push opérationnel !'
      },
      data: {
        type: 'system',
        message: 'Configuration terminée',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        hotel: 'beatrice'
      },
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          channel_id: 'hotel_beatrice_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      topic: 'test'
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification personnalisée envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification personnalisée:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests de notifications...\n');
  
  await testSimpleNotification();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s
  
  await testTaskNotification();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testProblematiqueNotification();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testStatusNotification();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testCustomNotification();
  
  console.log('\n🎉 Tous les tests terminés !');
  console.log('\n📱 Vérifiez votre appareil pour voir les notifications');
  console.log('💡 Note: Les notifications peuvent prendre quelques secondes à arriver');
  
  process.exit(0);
}

// Démarrer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors des tests:', error);
  process.exit(1);
});
