const express = require('express');
const { body, validationResult, query } = require('express-validator');
const SousDepartement = require('../models/SousDepartement');
const Departement = require('../models/Departement');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/sous-departements - Get all sub-departments with filtering
router.get('/', [
  query('departement_id').optional().isInt(),
  query('statut').optional().isIn(['Actif', 'Inactif', 'En développement']),
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

    const { departement_id, statut, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (departement_id) whereClause.departement_id = departement_id;
    if (statut) whereClause.statut = statut;

    const { count, rows: sousDepartements } = await SousDepartement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code']
        },
        {
          model: User,
          as: 'Responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nom', 'ASC']]
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
    console.error('Get sub-departments error:', error);
    res.status(500).json({ 
      error: 'Failed to get sub-departments',
      message: 'Erreur lors de la récupération des sous-départements'
    });
  }
});

// GET /api/sous-departements/by-departement/:departement_id - Get sub-departments by department
router.get('/by-departement/:departement_id', async (req, res) => {
  try {
    const { departement_id } = req.params;
    
    const sousDepartements = await SousDepartement.findAll({
      where: { 
        departement_id: departement_id,
        statut: 'Actif'
      },
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code']
        }
      ],
      order: [['nom', 'ASC']]
    });

    res.json({ sousDepartements });

  } catch (error) {
    console.error('Get sub-departments by department error:', error);
    res.status(500).json({ 
      error: 'Failed to get sub-departments',
      message: 'Erreur lors de la récupération des sous-départements'
    });
  }
});

// GET /api/sous-departements/:id - Get specific sub-department
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sousDepartement = await SousDepartement.findByPk(id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code']
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
        error: 'Sub-department not found',
        message: 'Sous-département non trouvé'
      });
    }

    res.json({ sousDepartement });

  } catch (error) {
    console.error('Get sub-department error:', error);
    res.status(500).json({ 
      error: 'Failed to get sub-department',
      message: 'Erreur lors de la récupération du sous-département'
    });
  }
});

// POST /api/sous-departements - Create new sub-department
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

    const sousDepartementData = req.body;
    
    // Check if sub-department code already exists
    const existingSousDepartement = await SousDepartement.findOne({ 
      where: { code: sousDepartementData.code }
    });

    if (existingSousDepartement) {
      return res.status(400).json({ 
        error: 'Sub-department code already exists',
        message: 'Ce code de sous-département existe déjà'
      });
    }

    // Check if parent department exists
    const departement = await Departement.findByPk(sousDepartementData.departement_id);
    if (!departement) {
      return res.status(400).json({ 
        error: 'Parent department not found',
        message: 'Le département parent n\'existe pas'
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

    // Fetch the created sub-department with relations
    const createdSousDepartement = await SousDepartement.findByPk(sousDepartement.id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code']
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
    console.error('Create sub-department error:', error);
    res.status(500).json({ 
      error: 'Failed to create sub-department',
      message: 'Erreur lors de la création du sous-département'
    });
  }
});

// PUT /api/sous-departements/:id - Update sub-department
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
        error: 'Sub-department not found',
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
          error: 'Sub-department code already exists',
          message: 'Ce code de sous-département existe déjà'
        });
      }
    }

    // Check if parent department exists if provided
    if (sousDepartementData.departement_id) {
      const departement = await Departement.findByPk(sousDepartementData.departement_id);
      if (!departement) {
        return res.status(400).json({ 
          error: 'Parent department not found',
          message: 'Le département parent n\'existe pas'
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

    // Fetch the updated sub-department with relations
    const updatedSousDepartement = await SousDepartement.findByPk(id, {
      include: [
        {
          model: Departement,
          as: 'Departement',
          attributes: ['id', 'nom', 'code']
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
    console.error('Update sub-department error:', error);
    res.status(500).json({ 
      error: 'Failed to update sub-department',
      message: 'Erreur lors de la mise à jour du sous-département'
    });
  }
});

// DELETE /api/sous-departements/:id - Delete sub-department
router.delete('/:id', [
  requireRole('Administrateur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const sousDepartement = await SousDepartement.findByPk(id);

    if (!sousDepartement) {
      return res.status(404).json({ 
        error: 'Sub-department not found',
        message: 'Sous-département non trouvé'
      });
    }

    // Check if sub-department can be deleted (no active users, etc.)
    // Add your business logic here if needed

    await sousDepartement.destroy();

    res.json({
      message: 'Sous-département supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete sub-department error:', error);
    res.status(500).json({ 
      error: 'Failed to delete sub-department',
      message: 'Erreur lors de la suppression du sous-département'
    });
  }
});

module.exports = router;
