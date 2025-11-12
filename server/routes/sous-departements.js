const express = require('express');
const { body, validationResult, query } = require('express-validator');
const SousDepartement = require('../models/SousDepartement');
const Departement = require('../models/Departement');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/sous-departements - Get all sous-departments with filtering
router.get('/', [
  query('departement_id').optional().isInt(),
  query('statut').optional().isIn(['Actif', 'Inactif', 'En développement']),
  query('niveau_hierarchie').optional().isInt({ min: 1, max: 5 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 10000 })
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

    const { departement_id, statut, niveau_hierarchie, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (departement_id) whereClause.departement_id = departement_id;
    if (statut) whereClause.statut = statut;
    if (niveau_hierarchie) whereClause.niveau_hierarchie = niveau_hierarchie;

    const { count, rows: sousDepartements } = await SousDepartement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code', 'couleur']
        },
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['niveau_hierarchie', 'ASC'], ['nom', 'ASC']]
    });

    res.json({
      sousDepartements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get sous-departments error:', error);
    res.status(500).json({ 
      error: 'Failed to get sous-departments',
      message: 'Erreur lors de la récupération des sous-départements'
    });
  }
});

// GET /api/sous-departements/:id - Get specific sous-department
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sousDepartement = await SousDepartement.findByPk(id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code', 'couleur']
        },
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    if (!sousDepartement) {
      return res.status(404).json({ 
        error: 'Sous-department not found',
        message: 'Sous-département non trouvé'
      });
    }

    res.json({ sousDepartement });

  } catch (error) {
    console.error('Get sous-department error:', error);
    res.status(500).json({ 
      error: 'Failed to get sous-department',
      message: 'Erreur lors de la récupération du sous-département'
    });
  }
});

// POST /api/sous-departements - Create new sous-department
router.post('/', [
  requireRole('Administrateur'),
  body('nom').isLength({ min: 1, max: 100 }),
  body('code').isLength({ min: 1, max: 15 }),
  body('description').optional().isLength({ max: 1000 }),
  body('departement_id').isInt(),
  body('responsable_id').optional().isInt(),
  body('budget_annuel').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  body('statut').isIn(['Actif', 'Inactif', 'En développement']),
  body('niveau_hierarchie').isInt({ min: 1, max: 5 }),
  body('couleur').optional().matches(/^#[0-9A-F]{6}$/i),
  body('capacite_equipe').optional().isInt({ min: 1, max: 100 }),
  body('localisation').optional().isLength({ max: 100 })
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

    const sousDepartementData = req.body;
    
    // Check if sous-department code already exists
    const existingSousDepartement = await SousDepartement.findOne({ 
      where: { code: sousDepartementData.code }
    });

    if (existingSousDepartement) {
      return res.status(400).json({ 
        error: 'Sous-department code already exists',
        message: 'Ce code de sous-département existe déjà'
      });
    }

    // Check if department exists
    const departement = await Departement.findByPk(sousDepartementData.departement_id);
    if (!departement) {
      return res.status(400).json({ 
        error: 'Department not found',
        message: 'Le département spécifié n\'existe pas'
      });
    }

    // Check if responsable exists if provided
    if (sousDepartementData.responsable_id) {
      const responsable = await User.findByPk(sousDepartementData.responsable_id);
      if (!responsable) {
        return res.status(400).json({ 
          error: 'Responsable not found',
          message: 'Le responsable spécifié n\'existe pas'
        });
      }
    }

    const sousDepartement = await SousDepartement.create(sousDepartementData);

    // Fetch the created sous-department with related info
    const createdSousDepartement = await SousDepartement.findByPk(sousDepartement.id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code', 'couleur']
        },
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Sous-département créé avec succès',
      sousDepartement: createdSousDepartement
    });

  } catch (error) {
    console.error('Create sous-department error:', error);
    res.status(500).json({ 
      error: 'Failed to create sous-department',
      message: 'Erreur lors de la création du sous-département'
    });
  }
});

