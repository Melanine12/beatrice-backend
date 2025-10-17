const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { PaiementSalaireSalaire, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Fonction utilitaire pour vérifier si on peut effectuer des paiements (à partir du 20 du mois)
const canMakePayments = () => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  return dayOfMonth >= 20;
};

// GET /api/paiements-salaires - Récupérer tous les paiements avec filtres
router.get('/', [
  query('employe_id').optional().isInt({ min: 1 }),
  query('periode').optional().matches(/^\d{4}-\d{2}$/),
  query('statut').optional().isIn(['En attente', 'Payé', 'Annulé', 'En cours']),
  query('type_paiement').optional().isIn(['Salaire', 'Prime', 'Bonus', 'Indemnité', 'Avance', 'Remboursement', 'Autre']),
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
      employe_id, 
      periode, 
      statut, 
      type_paiement, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construire la clause WHERE
    const whereClause = {};
    if (employe_id) whereClause.employe_id = parseInt(employe_id);
    if (periode) whereClause.periode_paiement = periode;
    if (statut) whereClause.statut = statut;
    if (type_paiement) whereClause.type_paiement = type_paiement;

    const { count, rows: paiements } = await PaiementSalaire.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Employe',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'Validateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'Createur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_paiement', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: paiements,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching paiements:', error);
    res.status(500).json({
      error: 'Failed to fetch paiements',
      message: 'Erreur lors de la récupération des paiements'
    });
  }
});

// GET /api/paiements-salaires/employe/:id - Récupérer les paiements d'un employé spécifique
router.get('/employe/:id', [
  param('id').isInt({ min: 1 }),
  query('periode').optional().matches(/^\d{4}-\d{2}$/),
  query('statut').optional().isIn(['En attente', 'Payé', 'Annulé', 'En cours']),
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

    const { id } = req.params;
    const { periode, statut, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Vérifier que l'employé existe
    const employe = await User.findByPk(id);
    if (!employe) {
      return res.status(404).json({ 
        error: 'Employee not found',
        message: 'Employé non trouvé'
      });
    }

    // Construire la clause WHERE
    const whereClause = { employe_id: parseInt(id) };
    if (periode) whereClause.periode_paiement = periode;
    if (statut) whereClause.statut = statut;

    const { count, rows: paiements } = await PaiementSalaire.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Validateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'Createur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_paiement', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: paiements,
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email,
        role: employe.role
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching employe paiements:', error);
    res.status(500).json({
      error: 'Failed to fetch employe paiements',
      message: 'Erreur lors de la récupération des paiements de l\'employé'
    });
  }
});

