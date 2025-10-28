const { sequelize } = require('../config/database');

class AlertSystem {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60000; // Vérifier toutes les minutes
  }

  // Démarrer le système d'alertes automatiques
  start() {
    if (this.isRunning) {
      console.log('⚠️ Système d\'alertes déjà en cours d\'exécution');
      return;
    }

    console.log('🚨 Démarrage du système d\'alertes automatiques...');
    this.isRunning = true;

    // Vérifier immédiatement
    this.checkAlerts();

    // Programmer les vérifications périodiques
    this.intervalId = setInterval(() => {
      this.checkAlerts();
    }, this.checkInterval);

    console.log('✅ Système d\'alertes démarré avec succès');
  }

  // Arrêter le système d'alertes
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Système d\'alertes déjà arrêté');
      return;
    }

    console.log('🛑 Arrêt du système d\'alertes...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Système d\'alertes arrêté');
  }

  // Vérifier et créer les alertes automatiques
  async checkAlerts() {
    try {
      console.log('🔍 Vérification des alertes automatiques...');

      // Vérifier les problèmes non résolus depuis plus de 24h
      await this.checkUnresolvedProblems();

      // Vérifier les tâches en retard
      await this.checkOverdueTasks();

      // Vérifier les stocks faibles
      await this.checkLowStock();

      // Vérifier les paiements en retard
      await this.checkOverduePayments();

      console.log('✅ Vérification des alertes terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des alertes:', error);
    }
  }

  // Vérifier les problèmes non résolus
  async checkUnresolvedProblems() {
    try {
      const problems = await sequelize.query(`
        SELECT id, titre, date_creation
        FROM tbl_problematiques 
        WHERE statut != 'Résolu' 
        AND date_creation < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND id NOT IN (
          SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('problème #', message) + 11, 10) AS UNSIGNED)
          FROM tbl_alertes 
          WHERE type = 'warning' 
          AND message LIKE '%problème non résolu%'
          AND statut = 'active'
        )
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      for (const problem of problems) {
        await this.createAlert({
          titre: 'Problème non résolu',
          message: `Le problème "${problem.titre}" n'a pas été résolu depuis plus de 24h`,
          type: 'warning',
          priorite: 'haute',
          statut: 'active'
        });
      }

      if (problems.length > 0) {
        console.log(`⚠️ ${problems.length} problèmes non résolus détectés`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des problèmes:', error);
    }
  }

  // Vérifier les tâches en retard
  async checkOverdueTasks() {
    try {
      const tasks = await sequelize.query(`
        SELECT id, titre, date_limite
        FROM tbl_taches 
        WHERE statut != 'Terminée' 
        AND date_limite < NOW()
        AND id NOT IN (
          SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('tâche #', message) + 7, 10) AS UNSIGNED)
          FROM tbl_alertes 
          WHERE type = 'error' 
          AND message LIKE '%tâche en retard%'
          AND statut = 'active'
        )
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      for (const task of tasks) {
        await this.createAlert({
          titre: 'Tâche en retard',
          message: `La tâche "${task.titre}" est en retard (échéance: ${task.date_limite})`,
          type: 'error',
          priorite: 'haute',
          statut: 'active'
        });
      }

      if (tasks.length > 0) {
        console.log(`⚠️ ${tasks.length} tâches en retard détectées`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des tâches:', error);
    }
  }

  // Vérifier les stocks faibles
  async checkLowStock() {
    try {
      const lowStock = await sequelize.query(`
        SELECT id, nom, quantite
        FROM tbl_inventaire 
        WHERE quantite <= 5
        AND id NOT IN (
          SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('article #', message) + 9, 10) AS UNSIGNED)
          FROM tbl_alertes 
          WHERE type = 'warning' 
          AND message LIKE '%stock faible%'
          AND statut = 'active'
        )
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      for (const item of lowStock) {
        await this.createAlert({
          titre: 'Stock faible',
          message: `L'article "${item.nom}" a un stock faible (${item.quantite} unités)`,
          type: 'warning',
          priorite: 'normale',
          statut: 'active'
        });
      }

      if (lowStock.length > 0) {
        console.log(`⚠️ ${lowStock.length} articles avec stock faible détectés`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des stocks:', error);
    }
  }

  // Vérifier les paiements en retard
  async checkOverduePayments() {
    try {
      const overduePayments = await sequelize.query(`
        SELECT id, date_rappel
        FROM tbl_rappels_paiement 
        WHERE statut != 'Traité' 
        AND date_rappel < NOW()
        AND id NOT IN (
          SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('rappel #', message) + 9, 10) AS UNSIGNED)
          FROM tbl_alertes 
          WHERE type = 'error' 
          AND message LIKE '%rappel en retard%'
          AND statut = 'active'
        )
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      for (const payment of overduePayments) {
        await this.createAlert({
          titre: 'Rappel de paiement en retard',
          message: `Un rappel de paiement est en retard (date: ${payment.date_rappel})`,
          type: 'error',
          priorite: 'haute',
          statut: 'active'
        });
      }

      if (overduePayments.length > 0) {
        console.log(`⚠️ ${overduePayments.length} rappels de paiement en retard détectés`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des paiements:', error);
    }
  }

  // Créer une alerte
  async createAlert(alertData) {
    try {
      await sequelize.query(`
        INSERT INTO tbl_alertes (
          titre, message, type, priorite, statut, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          alertData.titre,
          alertData.message,
          alertData.type,
          alertData.priorite,
          alertData.statut
        ],
        type: sequelize.QueryTypes.INSERT
      });

      console.log(`🔔 Alerte créée: ${alertData.titre}`);
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'alerte:', error);
    }
  }

  // Nettoyer les anciennes alertes
  async cleanupOldAlerts() {
    try {
      console.log('🧹 Nettoyage des anciennes alertes...');

      const result = await sequelize.query(`
        DELETE FROM tbl_alertes 
        WHERE statut = 'archivee' 
        AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `, {
        type: sequelize.QueryTypes.DELETE
      });

      console.log(`✅ ${result[1]} anciennes alertes supprimées`);
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des alertes:', error);
    }
  }

  // Obtenir les statistiques des alertes
  async getAlertStats() {
    try {
      const stats = await sequelize.query(`
        SELECT 
          type,
          priorite,
          statut,
          COUNT(*) as count
        FROM tbl_alertes 
        WHERE statut = 'active'
        GROUP BY type, priorite, statut
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return [];
    }
  }
}

// Créer une instance singleton
const alertSystem = new AlertSystem();

module.exports = alertSystem;