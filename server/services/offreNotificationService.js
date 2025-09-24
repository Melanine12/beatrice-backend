const Notification = require('../models/Notification');
const { User } = require('../models');

class OffreNotificationService {
  constructor() {
    this.io = null; // Sera défini lors de l'initialisation
  }

  setSocketIO(io) {
    this.io = io;
  }

  // Créer une notification pour une action sur une offre
  async createOffreNotification(action, offre, user, metadata = {}) {
    try {
      const notifications = {
        'offre_created': {
          title: 'Nouvelle offre d\'emploi créée',
          message: `L'offre "${offre.titre_poste}" a été créée par ${user.prenom} ${user.nom}`,
          type: 'info',
          link: `/rh/offres-emploi?offre=${offre.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'offre_updated': {
          title: 'Offre d\'emploi modifiée',
          message: `L'offre "${offre.titre_poste}" a été modifiée par ${user.prenom} ${user.nom}`,
          type: 'info',
          link: `/rh/offres-emploi?offre=${offre.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'offre_deleted': {
          title: 'Offre d\'emploi supprimée',
          message: `L'offre "${offre.titre_poste}" a été supprimée par ${user.prenom} ${user.nom}`,
          type: 'warning',
          link: '/rh/offres-emploi',
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'offre_published': {
          title: 'Offre d\'emploi publiée',
          message: `L'offre "${offre.titre_poste}" est maintenant ouverte aux candidatures`,
          type: 'success',
          link: `/rh/offres-emploi?offre=${offre.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'offre_closed': {
          title: 'Offre d\'emploi fermée',
          message: `L'offre "${offre.titre_poste}" a été fermée`,
          type: 'warning',
          link: `/rh/offres-emploi?offre=${offre.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        }
      };

      const notificationData = notifications[action];
      if (!notificationData) {
        console.warn(`Type de notification non reconnu: ${action}`);
        return null;
      }

      // Ajouter des métadonnées si fournies
      const message = metadata.additionalInfo 
        ? `${notificationData.message} - ${metadata.additionalInfo}`
        : notificationData.message;

      const notification = await Notification.create({
        title: notificationData.title,
        message: message,
        type: notificationData.type,
        link: notificationData.link,
        target_roles: JSON.stringify(notificationData.target_roles),
        created_by: user.id
      });

      // Broadcast via Socket.io si disponible
      if (this.io) {
        this.io.emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          target_roles: notificationData.target_roles,
          created_at: notification.created_at,
          metadata: {
            action: action,
            offre_id: offre.id,
            offre_titre: offre.titre_poste,
            user_name: `${user.prenom} ${user.nom}`
          }
        });
      }

      console.log(`✅ Notification créée: ${action} pour l'offre "${offre.titre_poste}"`);
      return notification;

    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  // Créer une notification pour une candidature
  async createCandidatureNotification(action, candidature, offre, user, metadata = {}) {
    try {
      const notifications = {
        'candidature_received': {
          title: 'Nouvelle candidature reçue',
          message: `Nouvelle candidature pour l'offre "${offre.titre_poste}" de ${candidature.candidat_prenom} ${candidature.candidat_nom}`,
          type: 'info',
          link: `/rh/offres-emploi?offre=${offre.id}&candidature=${candidature.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'candidature_updated': {
          title: 'Candidature mise à jour',
          message: `La candidature de ${candidature.candidat_prenom} ${candidature.candidat_nom} pour "${offre.titre_poste}" a été mise à jour`,
          type: 'info',
          link: `/rh/offres-emploi?offre=${offre.id}&candidature=${candidature.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'candidature_accepted': {
          title: 'Candidature acceptée',
          message: `La candidature de ${candidature.candidat_prenom} ${candidature.candidat_nom} pour "${offre.titre_poste}" a été acceptée`,
          type: 'success',
          link: `/rh/offres-emploi?offre=${offre.id}&candidature=${candidature.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        },
        'candidature_rejected': {
          title: 'Candidature refusée',
          message: `La candidature de ${candidature.candidat_prenom} ${candidature.candidat_nom} pour "${offre.titre_poste}" a été refusée`,
          type: 'warning',
          link: `/rh/offres-emploi?offre=${offre.id}&candidature=${candidature.id}`,
          target_roles: ['Superviseur RH', 'Administrateur', 'Patron']
        }
      };

      const notificationData = notifications[action];
      if (!notificationData) {
        console.warn(`Type de notification candidature non reconnu: ${action}`);
        return null;
      }

      // Ajouter des métadonnées si fournies
      const message = metadata.additionalInfo 
        ? `${notificationData.message} - ${metadata.additionalInfo}`
        : notificationData.message;

      const notification = await Notification.create({
        title: notificationData.title,
        message: message,
        type: notificationData.type,
        link: notificationData.link,
        target_roles: JSON.stringify(notificationData.target_roles),
        created_by: user.id
      });

      // Broadcast via Socket.io si disponible
      if (this.io) {
        this.io.emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          target_roles: notificationData.target_roles,
          created_at: notification.created_at,
          metadata: {
            action: action,
            offre_id: offre.id,
            offre_titre: offre.titre_poste,
            candidature_id: candidature.id,
            candidat_nom: `${candidature.candidat_prenom} ${candidature.candidat_nom}`,
            user_name: `${user.prenom} ${user.nom}`
          }
        });
      }

      console.log(`✅ Notification candidature créée: ${action} pour "${offre.titre_poste}"`);
      return notification;

    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification candidature:', error);
      throw error;
    }
  }

  // Notifier tous les utilisateurs avec des rôles spécifiques
  async notifyRoles(roles, title, message, type = 'info', link = null, metadata = {}) {
    try {
      const notification = await Notification.create({
        title,
        message,
        type,
        link,
        target_roles: JSON.stringify(roles),
        created_by: null
      });

      // Broadcast via Socket.io si disponible
      if (this.io) {
        this.io.emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          target_roles: roles,
          created_at: notification.created_at,
          metadata
        });
      }

      console.log(`✅ Notification de rôle créée: ${title}`);
      return notification;

    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification de rôle:', error);
      throw error;
    }
  }

  // Obtenir les notifications récentes pour un utilisateur
  async getUserNotifications(userId, limit = 20) {
    try {
      const notifications = await Notification.findAll({
        where: {
          // Filtrer par rôles de l'utilisateur ou notifications générales
          [require('sequelize').Op.or]: [
            { target_roles: null }, // Notifications générales
            { created_by: userId } // Notifications créées par l'utilisateur
          ]
        },
        order: [['created_at', 'DESC']],
        limit: limit
      });

      return notifications;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }
}

module.exports = new OffreNotificationService();
