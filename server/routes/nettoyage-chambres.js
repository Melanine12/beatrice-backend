const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { NettoyageChambre, User, Chambre } = require('../models');
const { authenticateToken } = require('../middleware/auth'); // Fixed import path

const router = express.Router();

// Validation personnalisée pour les objets JSON
const validateJsonField = (fieldName) => {
  return body(fieldName).custom((value) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`${fieldName} doit être un objet valide`);
    }
    return true;
  });
};

// Validation pour les heures
const validateTime = (fieldName) => {
  return body(fieldName).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage(`${fieldName} doit être au format HH:MM`);
};

// GET /api/nettoyage-chambres - Récupérer tous les nettoyages avec filtres
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('date_nettoyage').optional().isDate().withMessage('Date de nettoyage invalide'),
  query('numero_chambre').optional().isString().withMessage('Numéro de chambre invalide'),
  query('agent_id').optional().isInt().withMessage('ID agent invalide'),
  query('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide'),
  query('search').optional().isString().withMessage('Recherche invalide')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      date_nettoyage,
      numero_chambre,
      agent_id,
      statut,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtres
    if (date_nettoyage) whereClause.date_nettoyage = date_nettoyage;
    if (numero_chambre) whereClause.numero_chambre = numero_chambre;
    if (agent_id) whereClause.agent_id = agent_id;
    if (statut) whereClause.statut = statut;
    if (search) {
      whereClause[Op.or] = [
        { nom_agent: { [Op.like]: `%${search}%` } },
        { numero_chambre: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await NettoyageChambre.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Agent',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'Chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ],
      order: [['date_nettoyage', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching nettoyage chambres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des nettoyages de chambres',
      error: error.message
    });
  }
});

// GET /api/nettoyage-chambres/:id - Récupérer un nettoyage par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nettoyage = await NettoyageChambre.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Agent',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'Chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ]
    });

    if (!nettoyage) {
      return res.status(404).json({
        success: false,
        message: 'Nettoyage de chambre non trouvé'
      });
    }

    res.json({
      success: true,
      data: nettoyage
    });
  } catch (error) {
    console.error('Error fetching nettoyage chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nettoyage de chambre',
      error: error.message
    });
  }
});

// GET /api/nettoyage-chambres/agent/:agentId - Récupérer les nettoyages d'un agent
router.get('/agent/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { date_debut, date_fin } = req.query;

    const whereClause = { agent_id: agentId };
    if (date_debut) whereClause.date_nettoyage = { [Op.gte]: date_debut };
    if (date_fin) whereClause.date_nettoyage = { ...whereClause.date_nettoyage, [Op.lte]: date_fin };

    const nettoyages = await NettoyageChambre.findAll({
      where: whereClause,
      include: [
        {
          model: Chambre,
          as: 'Chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ],
      order: [['date_nettoyage', 'DESC']]
    });

    res.json({
      success: true,
      data: nettoyages
    });
  } catch (error) {
    console.error('Error fetching agent nettoyages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des nettoyages de l\'agent',
      error: error.message
    });
  }
});

// GET /api/nettoyage-chambres/chambre/:chambreId - Récupérer les nettoyages d'une chambre
router.get('/chambre/:chambreId', authenticateToken, async (req, res) => {
  try {
    const { chambreId } = req.params;
    const { date_debut, date_fin } = req.query;

    const whereClause = { chambre_id: chambreId };
    if (date_debut) whereClause.date_nettoyage = { [Op.gte]: date_debut };
    if (date_fin) whereClause.date_nettoyage = { ...whereClause.date_nettoyage, [Op.lte]: date_fin };

    const nettoyages = await NettoyageChambre.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Agent',
          attributes: ['id', 'prenom', 'nom', 'email']
        }
      ],
      order: [['date_nettoyage', 'DESC']]
    });

    res.json({
      success: true,
      data: nettoyages
    });
  } catch (error) {
    console.error('Error fetching chambre nettoyages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des nettoyages de la chambre',
      error: error.message
    });
  }
});

