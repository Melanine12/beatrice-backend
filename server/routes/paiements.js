const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Paiement = require('../models/Paiement');
const User = require('../models/User');
const Caisse = require('../models/Caisse');
const Chambre = require('../models/Chambre');
const Depense = require('../models/Depense');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/paiements - Récupérer tous les paiements avec pagination et filtres
router.get('/', [
  query('statut').optional().isIn(['En attente', 'Validé', 'Rejeté', 'Annulé']),
  query('type_paiement').optional().isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Autre']),
  query('utilisateur_id').optional().isInt(),
  query('caisse_id').optional().isInt(),
  query('chambre_id').optional().isInt(),
  query('depense_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date_debut').optional().isISO8601(),
  query('date_fin').optional().isISO8601()
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
      statut, 
      type_paiement, 
      utilisateur_id, 
      caisse_id, 
      chambre_id, 
      depense_id,
      page = 1, 
      limit = 20,
      date_debut,
      date_fin
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construire la clause where
    const whereClause = {};
    if (statut) whereClause.statut = statut;
    if (type_paiement) whereClause.type_paiement = type_paiement;
    if (utilisateur_id) whereClause.utilisateur_id = utilisateur_id;
    if (caisse_id) whereClause.caisse_id = caisse_id;
    if (chambre_id) whereClause.chambre_id = chambre_id;
    if (depense_id) whereClause.depense_id = depense_id;

    // Filtrage par date
    if (date_debut || date_fin) {
      whereClause.date_paiement = {};
      if (date_debut) whereClause.date_paiement[require('sequelize').Op.gte] = new Date(date_debut);
      if (date_fin) whereClause.date_paiement[require('sequelize').Op.lte] = new Date(date_fin);
    }

    // Fetch basic paiements data first
    const { count, rows: paiements } = await Paiement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_paiement', 'DESC']]
    });

    // Fetch related data separately to avoid connection issues
    const paiementsWithDetails = await Promise.all(
      paiements.map(async (paiement) => {
        const paiementData = paiement.toJSON();
        
        try {
          // Fetch user details
          if (paiement.utilisateur_id) {
            const user = await User.findByPk(paiement.utilisateur_id, {
              attributes: ['id', 'nom', 'prenom', 'email']
            });
            paiementData.utilisateur = user;
          }
          
          // Fetch caisse details
          if (paiement.caisse_id) {
            const caisse = await Caisse.findByPk(paiement.caisse_id, {
              attributes: ['id', 'nom', 'code_caisse', 'devise']
            });
            paiementData.caisse = caisse;
          }
          
          // Fetch chambre details
          if (paiement.chambre_id) {
            const chambre = await Chambre.findByPk(paiement.chambre_id, {
              attributes: ['id', 'numero', 'type']
            });
            paiementData.chambre = chambre;
          }
          
          // Fetch depense details
          if (paiement.depense_id) {
            const depense = await Depense.findByPk(paiement.depense_id, {
              attributes: ['id', 'titre', 'montant', 'devise']
            });
            paiementData.depense = depense;
          }
        } catch (error) {
          console.error('Error fetching related data for paiement:', paiement.id, error);
          // Continue without related data if there's an error
        }
        
        return paiementData;
      })
    );

    res.json({
      success: true,
      paiements: paiementsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements'
    });
  }
});

// GET /api/paiements/:id - Récupérer un paiement spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Caisse,
          as: 'caisse',
          attributes: ['id', 'nom', 'code_caisse', 'devise']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'devise']
        }
      ]
    });

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      paiement
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement'
    });
  }
});

