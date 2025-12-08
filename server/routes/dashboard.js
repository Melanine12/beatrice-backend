const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const Chambre = require('../models/Chambre');
const Problematique = require('../models/Problematique');
const Tache = require('../models/Tache');
const Depense = require('../models/Depense');
const User = require('../models/User');
const AffectationChambre = require('../models/AffectationChambre');
const CheckLinge = require('../models/CheckLinge')(sequelize);
const BonMenage = require('../models/BonMenage');
const Pointage = require('../models/Pointage')(sequelize);
const Inventaire = require('../models/Inventaire');
const Demande = require('../models/Demande');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    // Get all statistics in parallel for better performance
    const [
      roomStats,
      issueStats,
      taskStats,
      expenseStats,
      userStats,
      assignmentStats,
      auditorStats,
      supervisorRHStats
    ] = await Promise.all([
      // Room statistics
      (async () => {
        const totalRooms = await Chambre.count();
        const availableRooms = await Chambre.count({ where: { statut: 'Libre' } });
        const occupiedRooms = await Chambre.count({ where: { statut: 'Occupée' } });
        const maintenanceRooms = await Chambre.count({ where: { statut: 'En maintenance' } });
        const cleaningRooms = await Chambre.count({ where: { statut: 'En nettoyage' } });
        const totalRevenue = await Chambre.sum('prix_nuit', { where: { statut: 'Occupée' } });
        
        return {
          total: totalRooms,
          available: availableRooms,
          occupied: occupiedRooms,
          maintenance: maintenanceRooms,
          cleaning: cleaningRooms,
          totalRevenue: totalRevenue || 0,
          occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0
        };
      })(),

      // Issue statistics
      (async () => {
        const totalIssues = await Problematique.count();
        const openIssues = await Problematique.count({ where: { statut: 'Ouverte' } });
        const inProgressIssues = await Problematique.count({ where: { statut: 'En cours' } });
        const resolvedIssues = await Problematique.count({ where: { statut: 'Résolue' } });
        const urgentIssues = await Problematique.count({ where: { priorite: 'Urgente' } });
        
        // Daily statistics for issues
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayCreated = await Problematique.count({
          where: {
            date_creation: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        const todayResolved = await Problematique.count({
          where: {
            statut: 'Résolue',
            date_resolution: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        const todayUrgent = await Problematique.count({
          where: {
            priorite: 'Urgente',
            date_creation: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        const todayInProgress = await Problematique.count({
          where: {
            statut: 'En cours',
            date_creation: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        return {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          urgent: urgentIssues,
          resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) : 0,
          today: todayCreated,
          todayCreated: todayCreated,
          todayResolved: todayResolved,
          todayUrgent: todayUrgent,
          todayInProgress: todayInProgress
        };
      })(),

      // Task statistics
      (async () => {
        const totalTasks = await Tache.count();
        const pendingTasks = await Tache.count({ where: { statut: 'À faire' } });
        const inProgressTasks = await Tache.count({ where: { statut: 'En cours' } });
        const completedTasks = await Tache.count({ where: { statut: 'Terminée' } });
        const urgentTasks = await Tache.count({ where: { priorite: 'Urgente' } });
        const overdueTasks = await Tache.count({
          where: {
            date_limite: { [Op.lt]: new Date() },
            statut: { [Op.ne]: 'Terminée' }
          }
        });
        
        // Daily statistics for tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayCreated = await Tache.count({
          where: {
            date_creation: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        const todayCompleted = await Tache.count({
          where: {
            statut: 'Terminée',
            date_fin: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        const todayDue = await Tache.count({
          where: {
            date_limite: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            },
            statut: {
              [Op.ne]: 'Terminée'
            }
          }
        });
        
        const todayInProgress = await Tache.count({
          where: {
            statut: 'En cours',
            date_creation: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
        
        return {
          total: totalTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          urgent: urgentTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
          today: todayCreated,
          todayCreated: todayCreated,
          todayCompleted: todayCompleted,
          todayDue: todayDue,
          todayInProgress: todayInProgress
        };
      })(),

      // Expense statistics
      (async () => {
        const totalExpenses = await Depense.count();
        const pendingExpenses = await Depense.count({ where: { statut: 'En attente' } });
        const approvedExpenses = await Depense.count({ where: { statut: 'Approuvée' } });
        const paidExpenses = await Depense.count({ where: { statut: 'Payée' } });
        const totalAmount = await Depense.sum('montant');
        const pendingAmount = await Depense.sum('montant', { where: { statut: 'En attente' } });
        
        return {
          total: totalExpenses,
          pending: pendingExpenses,
          approved: approvedExpenses,
          paid: paidExpenses,
          totalAmount: totalAmount || 0,
          pendingAmount: pendingAmount || 0,
          approvalRate: totalExpenses > 0 ? (((approvedExpenses + paidExpenses) / totalExpenses) * 100).toFixed(2) : 0
        };
      })(),

      // User statistics
      (async () => {
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { actif: true } });
        const recentLogins = await User.count({
          where: {
            derniere_connexion: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        });
        
        return {
          total: totalUsers,
          active: activeUsers,
          recentLogins: recentLogins
        };
      })(),

      // Assignment statistics
      (async () => {
        const totalAssignments = await AffectationChambre.count();
        const todayAssignments = await AffectationChambre.count({
          where: {
            date_affectation: {
              [Op.gte]: new Date().setHours(0, 0, 0, 0)
            }
          }
        });
        
        return {
          total: totalAssignments,
          today: todayAssignments
        };
      })(),

      // Auditor statistics (for users with role "Auditeur")
      (async () => {
        console.log('🔍 Computing auditor statistics...');
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Check linges mis à jour du jour
        let checkLingesToday = 0;
        try {
          checkLingesToday = await CheckLinge.count({
            where: {
              updated_at: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
        } catch (error) {
          console.log('⚠️  Erreur CheckLinge:', error.message);
        }

        // Bons de prélèvement approuvés du jour
        let bonsPrelevementApproved = 0;
        try {
          const todayDate = new Date().toISOString().split('T')[0];
          bonsPrelevementApproved = await BonMenage.count({
            where: {
              etat_chambre_apres_entretien: 'Parfait',
              date_creation: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
          console.log('📊 Bons prélèvement approuvés:', bonsPrelevementApproved);
        } catch (error) {
          console.log('⚠️  Erreur BonMenage:', error.message);
        }

        // Bons de demandes approuvés du jour
        let bonsDemandesApproved = 0;
        try {
          bonsDemandesApproved = await Demande.count({
            where: {
              statut: 'approuvee',
              date_demande: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
          console.log('📊 Bons demandes approuvés:', bonsDemandesApproved);
        } catch (error) {
          console.log('⚠️  Erreur Demande:', error.message);
        }

        // Employés présents du jour
        let employesPresents = 0;
        try {
          // La table pointages stocke seulement la date (sans heure)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          console.log('📅 Date recherchée (Auditeur):', todayDate);
          
          // Utiliser DATE() pour s'assurer que la comparaison fonctionne même si date_pointage contient une heure
          // Le champ present est tinyint(1) dans MySQL, donc on compare avec 1
          const result = await sequelize.query(
            `SELECT COUNT(DISTINCT employe_id) as count 
             FROM tbl_pointages 
             WHERE DATE(date_pointage) = DATE(:todayDate)
             AND present = 1`,
            {
              replacements: { todayDate: todayDate },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          employesPresents = parseInt(result[0]?.count) || 0;
          
          console.log('📊 Employés présents aujourd\'hui (Auditeur):', employesPresents, 'pour la date:', todayDate);
          
          // Debug: vérifier s'il y a des pointages pour aujourd'hui
          if (employesPresents === 0) {
            const debugResult = await sequelize.query(
              `SELECT COUNT(*) as total, 
                      COUNT(DISTINCT employe_id) as employes_distincts,
                      SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as presents,
                      SUM(CASE WHEN present = 0 THEN 1 ELSE 0 END) as absents,
                      GROUP_CONCAT(DISTINCT employe_id) as liste_employes,
                      GROUP_CONCAT(DISTINCT DATE(date_pointage)) as dates_trouvees
               FROM tbl_pointages 
               WHERE DATE(date_pointage) = DATE(:todayDate)`,
              {
                replacements: { todayDate: todayDate },
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Debug pointages aujourd\'hui (Auditeur):', debugResult[0]);
            
            // Vérifier aussi avec CURDATE() pour comparer avec la date système MySQL
            const checkWithCurdate = await sequelize.query(
              `SELECT COUNT(DISTINCT employe_id) as count 
               FROM tbl_pointages 
               WHERE DATE(date_pointage) = CURDATE()
               AND present = 1`,
              {
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Vérification avec CURDATE() (Auditeur):', checkWithCurdate[0]);
            
            // Vérifier les derniers pointages avec present=1
            const recentPointages = await sequelize.query(
              `SELECT employe_id, date_pointage, present, DATE(date_pointage) as date_only
               FROM tbl_pointages 
               WHERE present = 1
               ORDER BY date_pointage DESC 
               LIMIT 10`,
              {
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Derniers pointages avec present=1 (Auditeur):', recentPointages);
          }
        } catch (error) {
          console.error('⚠️  Erreur Pointage:', error.message);
          console.error('⚠️  Stack:', error.stack);
        }

        // Articles en rupture de stock
        let articlesRuptureStock = 0;
        try {
          articlesRuptureStock = await Inventaire.count({
            where: {
              quantite: {
                [Op.lte]: 0
              }
            }
          });
        } catch (error) {
          console.log('⚠️  Erreur Inventaire:', error.message);
        }

        // Chambres libres et occupées du jour
        let chambresLibres = 0;
        let chambresOccupees = 0;
        try {
          chambresLibres = await Chambre.count({
            where: { statut: 'Libre' }
          });
          
          // Corriger le statut : "Occupé" au lieu de "Occupée"
          chambresOccupees = await Chambre.count({
            where: { statut: 'Occupé' }
          });
          
          console.log('📊 Chambres - Libres:', chambresLibres, 'Occupées:', chambresOccupees);
        } catch (error) {
          console.log('⚠️  Erreur Chambre:', error.message);
        }

        const auditorStats = {
          checkLingesToday,
          bonsPrelevementApproved,
          bonsDemandesApproved,
          employesPresents,
          articlesRuptureStock,
          chambresLibres,
          chambresOccupees
        };
        
        console.log('📊 Auditor stats computed:', auditorStats);
        return auditorStats;
      })(),

      // Supervisor RH statistics (for users with role "Superviseur RH")
      (async () => {
        console.log('🔍 Computing Supervisor RH statistics...');
        
        // Employés présents du jour
        let employesPresentsAujourdhui = 0;
        try {
          // La table pointages stocke seulement la date (sans heure)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          console.log('📅 Date recherchée (Superviseur RH):', todayDate);
          console.log('📅 Date complète aujourd\'hui:', today.toISOString());
          
          // Utiliser DATE() pour s'assurer que la comparaison fonctionne même si date_pointage contient une heure
          // Le champ present est tinyint(1) dans MySQL, donc on compare avec 1
          const result = await sequelize.query(
            `SELECT COUNT(DISTINCT employe_id) as count 
             FROM tbl_pointages 
             WHERE DATE(date_pointage) = DATE(:todayDate)
             AND present = 1`,
            {
              replacements: { todayDate: todayDate },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          employesPresentsAujourdhui = parseInt(result[0]?.count) || 0;
          
          console.log('📊 Employés présents aujourd\'hui (Superviseur RH):', employesPresentsAujourdhui, 'pour la date:', todayDate);
          
          // Debug: vérifier s'il y a des pointages pour aujourd'hui
          if (employesPresentsAujourdhui === 0) {
            const debugResult = await sequelize.query(
              `SELECT COUNT(*) as total, 
                      COUNT(DISTINCT employe_id) as employes_distincts,
                      SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as presents,
                      SUM(CASE WHEN present = 0 THEN 1 ELSE 0 END) as absents,
                      GROUP_CONCAT(DISTINCT employe_id) as liste_employes,
                      GROUP_CONCAT(DISTINCT DATE(date_pointage)) as dates_trouvees
               FROM tbl_pointages 
               WHERE DATE(date_pointage) = DATE(:todayDate)`,
              {
                replacements: { todayDate: todayDate },
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Debug pointages aujourd\'hui (Superviseur RH):', debugResult[0]);
            
            // Vérifier aussi les pointages récents pour voir le format de date
            const recentPointages = await sequelize.query(
              `SELECT employe_id, date_pointage, present, DATE(date_pointage) as date_only
               FROM tbl_pointages 
               WHERE present = 1
               ORDER BY date_pointage DESC 
               LIMIT 10`,
              {
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Derniers pointages avec present=1 (Superviseur RH):', recentPointages);
            
            // Vérifier aussi avec CURDATE() pour comparer avec la date système MySQL
            const checkWithCurdate = await sequelize.query(
              `SELECT COUNT(DISTINCT employe_id) as count 
               FROM tbl_pointages 
               WHERE DATE(date_pointage) = CURDATE()
               AND present = 1`,
              {
                type: sequelize.QueryTypes.SELECT
              }
            );
            console.log('📊 Vérification avec CURDATE() (Superviseur RH):', checkWithCurdate[0]);
          }
        } catch (error) {
          console.error('⚠️  Erreur Pointage (Superviseur RH):', error.message);
          console.error('⚠️  Stack:', error.stack);
        }

        const supervisorRHStats = {
          employesPresentsAujourdhui
        };
        
        console.log('📊 Supervisor RH stats computed:', supervisorRHStats);
        return supervisorRHStats;
      })()
    ]);

    // Calculate overall system health
    const systemHealth = {
      rooms: {
        status: roomStats.occupancyRate > 80 ? 'excellent' : roomStats.occupancyRate > 60 ? 'good' : 'needs_attention',
        score: parseFloat(roomStats.occupancyRate)
      },
      issues: {
        status: parseFloat(issueStats.resolutionRate) > 90 ? 'excellent' : parseFloat(issueStats.resolutionRate) > 70 ? 'good' : 'needs_attention',
        score: parseFloat(issueStats.resolutionRate)
      },
      tasks: {
        status: parseFloat(taskStats.completionRate) > 85 ? 'excellent' : parseFloat(taskStats.completionRate) > 65 ? 'good' : 'needs_attention',
        score: parseFloat(taskStats.completionRate)
      },
      expenses: {
        status: parseFloat(expenseStats.approvalRate) > 80 ? 'excellent' : parseFloat(expenseStats.approvalRate) > 60 ? 'good' : 'needs_attention',
        score: parseFloat(expenseStats.approvalRate)
      }
    };

    // Calculate overall score
    const overallScore = (
      systemHealth.rooms.score +
      systemHealth.issues.score +
      systemHealth.tasks.score +
      systemHealth.expenses.score
    ) / 4;

    const response = {
      overview: {
        rooms: roomStats,
        issues: issueStats,
        tasks: taskStats,
        expenses: expenseStats,
        users: userStats,
        assignments: assignmentStats
      },
      auditorStats,
      supervisorRHStats,
      systemHealth,
      overallScore: overallScore.toFixed(2),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🚀 Dashboard response includes auditorStats:', !!response.auditorStats);
    console.log('🚀 Dashboard response includes supervisorRHStats:', !!response.supervisorRHStats);
    res.json(response);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard statistics',
      message: 'Erreur lors de la récupération des statistiques du tableau de bord'
    });
  }
});

module.exports = router; 