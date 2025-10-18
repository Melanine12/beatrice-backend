const express = require('express');
const { body, validationResult } = require('express-validator');
const Fournisseur = require('../models/Fournisseur');
const Achat = require('../models/Achat');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/fournisseurs - Get all suppliers with filtering
router.get('/', async (req, res, next) => {
  try {
    const { statut, categorie_principale, search, page = 1, limit = 20 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};
    
    // Validate statut
    const validStatuts = ['Actif', 'Inactif', 'En attente'];
    if (statut && statut.trim() !== '' && validStatuts.includes(statut.trim())) {
      whereClause.statut = statut.trim();
    }
    
    // Validate categorie_principale
    const validCategories = ['Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Services', 'Autre'];
    if (categorie_principale && categorie_principale.trim() !== '' && validCategories.includes(categorie_principale.trim())) {
      whereClause.categorie_principale = categorie_principale.trim();
    }
    
    // Search functionality
    if (search && search.trim() !== '') {
      whereClause[require('sequelize').Op.or] = [
        { nom: { [require('sequelize').Op.like]: `%${search.trim()}%` } },
        { email: { [require('sequelize').Op.like]: `%${search.trim()}%` } },
        { contact_principal: { [require('sequelize').Op.like]: `%${search.trim()}%` } },
        { ville: { [require('sequelize').Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { count, rows: fournisseurs } = await Fournisseur.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [['nom', 'ASC']]
    });

    res.json({
      fournisseurs,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });

  } catch (error) {
    console.error('Get suppliers error:', error);
    next(error);
  }
});

// GET /api/fournisseurs/:id - Get specific supplier
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const fournisseur = await Fournisseur.findByPk(id, {
      include: [
        {
          model: Achat,
          as: 'achats',
          attributes: ['id', 'numero_commande', 'statut', 'montant_total', 'date_creation'],
          limit: 10,
          order: [['date_creation', 'DESC']]
        }
      ]
    });

    if (!fournisseur) {
      return res.status(404).json({ 
        error: 'Supplier not found',
        message: 'Fournisseur non trouvé'
      });
    }

    res.json({ fournisseur });

  } catch (error) {
    console.error('Get supplier error:', error);
    next(error);
  }
});

// POST /api/fournisseurs - Create new supplier
router.post('/', [
  body('nom').isLength({ min: 2, max: 255 }),
  body('email').optional().isEmail(),
  body('email_contact').optional().isEmail(),
  body('telephone').optional().isLength({ max: 20 }),
  body('telephone_contact').optional().isLength({ max: 20 }),
  body('siret').optional().isLength({ min: 14, max: 14 }),
  body('tva_intracom').optional().isLength({ max: 20 }),
  body('statut').optional().isIn(['Actif', 'Inactif', 'En attente']),
  body('categorie_principale').optional().isIn(['Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Services', 'Autre']),
  body('evaluation').optional().isInt({ min: 1, max: 5 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const fournisseurData = { ...req.body };

    // Clean up empty values
    Object.keys(fournisseurData).forEach(key => {
      if (fournisseurData[key] === '' || fournisseurData[key] === null) {
        delete fournisseurData[key];
      }
    });

    const fournisseur = await Fournisseur.create(fournisseurData);

    res.status(201).json({
      message: 'Fournisseur créé avec succès',
      fournisseur
    });

  } catch (error) {
    console.error('Create supplier error:', error);
    next(error);
  }
});

// PUT /api/fournisseurs/:id - Update supplier
router.put('/:id', [
  body('nom').optional().isLength({ min: 2, max: 255 }),
  body('email').optional().isEmail(),
  body('email_contact').optional().isEmail(),
  body('telephone').optional().isLength({ max: 20 }),
  body('telephone_contact').optional().isLength({ max: 20 }),
  body('siret').optional().isLength({ min: 14, max: 14 }),
  body('tva_intracom').optional().isLength({ max: 20 }),
  body('statut').optional().isIn(['Actif', 'Inactif', 'En attente']),
  body('categorie_principale').optional().isIn(['Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Services', 'Autre']),
  body('evaluation').optional().isInt({ min: 1, max: 5 })
], async (req, res, next) => {
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
    const fournisseur = await Fournisseur.findByPk(id);

    if (!fournisseur) {
      return res.status(404).json({ 
        error: 'Supplier not found',
        message: 'Fournisseur non trouvé'
      });
    }

    const updateData = { ...req.body };

    // Clean up empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update modification date
    updateData.date_modification = new Date();

    await fournisseur.update(updateData);

    res.json({
      message: 'Fournisseur mis à jour avec succès',
      fournisseur
    });

  } catch (error) {
    console.error('Update supplier error:', error);
    next(error);
  }
});

// DELETE /api/fournisseurs/:id - Delete supplier (Administrateur only)
router.delete('/:id', [
  requireRole(['Administrateur', 'Superviseur Stock'])
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const fournisseur = await Fournisseur.findByPk(id);

    if (!fournisseur) {
      return res.status(404).json({ 
        error: 'Supplier not found',
        message: 'Fournisseur non trouvé'
      });
    }

    // Check if supplier has associated purchases
    const achatsCount = await Achat.count({ where: { fournisseur_id: id } });
    if (achatsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete supplier',
        message: 'Impossible de supprimer ce fournisseur car il a des achats associés'
      });
    }

    await fournisseur.destroy();

    res.json({
      message: 'Fournisseur supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete supplier error:', error);
    next(error);
  }
});

// GET /api/fournisseurs/stats/overview - Get supplier statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    
    // Basic counts
    const totalSuppliers = await Fournisseur.count();
    const activeSuppliers = await Fournisseur.count({ where: { statut: 'Actif' } });
    const inactiveSuppliers = await Fournisseur.count({ where: { statut: 'Inactif' } });
    const pendingSuppliers = await Fournisseur.count({ where: { statut: 'En attente' } });

    // Suppliers by category
    const suppliersByCategory = await Fournisseur.findAll({
      attributes: [
        'categorie_principale',
        [Fournisseur.sequelize.fn('COUNT', Fournisseur.sequelize.col('id')), 'count']
      ],
      group: ['categorie_principale']
    });

    // Top suppliers by purchase amount
    const topSuppliers = await Fournisseur.findAll({
      attributes: [
        'id',
        'nom',
        [Fournisseur.sequelize.fn('COUNT', Fournisseur.sequelize.col('achats.id')), 'purchaseCount'],
        [Fournisseur.sequelize.fn('SUM', Fournisseur.sequelize.col('achats.montant_total')), 'totalAmount']
      ],
      include: [
        {
          model: Achat,
          as: 'achats',
          attributes: []
        }
      ],
      group: ['Fournisseur.id'],
      order: [[Fournisseur.sequelize.fn('SUM', Fournisseur.sequelize.col('achats.montant_total')), 'DESC']],
      limit: 5
    });

    // Recent suppliers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSuppliers = await Fournisseur.count({
      where: {
        date_creation: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Average evaluation
    const avgEvaluation = await Fournisseur.findAll({
      attributes: [
        [Fournisseur.sequelize.fn('AVG', Fournisseur.sequelize.col('evaluation')), 'avgEvaluation']
      ],
      where: {
        evaluation: {
          [Op.ne]: null
        }
      }
    });

    res.json({
      stats: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers,
        pending: pendingSuppliers,
        recent: recentSuppliers,
        avgEvaluation: avgEvaluation[0]?.dataValues?.avgEvaluation || 0
      },
      suppliersByCategory,
      topSuppliers
    });

  } catch (error) {
    console.error('Get supplier stats error:', error);
    next(error);
  }
});

module.exports = router; 