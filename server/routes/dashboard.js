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
      auditorStats
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
        
        return {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          urgent: urgentIssues,
          resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) : 0
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
        
        return {
          total: totalTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          urgent: urgentTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
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
          bonsPrelevementApproved = await BonMenage.count({
            where: {
              etat_chambre_apres_entretien: 'Parfait',
              date_creation: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
        } catch (error) {
          console.log('⚠️  Erreur BonMenage:', error.message);
        }

        // Bons de demandes approuvés du jour
        let bonsDemandesApproved = 0;
        try {
          bonsDemandesApproved = await Demande.count({
            where: {
              statut: 'Approuvée',
              date_creation: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
        } catch (error) {
          console.log('⚠️  Erreur Demande:', error.message);
        }

        // Employés présents du jour
        let employesPresents = 0;
        try {
          employesPresents = await Pointage.count({
            where: {
              present: true,
              date_pointage: {
                [Op.between]: [startOfDay, endOfDay]
              }
            }
          });
        } catch (error) {
          console.log('⚠️  Erreur Pointage:', error.message);
        }

        // Articles en rupture de stock
        let articlesRuptureStock = 0;
        try {
          articlesRuptureStock = await Inventaire.count({
            where: {
              quantite_stock: {
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
          
          chambresOccupees = await Chambre.count({
            where: { statut: 'Occupée' }
          });
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
      systemHealth,
      overallScore: overallScore.toFixed(2),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🚀 Dashboard response includes auditorStats:', !!response.auditorStats);
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