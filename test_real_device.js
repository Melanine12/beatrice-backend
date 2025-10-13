const admin = require('firebase-admin');
const path = require('path');

console.log('🔥 Test Push Notification pour Appareil Réel');
console.log('============================================');

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

// Instructions pour obtenir un token FCM
console.log('\n📱 Instructions pour obtenir un token FCM :');
console.log('1. Lancez l\'application Flutter sur votre appareil');
console.log('2. Dans l\'application, appuyez sur "Test Notification"');
console.log('3. Copiez le token FCM affiché dans la console');
console.log('4. Collez-le ci-dessous et relancez ce script\n');

// Token FCM de test (remplacez par un vrai token)
const FCM_TOKEN = 'VOTRE_TOKEN_FCM_ICI';

if (FCM_TOKEN === 'VOTRE_TOKEN_FCM_ICI') {
  console.log('⚠️  Veuillez remplacer FCM_TOKEN par un vrai token FCM');
  console.log('💡 Pour obtenir un token :');
  console.log('   - Lancez l\'app Flutter');
  console.log('   - Appuyez sur "Test Notification"');
  console.log('   - Copiez le token affiché');
  process.exit(0);
}

// Test avec un vrai token FCM
async function testRealDevice() {
  console.log('\n📱 Test avec appareil réel...');
  console.log('Token FCM:', FCM_TOKEN.substring(0, 20) + '...');
  
  try {
    const message = {
      notification: {
        title: '🏨 Hôtel Beatrice - Test Réel',
        body: 'Notification envoyée directement à votre appareil !'
      },
      data: {
        type: 'real_device_test',
        timestamp: new Date().toISOString(),
        hotel: 'beatrice'
      },
      token: FCM_TOKEN,
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
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification envoyée à votre appareil !');
    console.log('📱 Message ID:', response);
    console.log('🎉 Vérifiez votre téléphone maintenant !');
    
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error.message);
    
    if (error.code === 'messaging/invalid-registration-token') {
      console.log('💡 Le token FCM est invalide. Vérifiez qu\'il est correct.');
    } else if (error.code === 'messaging/registration-token-not-registered') {
      console.log('💡 Le token FCM n\'est pas enregistré. Relancez l\'app Flutter.');
    }
  }
}

// Exécuter le test
testRealDevice().then(() => {
  console.log('\n🎉 Test terminé !');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});

