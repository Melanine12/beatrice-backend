const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Inventaire = require('../models/Inventaire');
const MouvementStock = require('../models/MouvementStock');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const Entrepot = require('../models/Entrepot');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// PUBLIC: Lightweight options for selects (no auth)
router.get('/public-options', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
    const search = req.query.search;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { code_produit: { [Op.like]: `%${search}%` } }
      ];
    }

    const items = await Inventaire.findAll({
      attributes: ['id', 'nom', 'code_produit', 'categorie', 'unite', 'prix_unitaire'],
      where: whereClause,
      order: [['nom', 'ASC']],
      limit
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching public inventory options:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des articles' });
  }
});

// Apply authentication to all remaining routes
router.use(authenticateToken);

// GET /api/inventaire - Get all inventory items with filters
router.get('/', [
  query('categorie').optional(),
  query('statut').optional(),
  query('chambre_id').optional(),
  query('responsable_id').optional(),
  query('search').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { categorie, statut, chambre_id, responsable_id, search, page = 1, limit = 10 } = req.query;
    
    const whereClause = {};
    if (categorie) whereClause.categorie = categorie;
    if (statut) whereClause.statut = statut;
    if (chambre_id) whereClause.chambre_id = chambre_id;
    if (responsable_id) whereClause.responsable_id = responsable_id;
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { numero_reference: { [Op.like]: `%${search}%` } },
        { code_produit: { [Op.like]: `%${search}%` } },
        { qr_code_article: { [Op.like]: `%${search}%` } },
        { sous_categorie: { [Op.like]: `%${search}%` } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Count total items
    const totalItems = await Inventaire.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / limitNum);

    const inventaire = await Inventaire.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Entrepot,
          as: 'entrepot',
          attributes: ['id', 'nom', 'type', 'ville']
        }
      ],
      order: [['nom', 'ASC']],
      limit: limitNum,
      offset: offset
    });

    res.json({
      success: true,
      data: inventaire,
      currentPage: pageNum,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limitNum
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'inventaire',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventaire/:id - Get specific inventory item
router.get('/:id', async (req, res) => {
  try {
    const inventaire = await Inventaire.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Entrepot,
          as: 'entrepot',
          attributes: ['id', 'nom', 'type', 'ville']
        }
      ]
    });

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Article d\'inventaire non trouvé'
      });
    }

    res.json({
      success: true,
      data: inventaire
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/inventaire - Create new inventory item
router.post('/', [
  requireRole(['Superviseur', 'Superviseur Stock']),
  body('nom').isLength({ min: 2, max: 255 }).withMessage('Le nom doit contenir entre 2 et 255 caractères'),
  body('categorie').isIn(['Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Autre']),
  body('quantite').isFloat({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
  body('quantite_min').isFloat({ min: 0 }).withMessage('La quantité minimale doit être un nombre positif'),
  body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('Le prix unitaire doit être positif'),
  body('statut').optional().isIn(['Disponible', 'En rupture', 'En commande', 'Hors service']),
  body('code_produit').optional().isLength({ max: 100 }).withMessage('Le code produit ne doit pas dépasser 100 caractères'),
  body('nature').optional().isIn(['Consommable', 'Durable', 'Équipement', 'Mobilier', 'Linge', 'Produit d\'entretien', 'Autre']),
  body('sous_categorie').optional().isLength({ max: 100 }).withMessage('La sous-catégorie ne doit pas dépasser 100 caractères'),
  body('emplacement_id').optional().isInt({ min: 1 }).withMessage('L\'ID de l\'emplacement doit être un entier positif'),
  body('etage').optional().isInt({ min: 0, max: 50 }).withMessage('L\'étage doit être un nombre entre 0 et 50'),
  body('unite').optional().isLength({ min: 1, max: 20 }).withMessage('L\'unité doit contenir entre 1 et 20 caractères'),
  body('qr_code_article').optional().isLength({ max: 255 }).withMessage('Le code QR ne doit pas dépasser 255 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    // Filtrer les champs qui n'existent pas dans le modèle
    const allowedFields = [
      'nom', 'description', 'code_produit', 'nature', 'categorie', 'sous_categorie',
      'quantite', 'quantite_min', 'unite', 'prix_unitaire', 'fournisseur',
      'numero_reference', 'emplacement', 'emplacement_id', 'etage', 'qr_code_article',
      'statut', 'date_achat', 'date_expiration', 'responsable_id', 'chambre_id',
      'notes', 'tags'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      // Traitement spécial pour etage : toujours l'inclure même si vide
      if (field === 'etage') {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          filteredData[field] = parseInt(req.body[field]) || null;
        } else {
          filteredData[field] = null; // Toujours inclure etage, même si null
        }
      } else if (req.body[field] !== undefined && req.body[field] !== '') {
        filteredData[field] = req.body[field];
      }
    });

    const inventaire = await Inventaire.create(filteredData);

    res.status(201).json({
      success: true,
      message: 'Article d\'inventaire créé avec succès',
      data: inventaire
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/inventaire/:id - Update inventory item
router.put('/:id', [
  requireRole(['Superviseur', 'Superviseur Stock']),
  body('nom').optional().isLength({ min: 2, max: 255 }),
  body('categorie').optional().isIn(['Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Autre']),
  body('quantite').optional().isFloat({ min: 0 }),
  body('quantite_min').optional().isFloat({ min: 0 }),
  body('prix_unitaire').optional().isFloat({ min: 0 }),
  body('statut').optional().isIn(['Disponible', 'En rupture', 'En commande', 'Hors service']),
  body('code_produit').optional().isLength({ max: 100 }),
  body('nature').optional().isIn(['Consommable', 'Durable', 'Équipement', 'Mobilier', 'Linge', 'Produit d\'entretien', 'Autre']),
  body('sous_categorie').optional().isLength({ max: 100 }),
  body('emplacement_id').optional().isInt({ min: 1 }),
  body('etage').optional().isInt({ min: 0, max: 50 }),
  body('unite').optional().isLength({ min: 1, max: 20 }),
  body('qr_code_article').optional().isLength({ max: 255 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const inventaire = await Inventaire.findByPk(req.params.id);
    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Article d\'inventaire non trouvé'
      });
    }

    // Filtrer les champs qui n'existent pas dans le modèle
    const allowedFields = [
      'nom', 'description', 'code_produit', 'nature', 'categorie', 'sous_categorie',
      'quantite', 'quantite_min', 'unite', 'prix_unitaire', 'fournisseur',
      'numero_reference', 'emplacement', 'emplacement_id', 'etage', 'qr_code_article',
      'statut', 'date_achat', 'date_expiration', 'responsable_id', 'chambre_id',
      'notes', 'tags'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        // Convertir etage en entier si présent
        if (field === 'etage') {
          filteredData[field] = parseInt(req.body[field]) || null;
        } else {
          filteredData[field] = req.body[field];
        }
      }
    });
    
    // Toujours inclure etage (même si null) pour éviter l'erreur de valeur par défaut lors de la mise à jour
    if (req.body.etage !== undefined) {
      filteredData.etage = req.body.etage !== '' ? parseInt(req.body.etage) || null : null;
    }

    await inventaire.update(filteredData);

    res.json({
      success: true,
      message: 'Article d\'inventaire mis à jour avec succès',
      data: inventaire
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/inventaire/:id - Delete inventory item
router.delete('/:id', [requireRole(['Administrateur', 'Superviseur Stock'])], async (req, res) => {
  try {
    const inventaire = await Inventaire.findByPk(req.params.id);
    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Article d\'inventaire non trouvé'
      });
    }

    await inventaire.destroy();

    res.json({
      success: true,
      message: 'Article d\'inventaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventaire/stats/overview - Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalItems = await Inventaire.count();
    const lowStockItems = await Inventaire.count({
      where: {
        quantite: {
          [Op.lte]: sequelize.col('quantite_min')
        }
      }
    });
    const outOfStockItems = await Inventaire.count({
      where: { quantite: 0 }
    });
    const totalValue = await Inventaire.sum('prix_unitaire', {
      where: {
        prix_unitaire: { [Op.ne]: null }
      }
    });

    const categoryStats = await Inventaire.findAll({
      attributes: [
        'categorie',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('prix_unitaire')), 'total_value']
      ],
      group: ['categorie']
    });

    // Nouvelles statistiques pour les nouveaux champs
    const natureStats = await Inventaire.findAll({
      attributes: [
        'nature',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['nature']
    });

    const emplacementStats = await Inventaire.findAll({
      attributes: [
        'emplacement_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        emplacement_id: { [Op.ne]: null }
      },
      group: ['emplacement_id'],
      include: [
        {
          model: Entrepot,
          as: 'entrepot',
          attributes: ['nom', 'type']
        }
      ]
    });

    const itemsWithQRCode = await Inventaire.count({
      where: {
        qr_code_article: { [Op.ne]: null }
      }
    });

    const itemsWithProductCode = await Inventaire.count({
      where: {
        code_produit: { [Op.ne]: null }
      }
    });

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue: totalValue || 0,
        categoryStats,
        natureStats,
        emplacementStats,
        itemsWithQRCode,
        itemsWithProductCode
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventaire/stocks/summary - Summary per item: initial, entries, exits, final
router.get('/stocks/summary', async (req, res) => {
  try {
    const { categorie, search } = req.query;

    const whereClause = {};
    if (categorie) whereClause.categorie = categorie;
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { code_produit: { [Op.like]: `%${search}%` } },
        { qr_code_article: { [Op.like]: `%${search}%` } }
      ];
    }

    // Fetch all items first
    const items = await Inventaire.findAll({
      where: whereClause,
      attributes: ['id', 'nom', 'categorie', 'unite', 'quantite', 'quantite_min', 'statut']
    });

    const itemIds = items.map(i => i.id);

    let movementAggregates = [];
    if (itemIds.length > 0) {
      // Aggregate movements per item and type
      movementAggregates = await MouvementStock.findAll({
        attributes: [
          'inventaire_id',
          'type_mouvement',
          [sequelize.fn('SUM', sequelize.col('quantite')), 'totalQuantity']
        ],
        where: { inventaire_id: itemIds },
        group: ['inventaire_id', 'type_mouvement']
      });
    }

    // Build a map from aggregates
    const aggregatesByItem = new Map();
    for (const agg of movementAggregates) {
      const invId = agg.get('inventaire_id');
      const type = agg.get('type_mouvement');
      const total = parseInt(agg.get('totalQuantity'), 10) || 0;
      if (!aggregatesByItem.has(invId)) {
        aggregatesByItem.set(invId, { entries: 0, exits: 0 });
      }
      const entryTypes = ['Entrée', 'Retour'];
      const exitTypes = ['Sortie', 'Perte'];
      if (entryTypes.includes(type)) {
        aggregatesByItem.get(invId).entries += total;
      } else if (exitTypes.includes(type)) {
        aggregatesByItem.get(invId).exits += total;
      }
    }

    const summary = items.map(item => {
      const finalQty = item.quantite || 0;
      const agg = aggregatesByItem.get(item.id) || { entries: 0, exits: 0 };
      const stockInitial = finalQty - (agg.entries - agg.exits);
      return {
        id: item.id,
        nom: item.nom,
        categorie: item.categorie,
        unite: item.unite,
        quantite_min: item.quantite_min,
        statut: item.statut,
        stock_initial: stockInitial,
        entrees: agg.entries,
        sorties: agg.exits,
        stock_final: finalQty
      };
    });

    res.json({ success: true, data: summary, count: summary.length });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé de stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/inventaire/generate-codes - Generate product codes and QR codes for items without them
router.post('/generate-codes', [requireRole(['Superviseur', 'Superviseur Stock'])], async (req, res) => {
  try {
    const itemsWithoutCodes = await Inventaire.findAll({
      where: {
        [Op.or]: [
          { code_produit: null },
          { qr_code_article: null }
        ]
      }
    });

    let updatedCount = 0;
    for (const item of itemsWithoutCodes) {
      const updates = {};
      
      if (!item.code_produit) {
        updates.code_produit = item.generateProductCode();
      }
      
      if (!item.qr_code_article) {
        updates.qr_code_article = item.generateQRCode();
      }
      
      if (Object.keys(updates).length > 0) {
        await item.update(updates);
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} articles mis à jour avec des codes générés`,
      updatedCount
    });
  } catch (error) {
    console.error('Error generating codes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des codes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventaire/nature-options - Get available nature options
router.get('/nature-options', async (req, res) => {
  try {
    const natures = [
      'Consommable',
      'Durable', 
      'Équipement',
      'Mobilier',
      'Linge',
      'Produit d\'entretien',
      'Autre'
    ];

    res.json({
      success: true,
      data: natures
    });
  } catch (error) {
    console.error('Error fetching nature options:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des options de nature',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 