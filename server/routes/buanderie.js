const express = require('express');
const { body, validationResult } = require('express-validator');
const Buanderie = require('../models/Buanderie');
const Inventaire = require('../models/Inventaire');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/buanderie - Get all laundry operations with filtering
router.get('/', async (req, res, next) => {
  try {
    const { 
      type_operation, 
      inventaire_id, 
      chambre_id, 
      etat_linge, 
      priorite, 
      statut,
      date_debut, 
      date_fin, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};
    
    if (type_operation && type_operation.trim() !== '') {
      whereClause.type_operation = type_operation.trim();
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
    
    if (statut && statut.trim() !== '') {
      whereClause.statut = statut.trim();
    }
    
    // Date range filter
    if (date_debut && date_debut.trim() !== '') {
      whereClause.date_operation = {
        [require('sequelize').Op.gte]: new Date(date_debut)
      };
    }
    
    if (date_fin && date_fin.trim() !== '') {
      if (whereClause.date_operation) {
        whereClause.date_operation[require('sequelize').Op.lte] = new Date(date_fin);
      } else {
        whereClause.date_operation = {
          [require('sequelize').Op.lte]: new Date(date_fin)
        };
      }
    }

    const { count, rows: operations } = await Buanderie.findAndCountAll({
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
      order: [['date_operation', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Calculate statistics
    const stats = await Buanderie.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_operation = "Envoi" THEN 1 END')), 'envois'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_operation = "Retour" THEN 1 END')), 'retours'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_operation = "Transfert" THEN 1 END')), 'transferts'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_operation = "Perte" THEN 1 END')), 'pertes'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN type_operation = "Endommagement" THEN 1 END')), 'endommagement'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "En cours" THEN 1 END')), 'en_cours'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Propre" THEN 1 END')), 'propre'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Sale" THEN 1 END')), 'sale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Perdu" THEN 1 END')), 'perdu'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN etat_linge = "Endommagé" THEN 1 END')), 'endommage'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Urgente" THEN 1 END')), 'urgente'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Normale" THEN 1 END')), 'normale'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Basse" THEN 1 END')), 'basse'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN statut = "En cours" THEN 1 END')), 'en_cours_statut'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN statut = "Terminé" THEN 1 END')), 'termine'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN statut = "Annulé" THEN 1 END')), 'annule']
      ]
    });

    res.json({
      operations: operations,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      stats: stats[0]?.dataValues || {
        total: 0, envois: 0, retours: 0, transferts: 0, pertes: 0, endommagement: 0,
        en_cours: 0, propre: 0, sale: 0, perdu: 0, endommage: 0,
        urgente: 0, normale: 0, basse: 0, en_cours_statut: 0, termine: 0, annule: 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des opérations de buanderie:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/buanderie/:id - Get specific laundry operation
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const operation = await Buanderie.findByPk(id, {
      include: [
        {
          model: Inventaire,
          as: 'inventaire',
          attributes: ['id', 'nom', 'categorie', 'quantite', 'numero_reference']
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
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    if (!operation) {
      return res.status(404).json({ 
        error: 'Operation not found',
        message: 'Opération de buanderie non trouvée'
      });
    }

    res.json({ operation });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'opération:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// POST /api/buanderie - Create new laundry operation
router.post('/', [
  body('inventaire_id').isInt().withMessage('ID inventaire invalide'),
  body('type_operation').isIn(['Envoi', 'Retour', 'Transfert', 'Perte', 'Endommagement']).withMessage('Type d\'opération invalide'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('etat_linge').isIn(['Propre', 'Sale', 'En cours', 'Perdu', 'Endommagé']).withMessage('État du linge invalide'),
  body('priorite').isIn(['Urgente', 'Normale', 'Basse']).withMessage('Priorité invalide'),
  body('utilisateur_id').isInt().withMessage('ID utilisateur invalide')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      inventaire_id,
      chambre_id,
      type_operation,
      quantite,
      etat_linge,
      priorite,
      date_retour_prevue,
      responsable_id,
      utilisateur_id,
      motif,
      notes,
      cout_operation
    } = req.body;

    // Vérifier la disponibilité du stock pour les envois
    if (type_operation === 'Envoi') {
      const inventaire = await Inventaire.findByPk(inventaire_id);
      if (!inventaire || inventaire.quantite < quantite) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          message: 'Stock insuffisant pour cette opération'
        });
      }
    }

    // Créer l'opération
    const operation = await Buanderie.create({
      inventaire_id,
      chambre_id,
      type_operation,
      quantite,
      etat_linge,
      priorite,
      date_retour_prevue,
      responsable_id,
      utilisateur_id,
      motif,
      notes,
      cout_operation: cout_operation || 0.00
    });

    // Mettre à jour le stock de l'inventaire
    if (type_operation === 'Envoi') {
      await Inventaire.increment('quantite', { 
        by: -quantite, 
        where: { id: inventaire_id } 
      });
    } else if (type_operation === 'Retour') {
      await Inventaire.increment('quantite', { 
        by: quantite, 
        where: { id: inventaire_id } 
      });
    }

    // Récupérer l'opération avec les associations
    const createdOperation = await Buanderie.findByPk(operation.id, {
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
        }
      ]
    });

    res.status(201).json({ 
      message: 'Opération de buanderie créée avec succès',
      operation: createdOperation
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'opération:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// PUT /api/buanderie/:id - Update laundry operation
router.put('/:id', [
  body('type_operation').optional().isIn(['Envoi', 'Retour', 'Transfert', 'Perte', 'Endommagement']),
  body('etat_linge').optional().isIn(['Propre', 'Sale', 'En cours', 'Perdu', 'Endommagé']),
  body('priorite').optional().isIn(['Urgente', 'Normale', 'Basse']),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Annulé'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const operation = await Buanderie.findByPk(id);

    if (!operation) {
      return res.status(404).json({ 
        error: 'Operation not found',
        message: 'Opération de buanderie non trouvée'
      });
    }

    // Mettre à jour l'opération
    await operation.update(req.body);

    // Récupérer l'opération mise à jour avec les associations
    const updatedOperation = await Buanderie.findByPk(id, {
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
        }
      ]
    });

    res.json({ 
      message: 'Opération mise à jour avec succès',
      operation: updatedOperation
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'opération:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// GET /api/buanderie/stats/summary - Get summary statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const stats = await Buanderie.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN statut = "En cours" THEN 1 END')), 'en_cours'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN statut = "Terminé" THEN 1 END')), 'termine'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN priorite = "Urgente" THEN 1 END')), 'urgente'],
        [require('sequelize').fn('SUM', require('sequelize').col('quantite')), 'total_quantite']
      ]
    });

    res.json({
      stats: stats[0]?.dataValues || {
        total: 0,
        en_cours: 0,
        termine: 0,
        urgente: 0,
        total_quantite: 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// DELETE /api/buanderie/:id - Delete laundry operation
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const operation = await Buanderie.findByPk(id);

    if (!operation) {
      return res.status(404).json({ 
        error: 'Operation not found',
        message: 'Opération de buanderie non trouvée'
      });
    }

    // Restaurer le stock si c'était un envoi
    if (operation.type_operation === 'Envoi') {
      await Inventaire.increment('quantite', { 
        by: operation.quantite, 
        where: { id: operation.inventaire_id } 
      });
    }

    // Supprimer l'opération
    await operation.destroy();

    res.json({ 
      message: 'Opération supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'opération:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

module.exports = router;
