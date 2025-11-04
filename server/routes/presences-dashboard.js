const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Employee } = require('../models');
const { Pointage } = require('../models');
const { Op } = require('sequelize');
const { getPrestationPeriod, getPrestationPeriodName, getPrestationPeriodDescription } = require('../utils/dateUtils');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/presences-dashboard/stats - Récupérer les statistiques du tableau de bord des présences
router.get('/stats', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    // Récupérer tous les employés actifs
    const employes = await Employee.findAll({
      where: { statut: 'Actif' },
      attributes: ['id', 'civilite', 'nom_famille', 'prenoms', 'poste', 'photo_url'],
      order: [['nom_famille', 'ASC'], ['prenoms', 'ASC']]
    });

    // Utiliser la période de prestation RH (21 du mois précédent au 20 du mois en cours)
    const period = getPrestationPeriod(parseInt(year), parseInt(month));
    const periodName = getPrestationPeriodName(parseInt(year), parseInt(month));
    const periodDescription = getPrestationPeriodDescription(parseInt(year), parseInt(month));
    
    const pointages = await Pointage.findAll({
      where: {
        date_pointage: {
          [Op.between]: [period.startDate, period.endDate]
        }
      },
      attributes: ['employe_id', 'present', 'date_pointage']
    });

    // Calculer les statistiques
    const totalEmployes = employes.length;
    const totalJoursMois = period.totalDays;
    
    // Compter les présences par employé
    const presencesParEmploye = {};
    pointages.forEach(pointage => {
      if (!presencesParEmploye[pointage.employe_id]) {
        presencesParEmploye[pointage.employe_id] = 0;
      }
      if (pointage.present) {
        presencesParEmploye[pointage.employe_id]++;
      }
    });

    // Calculer le taux de présence global
    const totalPresences = Object.values(presencesParEmploye).reduce((sum, count) => sum + count, 0);
    const tauxPresence = totalEmployes > 0 ? ((totalPresences / (totalEmployes * totalJoursMois)) * 100).toFixed(1) : 0;

    // Préparer les données des employés avec leurs présences
    const employesAvecPresences = employes.map(employe => {
      const presences = presencesParEmploye[employe.id] || 0;
      const tauxPresenceEmploye = totalJoursMois > 0 ? ((presences / totalJoursMois) * 100).toFixed(1) : 0;
      
      return {
        id: employe.id,
        civilite: employe.civilite,
        nom_famille: employe.nom_famille,
        prenoms: employe.prenoms,
        nom_complet: `${employe.prenoms} ${employe.nom_famille}`,
        poste: employe.poste,
        photo_url: employe.photo_url,
        presences: presences,
        taux_presence: parseFloat(tauxPresenceEmploye)
      };
    });

    res.json({
      success: true,
      data: {
        employes: employesAvecPresences,
        statistiques: {
          total_employes: totalEmployes,
          total_jours_mois: totalJoursMois,
          total_presences: totalPresences,
          taux_presence_global: parseFloat(tauxPresence)
        },
        mois: {
          annee: parseInt(year),
          mois: parseInt(month),
          nom: periodName,
          description: periodDescription,
          periode_prestation: {
            date_debut: period.startDate.toISOString().split('T')[0],
            date_fin: period.endDate.toISOString().split('T')[0],
            total_jours: period.totalDays
          }
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des présences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques des présences'
    });
  }
});

// GET /api/presences-dashboard/employes - Récupérer la liste des employés pour le tableau de bord
router.get('/employes', async (req, res) => {
  try {
    const { search } = req.query;
    
    let whereClause = { statut: 'Actif' };
    
    if (search) {
      whereClause[Op.or] = [
        { nom_famille: { [Op.like]: `%${search}%` } },
        { prenoms: { [Op.like]: `%${search}%` } },
        { poste: { [Op.like]: `%${search}%` } }
      ];
    }

    const employes = await Employee.findAll({
      where: whereClause,
      attributes: ['id', 'civilite', 'nom_famille', 'prenoms', 'poste', 'photo_url', 'email_personnel'],
      order: [['nom_famille', 'ASC'], ['prenoms', 'ASC']]
    });

    res.json({
      success: true,
      data: employes,
      count: employes.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des employés'
    });
  }
});

// GET /api/presences-dashboard/pointages/:employe_id - Récupérer les pointages d'un employé pour un mois
router.get('/pointages/:employe_id', async (req, res) => {
  try {
    const { employe_id } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    // Utiliser la période de prestation RH (21 du mois précédent au 20 du mois en cours)
    const period = getPrestationPeriod(parseInt(year), parseInt(month));
    
    const pointages = await Pointage.findAll({
      where: {
        employe_id: parseInt(employe_id),
        date_pointage: {
          [Op.between]: [period.startDate, period.endDate]
        }
      },
      attributes: ['id', 'date_pointage', 'present', 'heure_arrivee', 'heure_depart', 'commentaires'],
      order: [['date_pointage', 'ASC']]
    });

    res.json({
      success: true,
      data: pointages,
      count: pointages.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des pointages de l\'employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des pointages'
    });
  }
});

module.exports = router;
