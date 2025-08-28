const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { RappelPaiement, Depense, User } = require('../models');
const { Op } = require('sequelize');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// GET /api/rappels-paiement - Récupérer tous les rappels de paiement
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      depense_id,
      type_rappel,
      statut,
      date_debut,
      date_fin,
      utilisateur_id
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtres
    if (depense_id) whereClause.depense_id = depense_id;
    if (type_rappel) whereClause.type_rappel = type_rappel;
    if (statut) whereClause.statut = statut;
    if (utilisateur_id) whereClause.utilisateur_id = utilisateur_id;
    
    if (date_debut || date_fin) {
      whereClause.date_rappel = {};
      if (date_debut) whereClause.date_rappel[Op.gte] = new Date(date_debut);
      if (date_fin) whereClause.date_rappel[Op.lte] = new Date(date_fin);
    }

    const { count, rows: rappels } = await RappelPaiement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'date_paiement_prevue']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_rappel', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      rappels,
      pagination: {
        total: count,
        pages: totalPages,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/rappels-paiement/:id - Récupérer un rappel spécifique
router.get('/:id', async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'date_paiement_prevue', 'montant_paye', 'montant_restant']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    res.json({ rappel });
  } catch (error) {
    console.error('Erreur lors de la récupération du rappel de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /api/rappels-paiement - Créer un nouveau rappel de paiement
router.post('/', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const {
      depense_id,
      date_rappel,
      type_rappel,
      message
    } = req.body;

    // Validation des données
    if (!depense_id || !date_rappel || !type_rappel) {
      return res.status(400).json({ 
        error: 'depense_id, date_rappel et type_rappel sont requis' 
      });
    }

    // Vérifier que la dépense existe
    const depense = await Depense.findByPk(depense_id);
    if (!depense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Vérifier que la date de rappel n'est pas dans le passé
    if (new Date(date_rappel) < new Date()) {
      return res.status(400).json({ 
        error: 'La date de rappel ne peut pas être dans le passé' 
      });
    }

    // Créer le rappel
    const rappel = await RappelPaiement.create({
      depense_id,
      date_rappel,
      type_rappel,
      message,
      utilisateur_id: req.user.userId
    });

    // Récupérer le rappel avec les associations
    const rappelComplet = await RappelPaiement.findByPk(rappel.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'date_paiement_prevue']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    res.status(201).json({ 
      message: 'Rappel de paiement créé avec succès',
      rappel: rappelComplet
    });
  } catch (error) {
    console.error('Erreur lors de la création du rappel de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// PUT /api/rappels-paiement/:id - Mettre à jour un rappel de paiement
router.put('/:id', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id);
    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    const {
      date_rappel,
      type_rappel,
      message,
      statut
    } = req.body;

    // Mettre à jour le rappel
    await rappel.update({
      date_rappel: date_rappel || rappel.date_rappel,
      type_rappel: type_rappel || rappel.type_rappel,
      message: message !== undefined ? message : rappel.message,
      statut: statut || rappel.statut
    });

    // Récupérer le rappel mis à jour avec les associations
    const rappelMisAJour = await RappelPaiement.findByPk(rappel.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'date_paiement_prevue']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    res.json({ 
      message: 'Rappel de paiement mis à jour avec succès',
      rappel: rappelMisAJour
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rappel de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// DELETE /api/rappels-paiement/:id - Supprimer un rappel de paiement
router.delete('/:id', requireRole(['Administrateur']), async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id);
    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    await rappel.destroy();

    res.json({ message: 'Rappel de paiement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rappel de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/rappels-paiement/depense/:depense_id - Récupérer tous les rappels d'une dépense
router.get('/depense/:depense_id', async (req, res) => {
  try {
    const rappels = await RappelPaiement.findAll({
      where: { depense_id: req.params.depense_id },
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_rappel', 'ASC']]
    });

    res.json({ rappels });
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels de la dépense:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /api/rappels-paiement/:id/mark-sent - Marquer un rappel comme envoyé
router.post('/:id/mark-sent', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id);
    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    await rappel.markAsSent();

    res.json({ 
      message: 'Rappel marqué comme envoyé',
      rappel
    });
  } catch (error) {
    console.error('Erreur lors du marquage du rappel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /api/rappels-paiement/:id/mark-read - Marquer un rappel comme lu
router.post('/:id/mark-read', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id);
    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    await rappel.markAsRead();

    res.json({ 
      message: 'Rappel marqué comme lu',
      rappel
    });
  } catch (error) {
    console.error('Erreur lors du marquage du rappel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /api/rappels-paiement/:id/mark-processed - Marquer un rappel comme traité
router.post('/:id/mark-processed', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const rappel = await RappelPaiement.findByPk(req.params.id);
    if (!rappel) {
      return res.status(404).json({ error: 'Rappel de paiement non trouvé' });
    }

    await rappel.markAsProcessed();

    res.json({ 
      message: 'Rappel marqué comme traité',
      rappel
    });
  } catch (error) {
    console.error('Erreur lors du marquage du rappel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/rappels-paiement/urgent - Récupérer les rappels urgents
router.get('/urgent/urgent', async (req, res) => {
  try {
    const rappelsUrgents = await RappelPaiement.findAll({
      where: {
        date_rappel: {
          [Op.lte]: new Date()
        },
        statut: 'Programmé'
      },
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'date_paiement_prevue', 'urgence']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_rappel', 'ASC']]
    });

    res.json({ rappelsUrgents });
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels urgents:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/rappels-paiement/stats/summary - Statistiques des rappels
router.get('/stats/summary', async (req, res) => {
  try {
    const totalRappels = await RappelPaiement.count();
    const rappelsProgrammes = await RappelPaiement.count({ where: { statut: 'Programmé' } });
    const rappelsEnvoyes = await RappelPaiement.count({ where: { statut: 'Envoyé' } });
    const rappelsLus = await RappelPaiement.count({ where: { statut: 'Lu' } });
    const rappelsTraites = await RappelPaiement.count({ where: { statut: 'Traité' } });
    
    const rappelsParType = await RappelPaiement.findAll({
      attributes: [
        'type_rappel',
        [RappelPaiement.sequelize.fn('COUNT', RappelPaiement.sequelize.col('id')), 'count']
      ],
      group: ['type_rappel']
    });

    const rappelsParMois = await RappelPaiement.findAll({
      attributes: [
        [RappelPaiement.sequelize.fn('DATE_FORMAT', RappelPaiement.sequelize.col('date_rappel'), '%Y-%m'), 'mois'],
        [RappelPaiement.sequelize.fn('COUNT', RappelPaiement.sequelize.col('id')), 'count']
      ],
      group: ['mois'],
      order: [['mois', 'DESC']],
      limit: 12
    });

    res.json({
      stats: {
        total_rappels: totalRappels,
        rappels_programmes: rappelsProgrammes,
        rappels_envoyes: rappelsEnvoyes,
        rappels_lus: rappelsLus,
        rappels_traites: rappelsTraites,
        rappels_par_type: rappelsParType,
        rappels_par_mois: rappelsParMois
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

module.exports = router;
