const express = require('express');
const { body, validationResult } = require('express-validator');
const MouvementStock = require('../models/MouvementStock');
const Inventaire = require('../models/Inventaire');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const Achat = require('../models/Achat');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/mouvements-stock/buanderie - Get laundry-specific movements
router.get('/buanderie', async (req, res, next) => {
  try {
    const { type_mouvement, inventaire_id, chambre_id, etat_linge, priorite, date_debut, date_fin, page = 1, limit = 20 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for laundry movements
    const whereClause = {
      [require('sequelize').Op.or]: [
        { categorie: 'linge' },
        { '$inventaire.categorie$': 'Linge' }
      ]
    };
    
    // Additional filters
    if (type_mouvement && type_mouvement.trim() !== '') {
      whereClause.type_mouvement = type_mouvement.trim();
    }
    
    if (inventaire_id && inventaire_id.trim() !== '') {
      const inventaireId = parseInt(inventaire_id);
      if (!isNaN(inventaireId)) {
        whereClause.inventaire_id = inventaireId;
      }
    }
    
    if (chambre_id && chambre_id.trim() !== '') {
      const chambreId = parseInt(chambre_id);
      if (!isNaN(chambreId)) {
        whereClause.chambre_id = chambreId;
      }
    }
    
    if (etat_linge && etat_linge.trim() !== '') {
      whereClause.etat_linge = etat_linge.trim();
    }
    
    if (priorite && priorite.trim() !== '') {
      whereClause.priorite = priorite.trim();
    }
    
    // Date range filter
    if (date_debut && date_debut.trim() !== '') {
      whereClause.date_mouvement = {
        [require('sequelize').Op.gte]: new Date(date_debut)
      };
    }
    
    if (date_fin && date_fin.trim() !== '') {
      if (whereClause.date_mouvement) {
        whereClause.date_mouvement[require('sequelize').Op.lte] = new Date(date_fin);
      } else {
        whereClause.date_mouvement = {
          [require('sequelize').Op.lte]: new Date(date_fin)
        };
      }
    }

    const { count, rows: mouvements } = await MouvementStock.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['id', 'nom', 'categorie', 'quantite', 'numero_reference']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_mouvement', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Calculate laundry-specific statistics
    const stats = await MouvementStock.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { categorie: 'linge' },
          { '$inventaire.categorie$': 'Linge' }
        ]
      },
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['categorie']
        }
      ],
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_mouvement = "Sortie" THEN 1 END')), 'sorties'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_mouvement = "Entrée" THEN 1 END')), 'entrees'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "En cours" THEN 1 END')), 'en_cours'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Propre" THEN 1 END')), 'propre'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Sale" THEN 1 END')), 'sale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Perdu" THEN 1 END')), 'perdu'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Endommagé" THEN 1 END')), 'endommage'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Urgente" THEN 1 END')), 'urgente'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Normale" THEN 1 END')), 'normale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Basse" THEN 1 END')), 'basse']
      ]
    });

    res.json({
      mouvements: mouvements,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      stats: stats[0]?.dataValues || {
        total: 0, sorties: 0, entrees: 0, en_cours: 0, propre: 0, sale: 0, perdu: 0, endommage: 0, urgente: 0, normale: 0, basse: 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de buanderie:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/mouvements-stock - Get all stock movements with filtering
router.get('/', async (req, res, next) => {
  try {
    const { type_mouvement, inventaire_id, utilisateur_id, chambre_id, achat_id, date_debut, date_fin, page = 1, limit = 20 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};
    
    // Validate type_mouvement
    const validTypes = ['Entrée', 'Sortie', 'Ajustement', 'Transfert', 'Perte', 'Retour'];
    if (type_mouvement && type_mouvement.trim() !== '' && validTypes.includes(type_mouvement.trim())) {
      whereClause.type_mouvement = type_mouvement.trim();
    }
    
    // Validate IDs
    if (inventaire_id && inventaire_id.trim() !== '') {
      const inventaireId = parseInt(inventaire_id);
      if (!isNaN(inventaireId)) {
        whereClause.inventaire_id = inventaireId;
      }
    }
    
    if (utilisateur_id && utilisateur_id.trim() !== '') {
      const utilisateurId = parseInt(utilisateur_id);
      if (!isNaN(utilisateurId)) {
        whereClause.utilisateur_id = utilisateurId;
      }
    }
    
    if (chambre_id && chambre_id.trim() !== '') {
      const chambreId = parseInt(chambre_id);
      if (!isNaN(chambreId)) {
        whereClause.chambre_id = chambreId;
      }
    }
    
    if (achat_id && achat_id.trim() !== '') {
      const achatId = parseInt(achat_id);
      if (!isNaN(achatId)) {
        whereClause.achat_id = achatId;
      }
    }
    
    // Date range filter
    if (date_debut && date_debut.trim() !== '') {
      whereClause.date_mouvement = {
        [require('sequelize').Op.gte]: new Date(date_debut)
      };
    }
    
    if (date_fin && date_fin.trim() !== '') {
      if (whereClause.date_mouvement) {
        whereClause.date_mouvement[require('sequelize').Op.lte] = new Date(date_fin);
      } else {
        whereClause.date_mouvement = {
          [require('sequelize').Op.lte]: new Date(date_fin)
        };
      }
    }

    const { count, rows: mouvements } = await MouvementStock.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['id', 'nom', 'categorie', 'quantite']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero']
        },
        {
          model: Achat,
          as: 'achat',
          attributes: ['id', 'numero_commande']
        }
      ],
      limit: limitNum,
      offset: offset,
      order: [['date_mouvement', 'DESC']]
    });

    res.json({
      mouvements,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });

  } catch (error) {
    console.error('Get stock movements error:', error);
    next(error);
  }
});

