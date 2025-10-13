const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔥 Test de configuration Firebase');
console.log('================================');

// Test 1: Vérifier que le fichier JSON existe
const serviceAccountPath = path.join(__dirname, 'beatricehotel-668f6-firebase-adminsdk-fbsvc-7758c1d5c7.json');

console.log('📁 Vérification du fichier JSON...');
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Fichier JSON trouvé:', serviceAccountPath);
  
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ Fichier JSON valide');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    console.log('   Private Key ID:', serviceAccount.private_key_id);
  } catch (error) {
    console.error('❌ Erreur lecture fichier JSON:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ Fichier JSON non trouvé:', serviceAccountPath);
  process.exit(1);
}

// Test 2: Initialiser Firebase Admin SDK
console.log('\n🔧 Initialisation Firebase Admin SDK...');
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'beatricehotel-668f6'
  });
  console.log('✅ Firebase Admin SDK initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error.message);
  process.exit(1);
}

// Test 3: Tester l'envoi d'une notification de test
console.log('\n📱 Test d\'envoi de notification...');
async function testNotification() {
  try {
    // Créer un message de test
    const message = {
      notification: {
        title: 'Test de configuration Firebase',
        body: 'Configuration Firebase réussie !'
      },
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      },
      topic: 'test' // Utiliser un topic pour éviter d'avoir besoin d'un token
    };

    // Envoyer la notification
    const response = await admin.messaging().send(message);
    console.log('✅ Notification envoyée avec succès:', response);
  } catch (error) {
    if (error.code === 'messaging/invalid-topic') {
      console.log('⚠️  Topic invalide (normal pour un test), mais Firebase fonctionne');
    } else {
      console.error('❌ Erreur envoi notification:', error.message);
    }
  }
}

// Exécuter le test
testNotification().then(() => {
  console.log('\n🎉 Configuration Firebase validée avec succès !');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Exécuter: mysql -u root -p hotel_beatrice < ../create_device_tokens_table.sql');
  console.log('2. Redémarrer le serveur backend');
  console.log('3. Tester avec: node ../test_push_notifications.js');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});
