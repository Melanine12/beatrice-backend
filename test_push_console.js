const admin = require('firebase-admin');
const path = require('path');

console.log('🔥 Test Push Notification pour Console Firebase');
console.log('===============================================');

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

// Test 1: Notification visible dans la console Firebase
async function testConsoleNotification() {
  console.log('\n📱 Test 1: Notification pour la console Firebase...');
  
  try {
    const message = {
      notification: {
        title: '🏨 Hôtel Beatrice - Test Console',
        body: 'Cette notification devrait apparaître dans la console Firebase !'
      },
      data: {
        type: 'console_test',
        timestamp: new Date().toISOString(),
        hotel: 'beatrice',
        test: 'true'
      },
      // Ne pas utiliser de topic, envoyer à tous les appareils
      condition: "'test' in topics || 'all' in topics"
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification console envoyée:', response);
    console.log('📊 Vérifiez dans Firebase Console > Messaging > Campaigns');
  } catch (error) {
    console.log('⚠️  Erreur notification console:', error.message);
  }
}

// Test 2: Notification avec un token de test (simulation)
async function testWithToken() {
  console.log('\n🎯 Test 2: Notification avec token de test...');
  
  try {
    // Token de test (vous pouvez le remplacer par un vrai token FCM)
    const testToken = 'test_token_12345';
    
    const message = {
      notification: {
        title: '🎯 Test Token - Hôtel Beatrice',
        body: 'Notification envoyée avec un token spécifique'
      },
      data: {
        type: 'token_test',
        timestamp: new Date().toISOString()
      },
      token: testToken
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification token envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification token (normal si token invalide):', error.message);
  }
}

// Test 3: Notification multicast (pour plusieurs appareils)
async function testMulticast() {
  console.log('\n📱 Test 3: Notification multicast...');
  
  try {
    const message = {
      notification: {
        title: '📱 Test Multicast - Hôtel Beatrice',
        body: 'Notification envoyée à plusieurs appareils'
      },
      data: {
        type: 'multicast_test',
        timestamp: new Date().toISOString()
      },
      tokens: ['test_token_1', 'test_token_2'] // Tokens de test
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('✅ Notification multicast envoyée:');
    console.log('   Succès:', response.successCount);
    console.log('   Échecs:', response.failureCount);
  } catch (error) {
    console.log('⚠️  Erreur notification multicast:', error.message);
  }
}

// Test 4: Notification avec condition pour tous les utilisateurs
async function testAllUsers() {
  console.log('\n🌍 Test 4: Notification pour tous les utilisateurs...');
  
  try {
    const message = {
      notification: {
        title: '🌍 Notification Globale - Hôtel Beatrice',
        body: 'Cette notification est envoyée à tous les utilisateurs'
      },
      data: {
        type: 'global_test',
        timestamp: new Date().toISOString(),
        scope: 'all_users'
      },
      // Condition pour tous les utilisateurs
      condition: "true"
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification globale envoyée:', response);
  } catch (error) {
    console.log('⚠️  Erreur notification globale:', error.message);
  }
}

// Test 5: Notification avec analytics activé
async function testWithAnalytics() {
  console.log('\n📊 Test 5: Notification avec analytics...');
  
  try {
    const message = {
      notification: {
        title: '📊 Test Analytics - Hôtel Beatrice',
        body: 'Notification avec analytics activé'
      },
      data: {
        type: 'analytics_test',
        timestamp: new Date().toISOString()
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
      // Analytics activé
      analytics_label: 'test_notification',
      condition: "true"
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification analytics envoyée:', response);
    console.log('📊 Vérifiez dans Firebase Console > Analytics > Events');
  } catch (error) {
    console.log('⚠️  Erreur notification analytics:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests pour la console Firebase...\n');
  
  await testConsoleNotification();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testWithToken();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testMulticast();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testAllUsers();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testWithAnalytics();
  
  console.log('\n🎉 Tous les tests terminés !');
  console.log('\n📋 Comment voir les notifications dans Firebase Console:');
  console.log('1. Allez sur https://console.firebase.google.com/');
  console.log('2. Sélectionnez le projet "beatricehotel-668f6"');
  console.log('3. Allez dans "Messaging" > "Campaigns"');
  console.log('4. Vous devriez voir les notifications envoyées');
  console.log('\n💡 Note: Les notifications peuvent prendre quelques minutes à apparaître dans la console');
  
  process.exit(0);
}

// Démarrer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors des tests:', error);
  process.exit(1);
});

