const express = require('express');
const { body, validationResult, query } = require('express-validator');
const BonMenage = require('../models/BonMenage');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/bons-menage - Get all cleaning orders with filtering
router.get('/', [
  query('utilisateur_id').optional().isInt({ min: 1 }),
  query('numero_chambre_espace').optional().isLength({ min: 1, max: 100 }),
  query('etat_matin').optional().isIn(['Propre', 'Sale', 'Très sale', 'En désordre', 'Rien à signaler']),
  query('etat_chambre_apres_entretien').optional().isIn(['Parfait', 'Bon', 'Moyen', 'Problème signalé']),
  query('shift').optional().isIn(['Matin', 'Après-midi', 'Soir', 'Nuit']),
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Paramètres de validation invalides',
        errors: errors.array()
      });
    }

    const { 
      utilisateur_id, 
      numero_chambre_espace, 
      etat_matin, 
      etat_chambre_apres_entretien, 
      shift, 
      date_debut, 
      date_fin, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    // Build where clause
    const whereClause = {};
    if (utilisateur_id) whereClause.utilisateur_id = utilisateur_id;
    if (numero_chambre_espace) whereClause.numero_chambre_espace = { [Op.like]: `%${numero_chambre_espace}%` };
    if (etat_matin) whereClause.etat_matin = etat_matin;
    if (etat_chambre_apres_entretien) whereClause.etat_chambre_apres_entretien = etat_chambre_apres_entretien;
    if (shift) whereClause.shift = shift;
    
    // Date range filtering
    if (date_debut || date_fin) {
      whereClause.date_creation = {};
      if (date_debut) whereClause.date_creation[Op.gte] = new Date(date_debut);
      if (date_fin) whereClause.date_creation[Op.lte] = new Date(date_fin);
    }

    const { count, rows: bonsMenage } = await BonMenage.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: User,
          as: 'modificateur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_creation', 'DESC'], ['heure_entree', 'DESC']]
    });

    res.json({
      success: true,
      bons_menage: bonsMenage,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get cleaning orders error:', error);
    res.status(500).json({ 
      error: 'Failed to get cleaning orders',
      message: 'Erreur lors de la récupération des bons de ménage'
    });
  }
});

// GET /api/bons-menage/:id - Get specific cleaning order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bonMenage = await BonMenage.findByPk(id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: User,
          as: 'modificateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    if (!bonMenage) {
      return res.status(404).json({ 
        error: 'Cleaning order not found',
        message: 'Bon de ménage non trouvé'
      });
    }

    res.json({ 
      success: true,
      bon_menage: bonMenage 
    });

  } catch (error) {
    console.error('Get cleaning order error:', error);
    res.status(500).json({ 
      error: 'Failed to get cleaning order',
      message: 'Erreur lors de la récupération du bon de ménage'
    });
  }
});