// PUT /api/sous-departements/:id - Update sous-department
router.put('/:id', [
  requireRole('Administrateur'),
  body('nom').optional().isLength({ min: 1, max: 100 }),
  body('code').optional().isLength({ min: 1, max: 15 }),
  body('description').optional().isLength({ max: 1000 }),
  body('departement_id').optional().isInt(),
  body('responsable_id').optional().isInt(),
  body('budget_annuel').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  body('statut').optional().isIn(['Actif', 'Inactif', 'En développement']),
  body('niveau_hierarchie').optional().isInt({ min: 1, max: 5 }),
  body('couleur').optional().matches(/^#[0-9A-F]{6}$/i),
  body('capacite_equipe').optional().isInt({ min: 1, max: 100 }),
  body('localisation').optional().isLength({ max: 100 })
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
    const sousDepartementData = req.body;

    const sousDepartement = await SousDepartement.findByPk(id);
    if (!sousDepartement) {
      return res.status(404).json({ 
        error: 'Sous-department not found',
        message: 'Sous-département non trouvé'
      });
    }

    // Check if new code already exists (if code is being updated)
    if (sousDepartementData.code && sousDepartementData.code !== sousDepartement.code) {
      const existingSousDepartement = await SousDepartement.findOne({ 
        where: { code: sousDepartementData.code }
      });

      if (existingSousDepartement) {
        return res.status(400).json({ 
          error: 'Sous-department code already exists',
          message: 'Ce code de sous-département existe déjà'
        });
      }
    }

    // Check if department exists if being updated
    if (sousDepartementData.departement_id) {
      const departement = await Departement.findByPk(sousDepartementData.departement_id);
      if (!departement) {
        return res.status(400).json({ 
          error: 'Department not found',
          message: 'Le département spécifié n\'existe pas'
        });
      }
    }

    // Check if responsable exists if provided
    if (sousDepartementData.responsable_id) {
      const responsable = await User.findByPk(sousDepartementData.responsable_id);
      if (!responsable) {
        return res.status(400).json({ 
          error: 'Responsable not found',
          message: 'Le responsable spécifié n\'existe pas'
        });
      }
    }

    await sousDepartement.update(sousDepartementData);

    // Fetch the updated sous-department with related info
    const updatedSousDepartement = await SousDepartement.findByPk(id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code', 'couleur']
        },
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    res.json({
      message: 'Sous-département mis à jour avec succès',
      sousDepartement: updatedSousDepartement
    });

  } catch (error) {
    console.error('Update sous-department error:', error);
    res.status(500).json({ 
      error: 'Failed to update sous-department',
      message: 'Erreur lors de la mise à jour du sous-département'
    });
  }
});

// DELETE /api/sous-departements/:id - Delete sous-department
router.delete('/:id', [
  requireRole('Administrateur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const sousDepartement = await SousDepartement.findByPk(id);

    if (!sousDepartement) {
      return res.status(404).json({ 
        error: 'Sous-department not found',
        message: 'Sous-département non trouvé'
      });
    }

    // Check if sous-department can be deleted (no active users, etc.)
    // Add your business logic here if needed

    await sousDepartement.destroy();

    res.json({
      message: 'Sous-département supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete sous-department error:', error);
    res.status(500).json({ 
      error: 'Failed to delete sous-department',
      message: 'Erreur lors de la suppression du sous-département'
    });
  }
});

// GET /api/sous-departements/stats/overview - Get sous-department statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalSousDepartements = await SousDepartement.count();
    const sousDepartementsActifs = await SousDepartement.count({ where: { statut: 'Actif' } });
    const sousDepartementsInactifs = await SousDepartement.count({ where: { statut: 'Inactif' } });
    const sousDepartementsEnDeveloppement = await SousDepartement.count({ where: { statut: 'En développement' } });

    const budgetTotal = await SousDepartement.sum('budget_annuel', { 
      where: { 
        budget_annuel: { [require('sequelize').Op.not]: null } 
      } 
    });

    // Statistiques par niveau hiérarchique
    const statsParNiveau = await SousDepartement.findAll({
      attributes: [
        'niveau_hierarchie',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['niveau_hierarchie'],
      order: [['niveau_hierarchie', 'ASC']]
    });

    res.json({
      total: totalSousDepartements,
      actifs: sousDepartementsActifs,
      inactifs: sousDepartementsInactifs,
      enDeveloppement: sousDepartementsEnDeveloppement,
      budgetTotal: budgetTotal || 0,
      statsParNiveau: statsParNiveau
    });

  } catch (error) {
    console.error('Get sous-department stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get sous-department stats',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/sous-departements/by-departement/:departementId - Get sous-departments by department
router.get('/by-departement/:departementId', async (req, res) => {
  try {
    const { departementId } = req.params;
    
    // Check if department exists
    const departement = await Departement.findByPk(departementId);
    if (!departement) {
      return res.status(404).json({ 
        error: 'Department not found',
        message: 'Le département spécifié n\'existe pas'
      });
    }

    const sousDepartements = await SousDepartement.findAll({
      where: { departement_id: departementId },
      include: [
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['niveau_hierarchie', 'ASC'], ['nom', 'ASC']]
    });

    res.json({
      departement: {
        id: departement.id,
        nom: departement.nom,
        code: departement.code,
        couleur: departement.couleur
      },
      sousDepartements
    });

  } catch (error) {
    console.error('Get sous-departments by department error:', error);
    res.status(500).json({ 
      error: 'Failed to get sous-departments by department',
      message: 'Erreur lors de la récupération des sous-départements'
    });
  }
});

module.exports = router;
