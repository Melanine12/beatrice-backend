const express = require('express');
const { body, validationResult, query } = require('express-validator');
const NettoyageEspacesPublics = require('../models/NettoyageEspacesPublics');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/nettoyage-espaces-publics - Get all public space cleanings with filtering
router.get('/', [
  query('agent_id').optional().isInt({ min: 1 }),
  query('superviseur_id').optional().isInt({ min: 1 }),
  query('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']),
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
      agent_id, 
      superviseur_id, 
      statut, 
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
    if (agent_id) whereClause.agent_id = agent_id;
    if (superviseur_id) whereClause.superviseur_id = superviseur_id;
    if (statut) whereClause.statut = statut;
    if (shift) whereClause.shift = shift;
    
    // Date range filtering
    if (date_debut || date_fin) {
      whereClause.date_nettoyage = {};
      if (date_debut) whereClause.date_nettoyage[Op.gte] = new Date(date_debut);
      if (date_fin) whereClause.date_nettoyage[Op.lte] = new Date(date_fin);
    }

    const { count, rows: nettoyages } = await NettoyageEspacesPublics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
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
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_nettoyage', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      nettoyages: nettoyages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get public space cleanings error:', error);
    res.status(500).json({ 
      error: 'Failed to get public space cleanings',
      message: 'Erreur lors de la récupération des nettoyages d\'espaces publics'
    });
  }
});

// GET /api/nettoyage-espaces-publics/:id - Get specific public space cleaning
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const nettoyage = await NettoyageEspacesPublics.findByPk(id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
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

    if (!nettoyage) {
      return res.status(404).json({ 
        error: 'Public space cleaning not found',
        message: 'Nettoyage d\'espace public non trouvé'
      });
    }

    res.json({ 
      success: true,
      nettoyage: nettoyage 
    });

  } catch (error) {
    console.error('Get public space cleaning error:', error);
    res.status(500).json({ 
      error: 'Failed to get public space cleaning',
      message: 'Erreur lors de la récupération du nettoyage d\'espace public'
    });
  }
});

// POST /api/nettoyage-espaces-publics - Create new public space cleaning
router.post('/', [
  body('date_nettoyage').isISO8601().toDate(),
  body('shift').isIn(['Matin', 'Après-midi', 'Soir', 'Nuit']),
  body('agent_id').isInt({ min: 1 }),
  body('nom_agent').isLength({ min: 1, max: 255 }),
  body('superviseur_id').isInt({ min: 1 }),
  body('nom_superviseur').isLength({ min: 1, max: 255 }),
  body('espaces_nettoyes').isObject(),
  body('taches_effectuees').isObject(),
  body('verification_finale').isObject(),
  body('observations_generales').optional().isLength({ max: 2000 }),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté'])
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

    // Verify agent exists
    const agent = await User.findByPk(req.body.agent_id);
    if (!agent) {
      return res.status(400).json({ 
        error: 'Agent not found',
        message: 'Agent non trouvé'
      });
    }

    // Verify supervisor exists
    const superviseur = await User.findByPk(req.body.superviseur_id);
    if (!superviseur) {
      return res.status(400).json({ 
        error: 'Supervisor not found',
        message: 'Superviseur non trouvé'
      });
    }

    // Auto-generate names if not provided
    const nomAgent = req.body.nom_agent || `${agent.prenom} ${agent.nom}`;
    const nomSuperviseur = req.body.nom_superviseur || `${superviseur.prenom} ${superviseur.nom}`;

    const nettoyageData = {
      ...req.body,
      nom_agent: nomAgent,
      nom_superviseur: nomSuperviseur,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const nettoyage = await NettoyageEspacesPublics.create(nettoyageData);

    // Fetch the created nettoyage with associations
    const createdNettoyage = await NettoyageEspacesPublics.findByPk(nettoyage.id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
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
      message: 'Nettoyage d\'espace public créé avec succès',
      nettoyage: createdNettoyage
    });

  } catch (error) {
    console.error('Create public space cleaning error:', error);
    res.status(500).json({ 
      error: 'Failed to create public space cleaning',
      message: 'Erreur lors de la création du nettoyage d\'espace public'
    });
  }
});