// POST /api/bons-menage - Create new cleaning order
router.post('/', [
  body('utilisateur_id').isInt({ min: 1 }),
  body('nom_utilisateur').isLength({ min: 1, max: 255 }),
  body('numero_chambre_espace').isLength({ min: 1, max: 100 }),
  body('chambre_id').optional().isInt({ min: 1 }),
  body('etat_matin').isIn(['Propre', 'Sale', 'Très sale', 'En désordre', 'Rien à signaler']),
  body('designation').isLength({ min: 1, max: 2000 }),
  body('heure_entree').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('heure_sortie').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('etat_chambre_apres_entretien').isIn(['Parfait', 'Bon', 'Moyen', 'Problème signalé']),
  body('observation').optional().isLength({ max: 2000 }),
  body('shift').isIn(['Matin', 'Après-midi', 'Soir', 'Nuit'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    // Verify user exists
    const user = await User.findByPk(req.body.utilisateur_id);
    if (!user) {
      return res.status(400).json({ 
        error: 'User not found',
        message: 'Utilisateur non trouvé'
      });
    }

    // Auto-generate nom_utilisateur if not provided or different from user data
    const nomUtilisateur = req.body.nom_utilisateur || `${user.prenom} ${user.nom}`;

    const bonMenageData = {
      ...req.body,
      nom_utilisateur: nomUtilisateur,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const bonMenage = await BonMenage.create(bonMenageData);

    // Fetch the created bon with associations
    const createdBon = await BonMenage.findByPk(bonMenage.id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Bon de ménage créé avec succès',
      bon_menage: createdBon
    });

  } catch (error) {
    console.error('Create cleaning order error:', error);
    res.status(500).json({ 
      error: 'Failed to create cleaning order',
      message: 'Erreur lors de la création du bon de ménage'
    });
  }
});

// PUT /api/bons-menage/:id - Update cleaning order
router.put('/:id', [
  body('utilisateur_id').optional().isInt({ min: 1 }),
  body('nom_utilisateur').optional().isLength({ min: 1, max: 255 }),
  body('numero_chambre_espace').optional().isLength({ min: 1, max: 100 }),
  body('chambre_id').optional().isInt({ min: 1 }),
  body('etat_matin').optional().isIn(['Propre', 'Sale', 'Très sale', 'En désordre', 'Rien à signaler']),
  body('designation').optional().isLength({ min: 1, max: 2000 }),
  body('heure_entree').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('heure_sortie').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('etat_chambre_apres_entretien').optional().isIn(['Parfait', 'Bon', 'Moyen', 'Problème signalé']),
  body('observation').optional().isLength({ max: 2000 }),
  body('shift').optional().isIn(['Matin', 'Après-midi', 'Soir', 'Nuit'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const bonMenage = await BonMenage.findByPk(id);

    if (!bonMenage) {
      return res.status(404).json({ 
        error: 'Cleaning order not found',
        message: 'Bon de ménage non trouvé'
      });
    }

    // Verify user exists if utilisateur_id is being updated
    if (req.body.utilisateur_id) {
      const user = await User.findByPk(req.body.utilisateur_id);
      if (!user) {
        return res.status(400).json({ 
          error: 'User not found',
          message: 'Utilisateur non trouvé'
        });
      }
    }

    // Auto-generate nom_utilisateur if utilisateur_id is updated
    if (req.body.utilisateur_id && !req.body.nom_utilisateur) {
      const user = await User.findByPk(req.body.utilisateur_id);
      req.body.nom_utilisateur = `${user.prenom} ${user.nom}`;
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    await bonMenage.update(updateData);

    // Fetch the updated bon with associations
    const updatedBon = await BonMenage.findByPk(id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: User,
          as: 'modificateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Bon de ménage mis à jour avec succès',
      bon_menage: updatedBon
    });

  } catch (error) {
    console.error('Update cleaning order error:', error);
    res.status(500).json({ 
      error: 'Failed to update cleaning order',
      message: 'Erreur lors de la mise à jour du bon de ménage'
    });
  }
});

// DELETE /api/bons-menage/:id - Delete cleaning order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bonMenage = await BonMenage.findByPk(id);

    if (!bonMenage) {
      return res.status(404).json({ 
        error: 'Cleaning order not found',
        message: 'Bon de ménage non trouvé'
      });
    }

    await bonMenage.destroy();

    res.json({
      success: true,
      message: 'Bon de ménage supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete cleaning order error:', error);
    res.status(500).json({ 
      error: 'Failed to delete cleaning order',
      message: 'Erreur lors de la suppression du bon de ménage'
    });
  }
});