// POST /api/paiements-salaires - Créer un nouveau paiement
router.post('/', [
  requireRole(['Administrateur', 'Superviseur RH', 'Superviseur Comptable']),
  body('employe_id').isInt({ min: 1 }).withMessage('ID employé requis'),
  body('montant').isDecimal({ decimal_digits: '0,2' }).withMessage('Montant invalide'),
  body('type_paiement').isIn(['Salaire', 'Prime', 'Bonus', 'Indemnité', 'Avance', 'Remboursement', 'Autre']).withMessage('Type de paiement invalide'),
  body('periode_paiement').matches(/^\d{4}-\d{2}$/).withMessage('Période de paiement invalide (format: YYYY-MM)'),
  body('date_paiement').isDate().withMessage('Date de paiement invalide'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description trop longue'),
  body('methode_paiement').optional().isIn(['Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money', 'Autre']),
  body('numero_compte').optional().isLength({ max: 50 }).withMessage('Numéro de compte trop long'),
  body('nom_banque').optional().isLength({ max: 100 }).withMessage('Nom de banque trop long'),
  body('code_banque').optional().isLength({ max: 20 }).withMessage('Code banque trop long')
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

    // Vérifier si on peut effectuer des paiements
    if (!canMakePayments()) {
      return res.status(403).json({ 
        error: 'Payment not allowed',
        message: 'Les paiements ne sont autorisés qu\'à partir du 20 du mois'
      });
    }

    const paiementData = req.body;
    
    // Vérifier que l'employé existe
    const employe = await User.findByPk(paiementData.employe_id);
    if (!employe) {
      return res.status(404).json({ 
        error: 'Employee not found',
        message: 'Employé non trouvé'
      });
    }

    // Vérifier qu'il n'y a pas déjà un paiement du même type pour la même période
    const existingPaiementSalaire = await PaiementSalaire.findOne({
      where: {
        employe_id: paiementData.employe_id,
        type_paiement: paiementData.type_paiement,
        periode_paiement: paiementData.periode_paiement
      }
    });

    if (existingPaiementSalaire) {
      return res.status(400).json({ 
        error: 'Payment already exists',
        message: `Un paiement de type ${paiementData.type_paiement} existe déjà pour la période ${paiementData.periode_paiement}`
      });
    }

    // Créer le paiement
    const paiement = await PaiementSalaire.create({
      ...paiementData,
      nom_employe: employe.nom,
      prenom_employe: employe.prenom,
      email_employe: employe.email,
      created_by: req.user.id,
      statut: 'En attente'
    });

    // Récupérer le paiement avec les relations
    const paiementWithRelations = await PaiementSalaire.findByPk(paiement.id, {
      include: [
        {
          model: User,
          as: 'Employe',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'Createur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'PaiementSalaire créé avec succès',
      data: paiementWithRelations
    });

  } catch (error) {
    console.error('Error creating paiement:', error);
    res.status(500).json({
      error: 'Failed to create paiement',
      message: 'Erreur lors de la création du paiement'
    });
  }
});

// PUT /api/paiements-salaires/:id - Mettre à jour un paiement
router.put('/:id', [
  requireRole(['Administrateur', 'Superviseur RH', 'Superviseur Comptable']),
  param('id').isInt({ min: 1 }),
  body('montant').optional().isDecimal({ decimal_digits: '0,2' }),
  body('type_paiement').optional().isIn(['Salaire', 'Prime', 'Bonus', 'Indemnité', 'Avance', 'Remboursement', 'Autre']),
  body('periode_paiement').optional().matches(/^\d{4}-\d{2}$/),
  body('date_paiement').optional().isDate(),
  body('description').optional().isLength({ max: 1000 }),
  body('statut').optional().isIn(['En attente', 'Payé', 'Annulé', 'En cours']),
  body('methode_paiement').optional().isIn(['Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money', 'Autre']),
  body('numero_compte').optional().isLength({ max: 50 }),
  body('nom_banque').optional().isLength({ max: 100 }),
  body('code_banque').optional().isLength({ max: 20 }),
  body('commentaires_validation').optional().isLength({ max: 1000 })
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
    const updateData = req.body;

    const paiement = await PaiementSalaire.findByPk(id);
    if (!paiement) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'PaiementSalaire non trouvé'
      });
    }

    // Si on change le statut à "Payé", ajouter les informations de validation
    if (updateData.statut === 'Payé' && paiement.statut !== 'Payé') {
      updateData.valide_par = req.user.id;
      updateData.date_validation = new Date();
    }

    updateData.updated_by = req.user.id;

    await paiement.update(updateData);

    // Récupérer le paiement mis à jour avec les relations
    const updatedPaiementSalaire = await PaiementSalaire.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Employe',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'Validateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'Createur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'Modificateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'PaiementSalaire mis à jour avec succès',
      data: updatedPaiementSalaire
    });

  } catch (error) {
    console.error('Error updating paiement:', error);
    res.status(500).json({
      error: 'Failed to update paiement',
      message: 'Erreur lors de la mise à jour du paiement'
    });
  }
});

// DELETE /api/paiements-salaires/:id - Supprimer un paiement
router.delete('/:id', [
  requireRole(['Administrateur', 'Superviseur RH', 'Superviseur Comptable']),
  param('id').isInt({ min: 1 })
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

    const { id } = req.params;

    const paiement = await PaiementSalaire.findByPk(id);
    if (!paiement) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'PaiementSalaire non trouvé'
      });
    }

    // Ne pas permettre la suppression des paiements déjà payés
    if (paiement.statut === 'Payé') {
      return res.status(400).json({
        error: 'Cannot delete paid payment',
        message: 'Impossible de supprimer un paiement déjà effectué'
      });
    }

    await paiement.destroy();

    res.json({
      success: true,
      message: 'PaiementSalaire supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting paiement:', error);
    res.status(500).json({
      error: 'Failed to delete paiement',
      message: 'Erreur lors de la suppression du paiement'
    });
  }
});

// GET /api/paiements-salaires/stats - Statistiques des paiements
router.get('/stats', async (req, res) => {
  try {
    const { periode } = req.query;
    
    const whereClause = {};
    if (periode) whereClause.periode_paiement = periode;

    const stats = await PaiementSalaire.findAll({
      where: whereClause,
        attributes: [
          'statut',
          'type_paiement',
          [PaiementSalaire.sequelize.fn('COUNT', PaiementSalaire.sequelize.col('id')), 'count'],
        [PaiementSalaire.sequelize.fn('SUM', PaiementSalaire.sequelize.col('montant')), 'total_montant']
      ],
      group: ['statut', 'type_paiement'],
      raw: true
    });

    const totalPaiementSalaires = await PaiementSalaire.count({ where: whereClause });
    const totalMontant = await PaiementSalaire.sum('montant', { where: whereClause });

    res.json({
      success: true,
      data: {
        stats,
        totalPaiementSalaires,
        totalMontant: totalMontant || 0,
        canMakePayments: canMakePayments()
      }
    });

  } catch (error) {
    console.error('Error fetching paiement stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch paiement stats',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router; 