// GET /api/mouvements-stock/buanderie - Get laundry-specific movements
router.get('/buanderie', async (req, res, next) => {
  try {
    const { type_mouvement, inventaire_id, chambre_id, etat_linge, priorite, date_debut, date_fin, page = 1, limit = 20 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for laundry movements
    const whereClause = {
      [require('sequelize').Op.or]: [
        { categorie: 'linge' },
        { '$inventaire.categorie$': 'Linge' }
      ]
    };
    
    // Additional filters
    if (type_mouvement && type_mouvement.trim() !== '') {
      whereClause.type_mouvement = type_mouvement.trim();
    }
    
    if (inventaire_id && inventaire_id.trim() !== '') {
      const inventaireId = parseInt(inventaire_id);
      if (!isNaN(inventaireId)) {
        whereClause.inventaire_id = inventaireId;
      }
    }
    
    if (chambre_id && chambre_id.trim() !== '') {
      const chambreId = parseInt(chambre_id);
      if (!isNaN(chambreId)) {
        whereClause.chambre_id = chambreId;
      }
    }
    
    if (etat_linge && etat_linge.trim() !== '') {
      whereClause.etat_linge = etat_linge.trim();
    }
    
    if (priorite && priorite.trim() !== '') {
      whereClause.priorite = priorite.trim();
    }
    
    // Date range filter
    if (date_debut && date_debut.trim() !== '') {
      whereClause.date_mouvement = {
        [require('sequelize').Op.gte]: new Date(date_debut)
      };
    }
    
    if (date_fin && date_fin.trim() !== '') {
      if (whereClause.date_mouvement) {
        whereClause.date_mouvement[require('sequelize').Op.lte] = new Date(date_fin);
      } else {
        whereClause.date_mouvement = {
          [require('sequelize').Op.lte]: new Date(date_fin)
        };
      }
    }

    const { count, rows: mouvements } = await MouvementStock.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['id', 'nom', 'categorie', 'quantite', 'numero_reference']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_mouvement', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Calculate laundry-specific statistics
    const stats = await MouvementStock.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { categorie: 'linge' },
          { '$inventaire.categorie$': 'Linge' }
        ]
      },
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['categorie']
        }
      ],
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_mouvement = "Sortie" THEN 1 END')), 'sorties'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_mouvement = "Entrée" THEN 1 END')), 'entrees'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "En cours" THEN 1 END')), 'en_cours'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Propre" THEN 1 END')), 'propre'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Sale" THEN 1 END')), 'sale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Perdu" THEN 1 END')), 'perdu'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Endommagé" THEN 1 END')), 'endommage'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Urgente" THEN 1 END')), 'urgente'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Normale" THEN 1 END')), 'normale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Basse" THEN 1 END')), 'basse']
      ]
    });

    res.json({
      mouvements: mouvements,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      stats: stats[0]?.dataValues || {
        total: 0, sorties: 0, entrees: 0, en_cours: 0, propre: 0, sale: 0, perdu: 0, endommage: 0, urgente: 0, normale: 0, basse: 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de buanderie:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/mouvements-stock/:id - Get specific movement
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const mouvement = await MouvementStock.findByPk(id, {
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['id', 'nom', 'categorie', 'quantite', 'quantite_min', 'unite']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Achat,
          as: 'achat',
          attributes: ['id', 'numero_commande', 'fournisseur_id']
        }
      ]
    });

    if (!mouvement) {
      return res.status(404).json({ 
        error: 'Movement not found',
        message: 'Mouvement non trouvé'
      });
    }

    res.json({ mouvement });

  } catch (error) {
    console.error('Get movement error:', error);
    next(error);
  }
});