// PUT /api/nettoyage-espaces-publics/:id - Update public space cleaning
router.put('/:id', [
  body('date_nettoyage').optional().isISO8601().toDate(),
  body('shift').optional().isIn(['Matin', 'Après-midi', 'Soir', 'Nuit']),
  body('agent_id').optional().isInt({ min: 1 }),
  body('nom_agent').optional().isLength({ min: 1, max: 255 }),
  body('superviseur_id').optional().isInt({ min: 1 }),
  body('nom_superviseur').optional().isLength({ min: 1, max: 255 }),
  body('espaces_nettoyes').optional().isObject(),
  body('taches_effectuees').optional().isObject(),
  body('verification_finale').optional().isObject(),
  body('observations_generales').optional().isLength({ max: 2000 }),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté'])
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
    const nettoyage = await NettoyageEspacesPublics.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({ 
        error: 'Public space cleaning not found',
        message: 'Nettoyage d\'espace public non trouvé'
      });
    }

    // Verify agent exists if agent_id is being updated
    if (req.body.agent_id) {
      const agent = await User.findByPk(req.body.agent_id);
      if (!agent) {
        return res.status(400).json({ 
          error: 'Agent not found',
          message: 'Agent non trouvé'
        });
      }
    }

    // Verify supervisor exists if superviseur_id is being updated
    if (req.body.superviseur_id) {
      const superviseur = await User.findByPk(req.body.superviseur_id);
      if (!superviseur) {
        return res.status(400).json({ 
          error: 'Supervisor not found',
          message: 'Superviseur non trouvé'
        });
      }
    }

    // Auto-generate names if IDs are updated
    if (req.body.agent_id && !req.body.nom_agent) {
      const agent = await User.findByPk(req.body.agent_id);
      req.body.nom_agent = `${agent.prenom} ${agent.nom}`;
    }
    if (req.body.superviseur_id && !req.body.nom_superviseur) {
      const superviseur = await User.findByPk(req.body.superviseur_id);
      req.body.nom_superviseur = `${superviseur.prenom} ${superviseur.nom}`;
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    await nettoyage.update(updateData);

    // Fetch the updated nettoyage with associations
    const updatedNettoyage = await NettoyageEspacesPublics.findByPk(id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
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
      message: 'Nettoyage d\'espace public mis à jour avec succès',
      nettoyage: updatedNettoyage
    });

  } catch (error) {
    console.error('Update public space cleaning error:', error);
    res.status(500).json({ 
      error: 'Failed to update public space cleaning',
      message: 'Erreur lors de la mise à jour du nettoyage d\'espace public'
    });
  }
});

// DELETE /api/nettoyage-espaces-publics/:id - Delete public space cleaning
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const nettoyage = await NettoyageEspacesPublics.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({ 
        error: 'Public space cleaning not found',
        message: 'Nettoyage d\'espace public non trouvé'
      });
    }

    await nettoyage.destroy();

    res.json({
      success: true,
      message: 'Nettoyage d\'espace public supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete public space cleaning error:', error);
    res.status(500).json({ 
      error: 'Failed to delete public space cleaning',
      message: 'Erreur lors de la suppression du nettoyage d\'espace public'
    });
  }
});

// PATCH /api/nettoyage-espaces-publics/:id/status - Update status
router.patch('/:id/status', [
  body('statut').isIn(['En cours', 'Terminé', 'Validé', 'Rejeté'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Statut invalide',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { statut } = req.body;
    
    const nettoyage = await NettoyageEspacesPublics.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({ 
        error: 'Public space cleaning not found',
        message: 'Nettoyage d\'espace public non trouvé'
      });
    }

    await nettoyage.update({ 
      statut: statut,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      statut: statut
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      error: 'Failed to update status',
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// GET /api/nettoyage-espaces-publics/stats/overview - Get cleaning statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    
    const stats = await NettoyageEspacesPublics.getStatsByDate(date_debut, date_fin);

    // Additional stats
    const shiftStats = await NettoyageEspacesPublics.findAll({
      attributes: [
        'shift',
        [NettoyageEspacesPublics.sequelize.fn('COUNT', NettoyageEspacesPublics.sequelize.col('id')), 'count']
      ],
      group: ['shift'],
      where: date_debut && date_fin ? {
        date_nettoyage: {
          [require('sequelize').Op.between]: [date_debut, date_fin]
        }
      } : {}
    });

    // Top agents
    const topAgents = await NettoyageEspacesPublics.findAll({
      attributes: [
        'agent_id',
        'nom_agent',
        [NettoyageEspacesPublics.sequelize.fn('COUNT', NettoyageEspacesPublics.sequelize.col('id')), 'count']
      ],
      group: ['agent_id', 'nom_agent'],
      order: [[NettoyageEspacesPublics.sequelize.fn('COUNT', NettoyageEspacesPublics.sequelize.col('id')), 'DESC']],
      limit: 10,
      where: date_debut && date_fin ? {
        date_nettoyage: {
          [require('sequelize').Op.between]: [date_debut, date_fin]
        }
      } : {}
    });

    res.json({
      success: true,
      stats: {
        ...stats,
        completion_rate: stats.total_nettoyages > 0 ? 
          ((stats.nettoyages_valides / stats.total_nettoyages) * 100).toFixed(2) : 0
      },
      shift_stats: shiftStats,
      top_agents: topAgents
    });

  } catch (error) {
    console.error('Get cleaning stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get cleaning statistics',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/nettoyage-espaces-publics/stats/agent/:agentId - Get agent statistics
router.get('/stats/agent/:agentId', [
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601()
], async (req, res) => {
  try {
    const { agentId } = req.params;
    const { date_debut, date_fin } = req.query;

    const stats = await NettoyageEspacesPublics.getStatsByAgent(agentId, date_debut, date_fin);

    res.json({
      success: true,
      agent_id: agentId,
      stats
    });

  } catch (error) {
    console.error('Get agent cleaning stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get agent cleaning statistics',
      message: 'Erreur lors de la récupération des statistiques agent'
    });
  }
});

// GET /api/nettoyage-espaces-publics/stats/shift/:shift - Get shift statistics
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

    const stats = await NettoyageEspacesPublics.getStatsByShift(shift, date_debut, date_fin);

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

// GET /api/nettoyage-espaces-publics/options/users - Get users for dropdown
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
      attributes: ['id', 'nom', 'prenom', 'email', 'role'],
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
        email: user.email,
        role: user.role
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

module.exports = router;