// POST /api/paiements - Créer un nouveau paiement
router.post('/', [
  requireRole(['Superviseur', 'Guichetier', 'Administrateur', 'Patron']),
  body('montant')
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être un nombre positif'),
  body('devise')
    .isIn(['FC', 'EUR', 'USD', 'GBP', 'JPY'])
    .withMessage('Devise non supportée. Utilisez FC, EUR, USD, GBP ou JPY'),
  body('type_paiement')
    .isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Autre'])
    .withMessage('Type de paiement invalide'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('beneficiaire')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Le nom du bénéficiaire ne peut pas dépasser 255 caractères'),
  body('numero_cheque')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le numéro de chèque ne peut pas dépasser 50 caractères'),
  body('caisse_id')
    .optional()
    .isInt()
    .withMessage('L\'ID de la caisse doit être un entier'),
  body('chambre_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(parseInt(value)) || value === 'null';
    })
    .withMessage('L\'ID de la chambre doit être un entier ou null'),
  body('depense_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(parseInt(value)) || value === 'null';
    })
    .withMessage('L\'ID de la dépense doit être un entier ou null'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères')
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

        // Utiliser la référence fournie ou en générer une
    let reference = req.body.reference;
    if (!reference || reference.trim() === '') {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      reference = `PAY-${timestamp}-${random}`;
    }    const paiementData = {
      ...req.body,
      reference,
      date_paiement: req.body.date_paiement || new Date()
    };

    // Convertir les IDs en nombres
    if (paiementData.caisse_id && paiementData.caisse_id !== 'null' && paiementData.caisse_id !== '') {
      paiementData.caisse_id = parseInt(paiementData.caisse_id);
    } else {
      paiementData.caisse_id = null;
    }

    if (paiementData.chambre_id && paiementData.chambre_id !== 'null' && paiementData.chambre_id !== '') {
      paiementData.chambre_id = parseInt(paiementData.chambre_id);
    } else {
      paiementData.chambre_id = null;
    }

    if (paiementData.depense_id && paiementData.depense_id !== 'null' && paiementData.depense_id !== '') {
      paiementData.depense_id = parseInt(paiementData.depense_id);
    } else {
      paiementData.depense_id = null;
    }

    const paiement = await Paiement.create(paiementData);

    // Mettre à jour le solde de la caisse si le paiement est lié à une caisse
    if (paiementData.caisse_id) {
      try {
        const Caisse = require('../models/Caisse');
        await Caisse.calculerSoldeParId(paiementData.caisse_id);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du solde de la caisse:', error);
        // Continuer même si la mise à jour du solde échoue
      }
    }

    // Récupérer le paiement avec les relations
    const paiementComplet = await Paiement.findByPk(paiement.id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Caisse,
          as: 'caisse',
          attributes: ['id', 'nom', 'code_caisse', 'devise']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'devise']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Paiement créé avec succès',
      paiement: paiementComplet
    });

  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement'
    });
  }
});

// PUT /api/paiements/:id - Mettre à jour un paiement
router.put('/:id', [
  requireRole(['Superviseur', 'Guichetier', 'Administrateur', 'Patron']),
  body('montant')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être un nombre positif'),
  body('devise')
    .optional()
    .isIn(['FC', 'EUR', 'USD', 'GBP', 'JPY'])
    .withMessage('Devise non supportée. Utilisez FC, EUR, USD, GBP ou JPY'),
  body('type_paiement')
    .optional()
    .isIn(['Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Autre'])
    .withMessage('Type de paiement invalide'),
  body('statut')
    .optional()
    .isIn(['En attente', 'Validé', 'Rejeté', 'Annulé'])
    .withMessage('Statut invalide'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('beneficiaire')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Le nom du bénéficiaire ne peut pas dépasser 255 caractères'),
  body('numero_cheque')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le numéro de chèque ne peut pas dépasser 50 caractères'),
  body('caisse_id')
    .optional()
    .isInt()
    .withMessage('L\'ID de la caisse doit être un entier'),
  body('chambre_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(parseInt(value)) || value === 'null';
    })
    .withMessage('L\'ID de la chambre doit être un entier ou null'),
  body('depense_id')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(parseInt(value)) || value === 'null';
    })
    .withMessage('L\'ID de la dépense doit être un entier ou null'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères')
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

    const { id } = req.params;
    const paiement = await Paiement.findByPk(id);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier les permissions : les guichetiers ne peuvent modifier que leurs propres paiements
    if (req.user.role === 'Guichetier' && paiement.utilisateur_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres paiements'
      });
    }

    // Convertir les IDs en nombres
    const updateData = { ...req.body };
    if (updateData.caisse_id && updateData.caisse_id !== 'null' && updateData.caisse_id !== '') {
      updateData.caisse_id = parseInt(updateData.caisse_id);
    } else if (updateData.caisse_id === 'null' || updateData.caisse_id === '') {
      updateData.caisse_id = null;
    }

    if (updateData.chambre_id && updateData.chambre_id !== 'null' && updateData.chambre_id !== '') {
      updateData.chambre_id = parseInt(updateData.chambre_id);
    } else if (updateData.chambre_id === 'null' || updateData.chambre_id === '') {
      updateData.chambre_id = null;
    }

    if (updateData.depense_id && updateData.depense_id !== 'null' && updateData.depense_id !== '') {
      updateData.depense_id = parseInt(updateData.depense_id);
    } else if (updateData.depense_id === 'null' || updateData.depense_id === '') {
      updateData.depense_id = null;
    }

    await paiement.update(updateData);

    // Mettre à jour le solde de la caisse si nécessaire
    try {
      const Caisse = require('../models/Caisse');
      
      // Si la caisse a changé, mettre à jour les deux caisses
      if (paiement.caisse_id !== updateData.caisse_id) {
        // Mettre à jour l'ancienne caisse si elle existait
        if (paiement.caisse_id) {
          await Caisse.calculerSoldeParId(paiement.caisse_id);
        }
        // Mettre à jour la nouvelle caisse
        if (updateData.caisse_id) {
          await Caisse.calculerSoldeParId(updateData.caisse_id);
        }
      } else if (updateData.caisse_id) {
        // Si la caisse n'a pas changé mais qu'il y en a une, la mettre à jour
        await Caisse.calculerSoldeParId(updateData.caisse_id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde de la caisse:', error);
      // Continuer même si la mise à jour du solde échoue
    }

    // Récupérer le paiement mis à jour avec les relations
    const paiementMisAJour = await Paiement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Caisse,
          as: 'caisse',
          attributes: ['id', 'nom', 'code_caisse', 'devise']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type']
        },
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'devise']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Paiement mis à jour avec succès',
      paiement: paiementMisAJour
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paiement'
    });
  }
});