// POST /api/mouvements-stock - Create new movement
router.post('/', [
  body('inventaire_id').isInt(),
  body('type_mouvement').isIn(['Entrée', 'Sortie', 'Ajustement', 'Transfert', 'Perte', 'Retour']),
  body('quantite').isInt({ min: 1 }),
  body('prix_unitaire').optional().isFloat({ min: 0 }),
  body('motif').optional().isLength({ max: 255 }),
  body('reference_document').optional().isLength({ max: 100 }),
  body('numero_document').optional().isLength({ max: 50 }),
  body('achat_id').optional().isInt(),
  body('chambre_id').optional().isInt(),
  body('emplacement_source').optional().isLength({ max: 100 }),
  body('emplacement_destination').optional().isLength({ max: 100 }),
  body('notes').optional().isLength({ max: 1000 })
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

    const { inventaire_id, quantite, type_mouvement } = req.body;

    // Get current inventory item
    const inventaire = await Inventaire.findByPk(inventaire_id);
    if (!inventaire) {
      return res.status(404).json({ 
        error: 'Inventory item not found',
        message: 'Article d\'inventaire non trouvé'
      });
    }

    const quantite_avant = inventaire.quantite;
    let quantite_apres = quantite_avant;

    // Calculate new quantity based on movement type
    switch (type_mouvement) {
      case 'Entrée':
      case 'Retour':
        quantite_apres += quantite;
        break;
      case 'Sortie':
      case 'Perte':
        if (quantite_avant < quantite) {
          return res.status(400).json({ 
            error: 'Insufficient stock',
            message: 'Stock insuffisant pour cette sortie'
          });
        }
        quantite_apres -= quantite;
        break;
      case 'Ajustement':
        quantite_apres = quantite;
        break;
      case 'Transfert':
        // For transfers, we need to handle source and destination
        quantite_apres = quantite_avant; // No change to total quantity
        break;
    }

    const mouvementData = {
      ...req.body,
      utilisateur_id: req.user.id,
      quantite_avant,
      quantite_apres,
      date_mouvement: new Date()
    };

    // Clean up empty values
    Object.keys(mouvementData).forEach(key => {
      if (mouvementData[key] === '' || mouvementData[key] === null) {
        delete mouvementData[key];
      }
    });

    // Calculate amount if price is provided
    if (mouvementData.prix_unitaire) {
      mouvementData.montant_total = parseFloat(mouvementData.prix_unitaire) * parseInt(mouvementData.quantite);
    }

    const mouvement = await MouvementStock.create(mouvementData);

    // Update inventory quantity
    await inventaire.update({ quantite: quantite_apres });

    res.status(201).json({
      message: 'Mouvement de stock créé avec succès',
      mouvement
    });

  } catch (error) {
    console.error('Create stock movement error:', error);
    next(error);
  }
});

