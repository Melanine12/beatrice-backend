const admin = require('firebase-admin');
const DeviceToken = require('../models/DeviceToken');
const path = require('path');
const fs = require('fs');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  // Initialiser Firebase Admin SDK
  initializeFirebase() {
    if (this.initialized || admin.apps.length > 0) {
      this.initialized = true;
      return;
    }

    try {
      // Essayer d'abord d'utiliser le fichier JSON de service account
      const serviceAccountPath = path.join(__dirname, '../../beatricehotel-668f6-firebase-adminsdk-fbsvc-7758c1d5c7.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        // Utiliser le fichier JSON de service account
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          projectId: 'beatricehotel-668f6'
        });
        console.log('✅ Firebase Admin SDK initialisé avec le fichier JSON de service account');
      } else {
        // Fallback sur les variables d'environnement
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        // Vérifier que toutes les variables d'environnement sont présentes
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          console.warn('⚠️ Variables Firebase manquantes - Notifications push désactivées');
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('✅ Firebase Admin SDK initialisé avec les variables d\'environnement');
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
      this.initialized = false;
    }
  }

  // Vérifier si le service est initialisé
  isInitialized() {
    return this.initialized && admin.apps.length > 0;
  }

  // Enregistrer un token d'appareil
  async registerDeviceToken(userId, deviceToken, platform, appVersion = null) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Firebase non initialisé');
      }

      const [device, created] = await DeviceToken.findOrCreate({
        where: { user_id: userId, device_token: deviceToken },
        defaults: {
          user_id: userId,
          device_token: deviceToken,
          platform: platform,
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date()
        }
      });

      if (!created) {
        // Mettre à jour le token existant
        await device.update({
          platform: platform,
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date()
        });
      }

      console.log(`✅ Token ${created ? 'créé' : 'mis à jour'} pour l'utilisateur ${userId}`);
      return device;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      throw error;
    }
  }

  // Désactiver un token d'appareil
  async deactivateDeviceToken(deviceToken) {
    try {
      await DeviceToken.update(
        { is_active: false },
        { where: { device_token: deviceToken } }
      );
      console.log(`✅ Token désactivé: ${deviceToken}`);
    } catch (error) {
      console.error('❌ Erreur désactivation token:', error);
      throw error;
    }
  }

  // Envoyer une notification à un utilisateur spécifique
  async sendNotificationToUser(userId, notification) {
    try {
      if (!this.isInitialized()) {
        console.warn('⚠️ Firebase non initialisé - Notification non envoyée');
        return { success: false, reason: 'Firebase not initialized' };
      }

      const devices = await DeviceToken.findAll({
        where: { user_id: userId, is_active: true }
      });

      if (devices.length === 0) {
        console.log(`⚠️ Aucun appareil actif trouvé pour l'utilisateur ${userId}`);
        return { success: false, reason: 'No active devices' };
      }

      const tokens = devices.map(device => device.device_token);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          type: notification.type || 'general',
          task_id: notification.taskId?.toString() || '',
          problematique_id: notification.problematiqueId?.toString() || '',
          priority: notification.priority || 'normal',
          ...notification.data
        },
        tokens: tokens,
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

      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`📱 Notifications envoyées: ${response.successCount}/${tokens.length}`);
      
      // Désactiver les tokens invalides
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.log(`❌ Token invalide: ${tokens[idx]} - ${resp.error?.code}`);
          }
        });
        
        if (failedTokens.length > 0) {
          await DeviceToken.update(
            { is_active: false },
            { where: { device_token: failedTokens } }
          );
          console.log(`🗑️ ${failedTokens.length} tokens invalides désactivés`);
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de notification:', error);
      throw error;
    }
  }

  // Notification d'assignation de tâche
  async notifyTaskAssignment(userId, task) {
    const notification = {
      title: '🎯 Nouvelle tâche assignée',
      body: `${task.titre} - Priorité: ${task.priorite}`,
      type: 'task_assignment',
      taskId: task.id,
      priority: task.priorite,
      data: {
        action: 'view_task',
        task_type: task.type,
        chambre_id: task.chambre_id?.toString() || '',
        date_limite: task.date_limite || ''
      }
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Notification d'assignation de problématique
  async notifyProblematiqueAssignment(userId, problematique) {
    const notification = {
      title: '🚨 Problématique assignée',
      body: `${problematique.titre} - Priorité: ${problematique.priorite}`,
      type: 'problematique_assignment',
      problematiqueId: problematique.id,
      priority: problematique.priorite,
      data: {
        action: 'view_problematique',
        problematique_type: problematique.type,
        chambre_id: problematique.chambre_id?.toString() || '',
        departement_id: problematique.departement_id?.toString() || ''
      }
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Notification de mise à jour de statut
  async notifyStatusUpdate(userId, item, newStatus, itemType = 'task') {
    const emoji = {
      'À faire': '📋',
      'En cours': '🔄',
      'Terminée': '✅',
      'Annulée': '❌',
      'Ouverte': '🔓',
      'Résolue': '✅',
      'Fermée': '🔒'
    }[newStatus] || '📝';

    const notification = {
      title: `${emoji} Statut mis à jour`,
      body: `${item.titre} - Nouveau statut: ${newStatus}`,
      type: `${itemType}_status_update`,
      taskId: itemType === 'task' ? item.id : undefined,
      problematiqueId: itemType === 'problematique' ? item.id : undefined,
      priority: item.priorite,
      data: {
        action: `view_${itemType}`,
        new_status: newStatus,
        previous_status: item.statut
      }
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Notification de rappel
  async notifyReminder(userId, item, itemType = 'task') {
    const notification = {
      title: '⏰ Rappel',
      body: `${item.titre} - Échéance proche`,
      type: `${itemType}_reminder`,
      taskId: itemType === 'task' ? item.id : undefined,
      problematiqueId: itemType === 'problematique' ? item.id : undefined,
      priority: item.priorite,
      data: {
        action: `view_${itemType}`,
        reminder_type: 'deadline_approaching'
      }
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Envoyer une notification à tous les utilisateurs d'un rôle
  async sendNotificationToRole(role, notification) {
    try {
      if (!this.isInitialized()) {
        console.warn('⚠️ Firebase non initialisé - Notification non envoyée');
        return { success: false, reason: 'Firebase not initialized' };
      }

      // Récupérer tous les tokens des utilisateurs avec ce rôle
      const devices = await DeviceToken.findAll({
        where: { is_active: true },
        include: [{
          model: require('../models/User'),
          as: 'user',
          where: { role: role },
          attributes: ['id', 'nom', 'prenom', 'role']
        }]
      });

      if (devices.length === 0) {
        console.log(`⚠️ Aucun utilisateur avec le rôle ${role} trouvé`);
        return { success: false, reason: 'No users with this role' };
      }

      const tokens = devices.map(device => device.device_token);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          type: notification.type || 'role_notification',
          ...notification.data
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`📢 Notification de rôle envoyée: ${response.successCount}/${tokens.length}`);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      };
    } catch (error) {
      console.error('❌ Erreur notification de rôle:', error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