// GET /api/bons-menage/stats/overview - Get cleaning orders statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    // Basic counts
    const totalBons = await BonMenage.count();
    const bonsCompletes = await BonMenage.count({ 
      where: { 
        heure_sortie: { [Op.ne]: null } 
      } 
    });
    const bonsEnCours = await BonMenage.count({ 
      where: { 
        heure_sortie: null 
      } 
    });

    // Status distribution
    const etatMatinStats = await BonMenage.findAll({
      attributes: [
        'etat_matin',
        [BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'count']
      ],
      group: ['etat_matin']
    });

    const etatApresEntretienStats = await BonMenage.findAll({
      attributes: [
        'etat_chambre_apres_entretien',
        [BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'count']
      ],
      group: ['etat_chambre_apres_entretien']
    });

    // Shift distribution
    const shiftStats = await BonMenage.findAll({
      attributes: [
        'shift',
        [BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'count']
      ],
      group: ['shift']
    });

    // Average duration
    const avgDuration = await BonMenage.findAll({
      attributes: [
        [BonMenage.sequelize.fn('AVG', 
          BonMenage.sequelize.literal('TIMESTAMPDIFF(MINUTE, heure_entree, heure_sortie)')
        ), 'avg_duration_minutes']
      ],
      where: {
        heure_sortie: { [Op.ne]: null }
      },
      raw: true
    });

    // Top users by number of cleaning orders
    const topUsers = await BonMenage.findAll({
      attributes: [
        'utilisateur_id',
        'nom_utilisateur',
        [BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'count']
      ],
      group: ['utilisateur_id', 'nom_utilisateur'],
      order: [[BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // Top spaces by number of cleaning orders
    const topSpaces = await BonMenage.findAll({
      attributes: [
        'numero_chambre_espace',
        [BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'count']
      ],
      group: ['numero_chambre_espace'],
      order: [[BonMenage.sequelize.fn('COUNT', BonMenage.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        total: totalBons,
        completed: bonsCompletes,
        in_progress: bonsEnCours,
        completion_rate: totalBons > 0 ? ((bonsCompletes / totalBons) * 100).toFixed(2) : 0,
        avg_duration_minutes: avgDuration[0]?.avg_duration_minutes || 0
      },
      etat_matin_stats: etatMatinStats,
      etat_apres_entretien_stats: etatApresEntretienStats,
      shift_stats: shiftStats,
      top_users: topUsers,
      top_spaces: topSpaces
    });

  } catch (error) {
    console.error('Get cleaning orders stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get cleaning orders statistics',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/bons-menage/stats/user/:userId - Get user statistics
router.get('/stats/user/:userId', [
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601()
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { date_debut, date_fin } = req.query;

    const stats = await BonMenage.getStatsByUser(userId, date_debut, date_fin);

    res.json({
      success: true,
      user_id: userId,
      stats
    });

  } catch (error) {
    console.error('Get user cleaning stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get user cleaning statistics',
      message: 'Erreur lors de la récupération des statistiques utilisateur'
    });
  }
});

// GET /api/bons-menage/stats/space/:spaceNumber - Get space statistics
router.get('/stats/space/:spaceNumber', [
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601()
], async (req, res) => {
  try {
    const { spaceNumber } = req.params;
    const { date_debut, date_fin } = req.query;

    const stats = await BonMenage.getStatsByEspace(spaceNumber, date_debut, date_fin);

    res.json({
      success: true,
      numero_espace: spaceNumber,
      stats
    });

  } catch (error) {
    console.error('Get space cleaning stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get space cleaning statistics',
      message: 'Erreur lors de la récupération des statistiques d\'espace'
    });
  }
});

// GET /api/bons-menage/stats/shift/:shift - Get shift statistics
router.get('/stats/shift/:shift', [
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601()
], async (req, res) => {
  try {
    const { shift } = req.params;
    const { date_debut, date_fin } = req.query;

    // Validate shift parameter
    if (!['Matin', 'Après-midi', 'Soir', 'Nuit'].includes(shift)) {
      return res.status(400).json({ 
        error: 'Invalid shift',
        message: 'Équipe invalide'
      });
    }

    const stats = await BonMenage.getStatsByShift(shift, date_debut, date_fin);

    res.json({
      success: true,
      shift: shift,
      stats
    });

  } catch (error) {
    console.error('Get shift cleaning stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get shift cleaning statistics',
      message: 'Erreur lors de la récupération des statistiques d\'équipe'
    });
  }
});

// GET /api/bons-menage/options/users - Get users for dropdown
router.get('/options/users', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const search = req.query.search;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { prenom: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      attributes: ['id', 'nom', 'prenom', 'email'],
      where: whereClause,
      order: [['nom', 'ASC'], ['prenom', 'ASC']],
      limit
    });

    res.json({ 
      success: true,
      users: users.map(user => ({
        id: user.id,
        label: `${user.prenom} ${user.nom}`,
        value: user.id,
        email: user.email
      }))
    });
  } catch (error) {
    console.error('Error fetching users options:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des utilisateurs' 
    });
  }
});

// GET /api/bons-menage/options/spaces - Get spaces for dropdown
router.get('/options/spaces', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const Chambre = require('../models/Chambre');
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const search = req.query.search;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { numero: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } }
      ];
    }

    const spaces = await Chambre.findAll({
      attributes: ['id', 'numero', 'type', 'etage'],
      where: whereClause,
      order: [['numero', 'ASC']],
      limit
    });

    res.json({ 
      success: true,
      spaces: spaces.map(space => ({
        id: space.id,
        label: `${space.type} ${space.numero} (Étage ${space.etage})`,
        value: space.numero,
        numero: space.numero,
        type: space.type,
        etage: space.etage
      }))
    });
  } catch (error) {
    console.error('Error fetching spaces options:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des espaces' 
    });
  }
});

module.exports = router;
