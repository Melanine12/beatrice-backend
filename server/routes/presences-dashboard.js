const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Employee } = require('../models');
const { Pointage } = require('../models');
const { Op } = require('sequelize');

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

    // Récupérer les statistiques des pointages pour le mois
    const dateDebut = new Date(year, month - 1, 1);
    const dateFin = new Date(year, month, 0, 23, 59, 59);
    
    const pointages = await Pointage.findAll({
      where: {
        date_pointage: {
          [Op.between]: [dateDebut, dateFin]
        }
      },
      attributes: ['employe_id', 'present', 'date_pointage']
    });

    // Calculer les statistiques
    const totalEmployes = employes.length;
    const totalJoursMois = new Date(year, month, 0).getDate();
    
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
          nom: new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long' })
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
    
    const dateDebut = new Date(year, month - 1, 1);
    const dateFin = new Date(year, month, 0, 23, 59, 59);
    
    const pointages = await Pointage.findAll({
      where: {
        employe_id: parseInt(employe_id),
        date_pointage: {
          [Op.between]: [dateDebut, dateFin]
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