// DELETE /api/paiements/:id - Supprimer un paiement
router.delete('/:id', [
  requireRole('Superviseur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findByPk(id);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier si le paiement peut être supprimé
    if (paiement.statut === 'Validé') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un paiement validé'
      });
    }

    await paiement.destroy();

    // Mettre à jour le solde de la caisse si le paiement était lié à une caisse
    if (paiement.caisse_id) {
      try {
        const Caisse = require('../models/Caisse');
        await Caisse.calculerSoldeParId(paiement.caisse_id);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du solde de la caisse:', error);
        // Continuer même si la mise à jour du solde échoue
      }
    }

    res.json({
      success: true,
      message: 'Paiement supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du paiement'
    });
  }
});

// PATCH /api/paiements/:id/validate - Valider un paiement
router.patch('/:id/validate', [
  requireRole('Superviseur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findByPk(id);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    if (paiement.statut !== 'En attente') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les paiements en attente peuvent être validés'
      });
    }

    await paiement.approve();

    // Mettre à jour le solde de la caisse si le paiement est lié à une caisse
    if (paiement.caisse_id) {
      try {
        const Caisse = require('../models/Caisse');
        await Caisse.calculerSoldeParId(paiement.caisse_id);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du solde de la caisse:', error);
        // Continuer même si la mise à jour du solde échoue
      }
    }

    res.json({
      success: true,
      message: 'Paiement validé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur lors de la validation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du paiement'
    });
  }
});

// PATCH /api/paiements/:id/reject - Rejeter un paiement
router.patch('/:id/reject', [
  requireRole('Superviseur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findByPk(id);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    if (paiement.statut !== 'En attente') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les paiements en attente peuvent être rejetés'
      });
    }

    await paiement.reject();

    res.json({
      success: true,
      message: 'Paiement rejeté avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur lors du rejet du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du paiement'
    });
  }
});

// PATCH /api/paiements/:id/cancel - Annuler un paiement
router.patch('/:id/cancel', [
  requireRole('Superviseur')
], async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await Paiement.findByPk(id);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    if (paiement.statut === 'Validé') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler un paiement validé'
      });
    }

    await paiement.cancel();

    res.json({
      success: true,
      message: 'Paiement annulé avec succès',
      paiement
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du paiement'
    });
  }
});