// PUT /api/mouvements-stock/:id - Update movement (limited fields)
router.put('/:id', [
  body('motif').optional().isLength({ max: 255 }),
  body('notes').optional().isLength({ max: 1000 }),
  body('statut').optional().isIn(['En attente', 'Validé', 'Annulé'])
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
    const mouvement = await MouvementStock.findByPk(id);

    if (!mouvement) {
      return res.status(404).json({ 
        error: 'Movement not found',
        message: 'Mouvement non trouvé'
      });
    }

    // Only allow updates to certain fields
    const allowedFields = ['motif', 'notes', 'statut'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Clean up empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    await mouvement.update(updateData);

    res.json({
      message: 'Mouvement de stock mis à jour avec succès',
      mouvement
    });

  } catch (error) {
    console.error('Update stock movement error:', error);
    next(error);
  }
});

// DELETE /api/mouvements-stock/:id - Delete movement (Administrateur only)
router.delete('/:id', [
  requireRole('Administrateur')
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const mouvement = await MouvementStock.findByPk(id);

    if (!mouvement) {
      return res.status(404).json({ 
        error: 'Movement not found',
        message: 'Mouvement non trouvé'
      });
    }

    // Revert inventory quantity if movement is validated
    if (mouvement.statut === 'Validé') {
      const inventaire = await Inventaire.findByPk(mouvement.inventaire_id);
      if (inventaire) {
        let newQuantity = inventaire.quantite;
        
        // Reverse the movement
        switch (mouvement.type_mouvement) {
          case 'Entrée':
          case 'Retour':
            newQuantity -= mouvement.quantite;
            break;
          case 'Sortie':
          case 'Perte':
            newQuantity += mouvement.quantite;
            break;
          case 'Ajustement':
            newQuantity = mouvement.quantite_avant;
            break;
        }
        
        await inventaire.update({ quantite: newQuantity });
      }
    }

    await mouvement.destroy();

    res.json({
      message: 'Mouvement de stock supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete stock movement error:', error);
    next(error);
  }
});

// GET /api/mouvements-stock/stats/overview - Get movement statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    
    // Basic counts
    const totalMovements = await MouvementStock.count();
    const entryMovements = await MouvementStock.count({ where: { type_mouvement: 'Entrée' } });
    const exitMovements = await MouvementStock.count({ where: { type_mouvement: 'Sortie' } });
    const adjustmentMovements = await MouvementStock.count({ where: { type_mouvement: 'Ajustement' } });
    const transferMovements = await MouvementStock.count({ where: { type_mouvement: 'Transfert' } });
    const lossMovements = await MouvementStock.count({ where: { type_mouvement: 'Perte' } });
    const returnMovements = await MouvementStock.count({ where: { type_mouvement: 'Retour' } });

    // Amount statistics
    const totalAmount = await MouvementStock.findAll({
      attributes: [
        [MouvementStock.sequelize.fn('SUM', MouvementStock.sequelize.col('montant_total')), 'totalAmount']
      ],
      where: {
        montant_total: {
          [Op.ne]: null
        }
      }
    });

    // Movements by type
    const movementsByType = await MouvementStock.findAll({
      attributes: [
        'type_mouvement',
        [MouvementStock.sequelize.fn('COUNT', MouvementStock.sequelize.col('id')), 'count'],
        [MouvementStock.sequelize.fn('SUM', MouvementStock.sequelize.col('quantite')), 'totalQuantity']
      ],
      group: ['type_mouvement']
    });

    // Recent movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMovements = await MouvementStock.count({
      where: {
        date_mouvement: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Top items by movement count
    const topItems = await MouvementStock.findAll({
      attributes: [
        'inventaire_id',
        [MouvementStock.sequelize.fn('COUNT', MouvementStock.sequelize.col('id')), 'movementCount'],
        [MouvementStock.sequelize.fn('SUM', MouvementStock.sequelize.col('quantite')), 'totalQuantity']
      ],
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['nom', 'categorie']
        }
      ],
      group: ['inventaire_id'],
      order: [[MouvementStock.sequelize.fn('COUNT', MouvementStock.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      stats: {
        total: totalMovements,
        entries: entryMovements,
        exits: exitMovements,
        adjustments: adjustmentMovements,
        transfers: transferMovements,
        losses: lossMovements,
        returns: returnMovements,
        recent: recentMovements,
        totalAmount: totalAmount[0]?.dataValues?.totalAmount || 0
      },
      movementsByType,
      topItems
    });

  } catch (error) {
    console.error('Get movement stats error:', error);
    next(error);
  }
});

module.exports = router; 