// GET /api/nettoyage-chambres/stats/overview - Statistiques générales
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    const whereClause = {};
    if (date_debut) whereClause.date_nettoyage = { [Op.gte]: date_debut };
    if (date_fin) whereClause.date_nettoyage = { ...whereClause.date_nettoyage, [Op.lte]: date_fin };

    const stats = await NettoyageChambre.findAll({
      where: whereClause,
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut']
    });

    const total = stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
    const statsByStatus = stats.reduce((acc, stat) => {
      acc[stat.statut] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total,
        par_statut: statsByStatus,
        en_cours: statsByStatus['En cours'] || 0,
        termines: statsByStatus['Terminé'] || 0,
        valides: statsByStatus['Validé'] || 0,
        rejetes: statsByStatus['Rejeté'] || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// GET /api/nettoyage-chambres/options/users - Options pour les utilisateurs
router.get('/options/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'prenom', 'nom', 'email'],
      where: {
        statut: 'Actif'
      },
      order: [['prenom', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users options:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
});

// POST /api/nettoyage-chambres - Créer un nouveau nettoyage
router.post('/', [
  body('nom_agent').notEmpty().withMessage('Nom de l\'agent requis'),
  body('date_nettoyage').isDate().withMessage('Date de nettoyage invalide'),
  body('numero_chambre').notEmpty().withMessage('Numéro de chambre requis'),
  body('type_chambre').isIn(['Standard', 'Twis', 'Suite Junior', 'Suite diplomatique']).withMessage('Type de chambre invalide'),
  validateTime('heure_entree'),
  validateTime('heure_sortie'),
  body('signature').optional().isString(),
  validateJsonField('etat_avant_nettoyage'),
  validateJsonField('taches_nettoyage'),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']),
  body('observations_generales').optional().isString(),
  body('agent_id').optional().isInt(),
  body('chambre_id').optional().isInt()
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const nettoyageData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const nettoyage = await NettoyageChambre.create(nettoyageData);

    // Récupérer le nettoyage avec les relations
    const nettoyageWithRelations = await NettoyageChambre.findByPk(nettoyage.id, {
      include: [
        {
          model: User,
          as: 'Agent',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'Chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Nettoyage de chambre créé avec succès',
      data: nettoyageWithRelations
    });
  } catch (error) {
    console.error('Error creating nettoyage chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du nettoyage de chambre',
      error: error.message
    });
  }
});

// PUT /api/nettoyage-chambres/:id - Mettre à jour un nettoyage
router.put('/:id', [
  body('nom_agent').optional().notEmpty().withMessage('Nom de l\'agent requis'),
  body('date_nettoyage').optional().isDate().withMessage('Date de nettoyage invalide'),
  body('numero_chambre').optional().notEmpty().withMessage('Numéro de chambre requis'),
  body('type_chambre').optional().isIn(['Standard', 'Twis', 'Suite Junior', 'Suite diplomatique']).withMessage('Type de chambre invalide'),
  body('heure_entree').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure d\'entrée invalide'),
  body('heure_sortie').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de sortie invalide'),
  body('signature').optional().isString(),
  body('etat_avant_nettoyage').optional().custom((value) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error('État avant nettoyage doit être un objet valide');
    }
    return true;
  }),
  body('taches_nettoyage').optional().custom((value) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Tâches de nettoyage doivent être un objet valide');
    }
    return true;
  }),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']),
  body('observations_generales').optional().isString(),
  body('agent_id').optional().isInt(),
  body('chambre_id').optional().isInt()
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const nettoyage = await NettoyageChambre.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({
        success: false,
        message: 'Nettoyage de chambre non trouvé'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    await nettoyage.update(updateData);

    // Récupérer le nettoyage mis à jour avec les relations
    const updatedNettoyage = await NettoyageChambre.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Agent',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'Chambre',
          attributes: ['id', 'numero', 'type', 'etage']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Nettoyage de chambre mis à jour avec succès',
      data: updatedNettoyage
    });
  } catch (error) {
    console.error('Error updating nettoyage chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du nettoyage de chambre',
      error: error.message
    });
  }
});

// DELETE /api/nettoyage-chambres/:id - Supprimer un nettoyage
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nettoyage = await NettoyageChambre.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({
        success: false,
        message: 'Nettoyage de chambre non trouvé'
      });
    }

    await nettoyage.destroy();

    res.json({
      success: true,
      message: 'Nettoyage de chambre supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting nettoyage chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du nettoyage de chambre',
      error: error.message
    });
  }
});

// PATCH /api/nettoyage-chambres/:id/status - Mettre à jour le statut
router.patch('/:id/status', [
  body('statut').isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { statut } = req.body;

    const nettoyage = await NettoyageChambre.findByPk(id);

    if (!nettoyage) {
      return res.status(404).json({
        success: false,
        message: 'Nettoyage de chambre non trouvé'
      });
    }

    await nettoyage.update({
      statut,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: { id: nettoyage.id, statut }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

module.exports = router;