// GET /api/paiements/reports/financial - Rapports financiers
router.get('/reports/financial', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des rapports financiers...');
    
    // Paramètre de diagnostic
    const { debug } = req.query;
    const isDebugMode = debug === 'true';
    
    if (isDebugMode) {
      console.log('🔍 Mode diagnostic activé...');
      
      // 1. Vérifier le nombre total de paiements
      const totalPayments = await Paiement.count();
      console.log(`📊 Total des paiements dans la base: ${totalPayments}`);
      
      // 2. Vérifier les 5 paiements les plus récents
      const recentPayments = await Paiement.findAll({
        order: [['date_paiement', 'DESC']],
        limit: 5,
        raw: true
      });
      
      console.log('📅 5 paiements les plus récents:');
      recentPayments.forEach(p => {
        console.log(`  - ID: ${p.id}, Date: ${p.date_paiement}, Montant: ${p.montant} ${p.devise}`);
      });
      
      // 3. Vérifier la date limite (30 jours en arrière)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      console.log(`📅 Date limite (30 jours en arrière): ${thirtyDaysAgo.toISOString()}`);
      
      // 4. Vérifier les paiements depuis cette date
      const paymentsSinceDate = await Paiement.findAll({
        where: {
          date_paiement: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        order: [['date_paiement', 'DESC']],
        raw: true
      });
      
      console.log(`🔍 Paiements depuis ${thirtyDaysAgo.toISOString()}: ${paymentsSinceDate.length}`);
      
      // 5. Vérifier s'il y a des paiements avec des dates NULL
      const nullDatePayments = await Paiement.findAll({
        where: {
          date_paiement: null
        },
        raw: true
      });
      
      console.log(`⚠️ Paiements avec date NULL: ${nullDatePayments.length}`);
      
      // Retourner les informations de diagnostic
      return res.json({
        success: true,
        debug: true,
        data: {
          totalPayments,
          recentPayments,
          paymentsSinceDate: paymentsSinceDate.length,
          nullDatePayments: nullDatePayments.length,
          thirtyDaysAgo: thirtyDaysAgo.toISOString(),
          message: 'Mode diagnostic - Vérifiez les logs du serveur'
        }
      });
    }

    console.log('🚀 Début de la route /reports/financial');
    
    const { Op } = require('sequelize');
    const Depense = require('../models/Depense');
    
    // Get current year data - mais aussi vérifier toutes les données
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    console.log('📅 Année en cours:', currentYear);
    console.log('📅 Période de calcul:', startOfYear.toISOString(), 'à', endOfYear.toISOString());

    // Initialiser les variables avec des valeurs par défaut
    let revenueByCurrency = [];
    let expensesByCurrency = [];
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAllTimeRevenueByCurrency = {};
    let monthlyRevenue = [];
    let monthlyExpenses = [];
    let monthlyDataByCurrency = {}; // Déclarer ici pour qu'elle soit accessible partout
    let topRevenueSources = [];
    let expenseBreakdown = [];
    let caisses = [];
    let paymentStatsByStatus = [];
    let paymentStatsByType = [];
    let recentPayments = [];

    try {
      // Get total revenue by currency (sum of all validated payments grouped by devise)
      console.log('🔍 Calcul des revenus par devise...');
      revenueByCurrency = await Paiement.findAll({
        attributes: [
          'devise',
          [Paiement.sequelize.fn('SUM', Paiement.sequelize.col('montant')), 'total']
        ],
        where: {
          statut: 'Validé',
          date_paiement: {
            [Op.between]: [startOfYear, endOfYear]
          }
        },
        group: ['devise']
      });
      
      console.log('✅ Revenus par devise récupérés avec succès:', revenueByCurrency.length, 'devises trouvées');
      
      // Calculer le total des revenus (pour compatibilité) - seulement pour la devise principale
      if (revenueByCurrency.length > 0) {
        // Prendre la première devise comme devise principale pour le total
        const mainCurrency = revenueByCurrency[0].devise || 'USD';
        const mainCurrencyRevenue = revenueByCurrency.find(item => item.devise === mainCurrency);
        totalRevenue = mainCurrencyRevenue ? parseFloat(mainCurrencyRevenue.dataValues.total || 0) : 0;
      }
      
      // Debug: Vérifier tous les paiements validés (toutes périodes) par devise
      const allValidPaymentsByCurrency = await Paiement.findAll({
        where: { statut: 'Validé' },
        attributes: [
          'id', 
          'montant', 
          'devise',
          'date_paiement', 
          'type_paiement'
        ],
        order: [['date_paiement', 'DESC']]
      });
      
      console.log('📊 Total des paiements validés trouvés:', allValidPaymentsByCurrency.length);
      if (allValidPaymentsByCurrency.length > 0) {
        console.log('📋 Exemples de paiements validés:');
        allValidPaymentsByCurrency.slice(0, 3).forEach(p => {
          console.log(`  - ID: ${p.id}, Montant: ${p.montant} ${p.devise}, Date: ${p.date_paiement}, Type: ${p.type_paiement}`);
        });
        
        // Calculer le total par devise de tous les paiements validés (toutes périodes)
        allValidPaymentsByCurrency.forEach(p => {
          const devise = p.devise || 'USD';
          if (!totalAllTimeRevenueByCurrency[devise]) {
            totalAllTimeRevenueByCurrency[devise] = 0;
          }
          totalAllTimeRevenueByCurrency[devise] += parseFloat(p.montant || 0);
        });
        
        console.log('💰 Revenus totaux par devise toutes périodes:', totalAllTimeRevenueByCurrency);
        
        // Si pas de revenus pour l'année en cours, utiliser le total toutes périodes
        if (!totalRevenue || totalRevenue === 0) {
          console.log('⚠️  Aucun revenu pour l\'année en cours, utilisation du total toutes périodes');
          totalRevenue = Object.values(totalAllTimeRevenueByCurrency).reduce((sum, amount) => sum + amount, 0);
        }
      }
    } catch (revenueError) {
      console.error('❌ Erreur lors du calcul des revenus:', revenueError.message);
      // Continuer avec les valeurs par défaut
    }

    try {
      // Get total expenses by currency (sum of ONLY PAID expenses grouped by devise)
      console.log('🔍 Calcul des dépenses par devise (uniquement payées)...');
      expensesByCurrency = await Depense.findAll({
        attributes: [
          'devise',
          [Depense.sequelize.fn('SUM', Depense.sequelize.col('montant')), 'total']
        ],
        where: {
          // Inclure UNIQUEMENT les dépenses payées
          statut: 'Payée'
        },
        group: ['devise']
      });
      
      console.log('✅ Dépenses payées par devise récupérées avec succès:', expensesByCurrency.length, 'devises trouvées');
      
      // Debug: Afficher les dépenses trouvées
      if (expensesByCurrency.length > 0) {
        console.log('💰 Dépenses payées trouvées par devise:');
        expensesByCurrency.forEach(exp => {
          console.log(`  - ${exp.devise}: ${exp.dataValues.total}`);
        });
      }
      
      // Calculer le total des dépenses (pour compatibilité) - seulement pour la devise principale
      if (expensesByCurrency.length > 0) {
        // Prendre la première devise comme devise principale pour le total
        const mainCurrency = expensesByCurrency[0].devise || 'USD';
        const mainCurrencyExpenses = expensesByCurrency.find(item => item.devise === mainCurrency);
        totalExpenses = mainCurrencyExpenses ? parseFloat(mainCurrencyExpenses.dataValues.total || 0) : 0;
      }
    } catch (expensesError) {
      console.error('❌ Erreur lors du calcul des dépenses:', expensesError.message);
      // Continuer avec les valeurs par défaut
    }

    // Calculate net profit
    const netProfit = (totalRevenue || 0) - (totalExpenses || 0);
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    try {
      // Get monthly revenue and expenses data (last 6 months) - PAR DEVISE
      console.log('🔍 Calcul des données mensuelles par devise...');
      
      // Initialiser les structures pour les données mensuelles par devise
      const monthlyDataByCurrency = {
        FC: { revenue: [], expenses: [] },
        USD: { revenue: [], expenses: [] },
        EUR: { revenue: [], expenses: [] }
      };
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentYear, new Date().getMonth() - i, 1);
        const monthEnd = new Date(currentYear, new Date().getMonth() - i + 1, 0, 23, 59, 59);
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthName = monthNames[monthStart.getMonth()];
        
        console.log(`📅 Calcul pour le mois: ${monthName} (${monthStart.toISOString()} à ${monthEnd.toISOString()})`);
        
        // Calculer les revenus par devise pour ce mois
        const monthRevenueByCurrency = await Paiement.findAll({
          attributes: [
            'devise',
            [Paiement.sequelize.fn('SUM', Paiement.sequelize.col('montant')), 'total']
          ],
          where: {
            statut: 'Validé',
            date_paiement: {
              [Op.between]: [monthStart, monthEnd]
            }
          },
          group: ['devise']
        });
        
        // Calculer les dépenses par devise pour ce mois
        const monthExpensesByCurrency = await Depense.findAll({
          attributes: [
            'devise',
            [Depense.sequelize.fn('SUM', Depense.sequelize.col('montant')), 'total']
          ],
          where: {
            statut: 'Payée'
            // Supprimer le filtre de date pour trouver toutes les dépenses payées
            // date_depense: {
            //   [Op.between]: [monthStart, monthEnd]
            // }
          },
          group: ['devise']
        });
        
        // Debug: Afficher les dépenses trouvées pour ce mois
        console.log(`🔍 Dépenses trouvées pour ${monthName}:`, monthExpensesByCurrency.length);
        if (monthExpensesByCurrency.length > 0) {
          monthExpensesByCurrency.forEach(exp => {
            console.log(`  - ${exp.devise}: ${exp.dataValues.total}`);
          });
        }
        
        // Ajouter les données pour chaque devise
        ['FC', 'USD', 'EUR'].forEach(devise => {
          const revenue = monthRevenueByCurrency.find(r => r.devise === devise);
          const expense = monthExpensesByCurrency.find(e => e.devise === devise);
          
          monthlyDataByCurrency[devise].revenue.push({
            month: monthName,
            revenue: parseFloat(revenue?.dataValues.total || 0)
          });
          
          monthlyDataByCurrency[devise].expenses.push({
            month: monthName,
            expenses: parseFloat(expense?.dataValues.total || 0)
          });
        });
        
        console.log(`✅ ${monthName}: Revenus=${monthRevenueByCurrency.length} devises, Dépenses=${monthExpensesByCurrency.length} devises`);
      }
      
      // Créer les structures finales pour la compatibilité
      monthlyRevenue = monthlyDataByCurrency.FC.revenue; // Pour compatibilité (devise principale)
      monthlyExpenses = monthlyDataByCurrency.FC.expenses; // Pour compatibilité (devise principale)
      
      console.log('✅ Données mensuelles par devise calculées avec succès');
      console.log('📊 FC:', monthlyDataByCurrency.FC);
      console.log('📊 USD:', monthlyDataByCurrency.USD);
      console.log('📊 EUR:', monthlyDataByCurrency.EUR);
      
    } catch (monthlyError) {
      console.error('❌ Erreur lors du calcul des données mensuelles:', monthlyError.message);
      // Utiliser des données par défaut
      monthlyRevenue = [
        { month: 'Jan', revenue: 0 }, { month: 'Fév', revenue: 0 },
        { month: 'Mar', revenue: 0 }, { month: 'Avr', revenue: 0 },
        { month: 'Mai', revenue: 0 }, { month: 'Juin', revenue: 0 }
      ];
      monthlyExpenses = [
        { month: 'Jan', expenses: 0 }, { month: 'Fév', expenses: 0 },
        { month: 'Mar', expenses: 0 }, { month: 'Avr', expenses: 0 },
        { month: 'Mai', expenses: 0 }, { month: 'Juin', expenses: 0 }
      ];
      monthlyDataByCurrency = {};
    }

    try {
      // Get revenue sources breakdown by payment type
      const revenueByType = await Paiement.findAll({
        attributes: [
          'type_paiement',
          [Paiement.sequelize.fn('SUM', Paiement.sequelize.col('montant')), 'total'],
          [Paiement.sequelize.fn('COUNT', Paiement.sequelize.col('id')), 'count']
        ],
        where: {
          statut: 'Validé',
          date_paiement: {
            [Op.between]: [startOfYear, endOfYear]
          }
        },
        group: ['type_paiement']
      });

      // Calculate percentages for revenue sources
      topRevenueSources = revenueByType.map(source => ({
        source: source.type_paiement || 'Autre',
        revenue: parseFloat(source.dataValues.total || 0),
        percentage: totalRevenue > 0 ? Math.round(((parseFloat(source.dataValues.total || 0) / totalRevenue) * 100)) : 0
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (revenueTypeError) {
      console.error('❌ Erreur lors du calcul des sources de revenus:', revenueTypeError.message);
      topRevenueSources = [];
    }

    try {
      // Get expense breakdown by category (uniquement les dépenses payées)
      const expensesByCategory = await Depense.findAll({
        attributes: [
          'categorie',
          [Depense.sequelize.fn('SUM', Depense.sequelize.col('montant')), 'total'],
          [Depense.sequelize.fn('COUNT', Depense.sequelize.col('id')), 'count']
        ],
        where: {
          // Inclure UNIQUEMENT les dépenses payées
          statut: 'Payée'
        },
        group: ['categorie']
      });

      // Calculate percentages for expense categories
      expenseBreakdown = expensesByCategory.map(category => ({
        category: category.categorie,
        amount: parseFloat(category.dataValues.total || 0),
        percentage: totalExpenses > 0 ? Math.round(((parseFloat(category.dataValues.total || 0) / totalExpenses) * 100)) : 0
      })).sort((a, b) => b.amount - a.amount);
    } catch (expenseCategoryError) {
      console.error('❌ Erreur lors du calcul des catégories de dépenses:', expenseCategoryError.message);
      expenseBreakdown = [];
    }

    try {
      // Get cash register balances
      caisses = await Caisse.findAll({
        where: { statut: 'Active' },
        attributes: ['id', 'nom', 'solde_actuel', 'devise']
      });
    } catch (caissesError) {
      console.error('❌ Erreur lors de la récupération des caisses:', caissesError.message);
      caisses = [];
    }

    // Calculate total cash balance
    const totalCashBalance = caisses.reduce((total, caisse) => {
      return total + parseFloat(caisse.solde_actuel || 0);
    }, 0);

    try {
      // Get payment statistics by status and currency
      paymentStatsByStatus = await Paiement.findAll({
        attributes: [
          'statut',
          'devise',
          [Paiement.sequelize.fn('COUNT', Paiement.sequelize.col('id')), 'count'],
          [Paiement.sequelize.fn('SUM', Paiement.sequelize.col('montant')), 'total']
        ],
        where: {
          date_paiement: {
            [Op.between]: [startOfYear, endOfYear]
          }
        },
        group: ['statut', 'devise']
      });
    } catch (statusStatsError) {
      console.error('❌ Erreur lors du calcul des statistiques par statut:', statusStatsError.message);
      paymentStatsByStatus = [];
    }

    try {
      // Get payment statistics by type and currency
      paymentStatsByType = await Paiement.findAll({
        attributes: [
          'type_paiement',
          'devise',
          [Paiement.sequelize.fn('COUNT', Paiement.sequelize.col('id')), 'count'],
          [Paiement.sequelize.fn('SUM', Paiement.sequelize.col('montant')), 'total']
        ],
        where: {
          date_paiement: {
            [Op.between]: [startOfYear, endOfYear]
          }
        },
        group: ['type_paiement', 'devise']
      });
    } catch (typeStatsError) {
      console.error('❌ Erreur lors du calcul des statistiques par type:', typeStatsError.message);
      paymentStatsByType = [];
    }

    try {
      // Get recent payments (last 30 days) - Tous les statuts
      console.log('🔍 Récupération des paiements des 30 derniers jours...');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      console.log('📅 Date limite (30 jours en arrière):', thirtyDaysAgo.toISOString());
      
      // Utiliser une approche plus simple qui fonctionne
      recentPayments = await Paiement.findAll({
        include: [
          {
            model: Caisse,
            as: 'caisse',
            attributes: ['nom', 'devise']
          },
          {
            model: User,
            as: 'utilisateur', // Spécifier clairement l'alias
            attributes: ['nom', 'prenom']
          }
        ],
        order: [['date_paiement', 'DESC']],
        limit: 50
      });
      
      // Filtrer côté serveur pour les 30 derniers jours
      recentPayments = recentPayments.filter(payment => {
        const datePaiement = new Date(payment.date_paiement);
        return datePaiement >= thirtyDaysAgo;
      });
      
      console.log('✅ Paiements récents récupérés:', recentPayments.length);
      
      // Si aucun paiement récent, essayer de récupérer des dépenses récentes
      if (recentPayments.length === 0) {
        console.log('🔍 Aucun paiement récent trouvé, récupération des dépenses récentes...');
        try {
          const Depense = require('../models/Depense');
          const recentDepenses = await Depense.findAll({
            where: {
              date_depense: {
                [Op.gte]: thirtyDaysAgo
              }
            },
            include: [
              {
                model: User,
                as: 'demandeur',
                attributes: ['nom', 'prenom']
              }
            ],
            order: [['date_depense', 'DESC']],
            limit: 50
          });
          
          console.log('✅ Dépenses récentes récupérées:', recentDepenses.length);
          
          // Convertir les dépenses en format compatible avec les paiements
          if (recentDepenses.length > 0) {
            recentPayments = recentDepenses.map(depense => ({
              id: depense.id,
              reference: `DEP-${depense.id}`,
              montant: depense.montant,
              devise: depense.devise,
              type_paiement: 'Dépense',
              statut: depense.statut,
              date_paiement: depense.date_depense,
              description: depense.titre,
              beneficiaire: depense.fournisseur || 'N/A',
              caisse_id: depense.caisse_id,
              utilisateur_id: depense.demandeur_id,
              caisse: null, // Pas de caisse associée aux dépenses
              utilisateur: depense.demandeur ? {
                nom: depense.demandeur.nom,
                prenom: depense.demandeur.prenom
              } : null
            }));
            
            console.log('✅ Dépenses converties en format paiement:', recentPayments.length);
          }
        } catch (depensesError) {
          console.error('❌ Erreur lors de la récupération des dépenses récentes:', depensesError.message);
        }
      }
      
      if (recentPayments.length > 0) {
        console.log('📋 Exemples de transactions récentes:');
        recentPayments.slice(0, 3).forEach(p => {
          console.log(`  - ID: ${p.id}, Réf: ${p.reference}, Montant: ${p.montant} ${p.devise}, Statut: ${p.statut}, Date: ${p.date_paiement}`);
        });
      }
    } catch (recentPaymentsError) {
      console.error('❌ Erreur lors de la récupération des paiements récents:', recentPaymentsError.message);
      console.error('Stack trace:', recentPaymentsError.stack);
      recentPayments = [];
    }

    console.log('✅ Tous les calculs terminés avec succès');

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue || 0,
        totalExpenses: totalExpenses || 0,
        netProfit: netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        monthlyRevenue,
        monthlyExpenses,
        monthlyDataByCurrency, // Nouvelles données mensuelles par devise
        topRevenueSources,
        expenseBreakdown,
        totalCashBalance,
        // Données multi-devises
        revenueByCurrency: revenueByCurrency.map(item => ({
          devise: item.devise || 'USD',
          total: parseFloat(item.dataValues.total || 0)
        })),
        expensesByCurrency: expensesByCurrency.map(item => ({
          devise: item.devise || 'USD',
          total: parseFloat(item.dataValues.total || 0)
        })),
        totalAllTimeRevenueByCurrency: totalAllTimeRevenueByCurrency || {},
        caisses: caisses.map(caisse => ({
          id: caisse.id,
          nom: caisse.nom,
          solde: parseFloat(caisse.solde_actuel || 0),
          devise: caisse.devise
        })),
        paymentStatsByStatus: paymentStatsByStatus.map(stat => ({
          status: stat.statut,
          devise: stat.devise || 'USD',
          count: parseInt(stat.dataValues.count || 0),
          total: parseFloat(stat.dataValues.total || 0)
        })),
        paymentStatsByType: paymentStatsByType.map(stat => ({
          type: stat.type_paiement,
          devise: stat.devise || 'USD',
          count: parseInt(stat.dataValues.count || 0),
          total: parseFloat(stat.dataValues.total || 0)
        })),
        recentPayments: recentPayments.map(payment => ({
          id: payment.id,
          reference: payment.reference,
          montant: parseFloat(payment.montant),
          devise: payment.devise,
          type_paiement: payment.type_paiement,
          date_paiement: payment.date_paiement,
          caisse: payment.caisse ? {
            nom: payment.caisse.nom,
            devise: payment.caisse.devise
          } : null,
          utilisateur: payment.utilisateur ? {
            nom: payment.utilisateur.nom,
            prenom: payment.utilisateur.prenom
          } : null
        }))
      }
    });

  } catch (error) {
    console.error('Get financial reports error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get financial reports',
      message: 'Erreur lors de la récupération des rapports financiers'
    });
  }
});

module.exports = router; 