const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Encaissement, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Middleware de validation des requêtes
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array()
    });
  }
  next();
};

// Fonction pour générer une référence unique
const generateReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ENC-${timestamp}-${random}`;
};

// GET /api/encaissements - Récupérer tous les encaissements avec filtres
router.get('/', [
  query('statut').optional().isIn(['En attente', 'Validé', 'Rejeté', 'Annulé']),
  query('type_paiement').optional().isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre']),
  query('date_debut').optional().isISO8601().toDate(),
  query('date_fin').optional().isISO8601().toDate(),
  query('beneficiaire').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const {
      statut,
      type_paiement,
      date_debut,
      date_fin,
      beneficiaire,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = {};

    if (statut) {
      whereClause.statut = statut;
    }

    if (type_paiement) {
      whereClause.type_paiement = type_paiement;
    }

    if (beneficiaire) {
      whereClause.beneficiaire = { [require('sequelize').Op.like]: `%${beneficiaire}%` };
    }

    if (date_debut || date_fin) {
      whereClause.date_paiement = {};
      if (date_debut) {
        whereClause.date_paiement[require('sequelize').Op.gte] = new Date(date_debut);
      }
      if (date_fin) {
        whereClause.date_paiement[require('sequelize').Op.lte] = new Date(date_fin);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows: encaissements } = await Encaissement.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'Validateur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] },
        { model: User, as: 'Createur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] },
        { model: User, as: 'Modificateur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] }
      ],
      order: [['date_paiement', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      encaissements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching encaissements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des encaissements'
    });
  }
});

// GET /api/encaissements/stats - Statistiques des encaissements
router.get('/stats', async (req, res) => {
  try {
    const { periode } = req.query;
    
    const whereClause = {};
    if (periode) {
      const [year, month] = periode.split('-');
      whereClause.date_paiement = {
        [require('sequelize').Op.gte]: new Date(year, month - 1, 1),
        [require('sequelize').Op.lt]: new Date(year, month, 1)
      };
    }

    const stats = await Encaissement.findAll({
      where: whereClause,
      attributes: [
        'statut',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('montant')), 'total_montant']
      ],
      group: ['statut']
    });

    const total = await Encaissement.count({ where: whereClause });
    const totalMontant = await Encaissement.sum('montant', { where: whereClause });

    const result = {
      total,
      totalMontant: totalMontant || 0,
      parStatut: {}
    };

    stats.forEach(stat => {
      result.parStatut[stat.statut] = {
        count: parseInt(stat.dataValues.count),
        montant: parseFloat(stat.dataValues.total_montant) || 0
      };
    });

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching encaissements stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/encaissements/:id - Récupérer un encaissement par ID
router.get('/:id', [
  param('id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const encaissement = await Encaissement.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Validateur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] },
        { model: User, as: 'Createur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] },
        { model: User, as: 'Modificateur', attributes: ['id', 'prenoms', 'nom_famille', 'email'] }
      ]
    });

    if (!encaissement) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    res.json({
      success: true,
      encaissement
    });
  } catch (error) {
    console.error('Error fetching encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'encaissement'
    });
  }
});

// POST /api/encaissements - Créer un nouvel encaissement
router.post('/', [
  requireRole(['Administrateur', 'Superviseur Comptable', 'Caissier']),
  body('montant').isDecimal({ decimal_digits: '0,2' }).withMessage('Montant invalide'),
  body('devise').optional().isLength({ max: 3 }).withMessage('Devise invalide'),
  body('type_paiement').isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre']).withMessage('Type de paiement invalide'),
  body('date_paiement').isISO8601().toDate().withMessage('Date de paiement invalide'),
  body('beneficiaire').notEmpty().withMessage('Bénéficiaire requis'),
  body('email_beneficiaire').optional().isEmail().withMessage('Email du bénéficiaire invalide'),
  body('telephone_beneficiaire').optional().isString().isLength({ max: 20 }),
  body('description').optional().isString(),
  body('statut').optional().isIn(['En attente', 'Validé', 'Rejeté', 'Annulé']),
  body('methode_paiement').optional().isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre']),
  body('numero_transaction').optional().isString().isLength({ max: 100 }),
  body('nom_banque').optional().isString().isLength({ max: 100 }),
  body('numero_compte').optional().isString().isLength({ max: 50 })
], validateRequest, async (req, res) => {
  try {
    const reference = generateReference();
    
    const newEncaissement = await Encaissement.create({
      reference,
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Encaissement créé avec succès',
      encaissement: newEncaissement
    });
  } catch (error) {
    console.error('Error creating encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'encaissement',
      error: error.message
    });
  }
});

// PUT /api/encaissements/:id - Mettre à jour un encaissement
router.put('/:id', [
  requireRole(['Administrateur', 'Superviseur Comptable', 'Caissier']),
  param('id').isInt({ min: 1 }),
  body('montant').optional().isDecimal({ decimal_digits: '0,2' }),
  body('devise').optional().isLength({ max: 3 }),
  body('type_paiement').optional().isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre']),
  body('date_paiement').optional().isISO8601().toDate(),
  body('beneficiaire').optional().notEmpty(),
  body('email_beneficiaire').optional().isEmail(),
  body('telephone_beneficiaire').optional().isString().isLength({ max: 20 }),
  body('description').optional().isString(),
  body('statut').optional().isIn(['En attente', 'Validé', 'Rejeté', 'Annulé']),
  body('methode_paiement').optional().isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre']),
  body('numero_transaction').optional().isString().isLength({ max: 100 }),
  body('nom_banque').optional().isString().isLength({ max: 100 }),
  body('numero_compte').optional().isString().isLength({ max: 50 }),
  body('commentaires_validation').optional().isString()
], validateRequest, async (req, res) => {
  try {
    const encaissement = await Encaissement.findByPk(req.params.id);
    
    if (!encaissement) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    // Si on change le statut à "Validé", enregistrer qui a validé et quand
    if (req.body.statut === 'Validé' && encaissement.statut !== 'Validé') {
      req.body.valide_par = req.user.id;
      req.body.date_validation = new Date();
    }

    await encaissement.update({
      ...req.body,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Encaissement mis à jour avec succès',
      encaissement
    });
  } catch (error) {
    console.error('Error updating encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'encaissement',
      error: error.message
    });
  }
});

// DELETE /api/encaissements/:id - Supprimer un encaissement
router.delete('/:id', [
  requireRole(['Administrateur', 'Superviseur Comptable']),
  param('id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const encaissement = await Encaissement.findByPk(req.params.id);
    
    if (!encaissement) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    await encaissement.destroy();

    res.json({
      success: true,
      message: 'Encaissement supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'encaissement'
    });
  }
});

// PUT /api/encaissements/:id/validate - Valider un encaissement
router.put('/:id/validate', [
  requireRole(['Administrateur', 'Superviseur Comptable']),
  param('id').isInt({ min: 1 }),
  body('commentaires_validation').optional().isString()
], validateRequest, async (req, res) => {
  try {
    const encaissement = await Encaissement.findByPk(req.params.id);
    
    if (!encaissement) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    await encaissement.update({
      statut: 'Validé',
      valide_par: req.user.id,
      date_validation: new Date(),
      commentaires_validation: req.body.commentaires_validation || '',
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Encaissement validé avec succès',
      encaissement
    });
  } catch (error) {
    console.error('Error validating encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'encaissement'
    });
  }
});

module.exports = router;
