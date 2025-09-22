const express = require('express');
const router = express.Router();
const { Contrat, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Apply authentication to all routes
router.use(authenticateToken);

// Middleware de validation
const validateContrat = [
  body('employe_id').isInt({ min: 1 }).withMessage('ID employé requis'),
  body('type_contrat').isIn(['CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant']).withMessage('Type de contrat invalide'),
  body('numero_contrat').notEmpty().withMessage('Numéro de contrat requis'),
  body('date_debut').isISO8601().withMessage('Date de début invalide'),
  body('date_fin').optional().isISO8601().withMessage('Date de fin invalide'),
  body('salaire_brut').optional().isDecimal().withMessage('Salaire brut invalide'),
  body('salaire_net').optional().isDecimal().withMessage('Salaire net invalide'),
  body('duree_hebdomadaire').optional().isInt({ min: 1, max: 60 }).withMessage('Durée hebdomadaire invalide'),
  body('statut').optional().isIn(['Actif', 'Expiré', 'Résilié', 'Suspendu']).withMessage('Statut invalide')
];

// GET /api/contrats/test - Route de test sans authentification
router.get('/test', async (req, res) => {
  try {
    console.log('Test route contrats appelée');
    const contrats = await Contrat.findAll({
      limit: 5,
      order: [['date_creation', 'DESC']]
    });
    console.log('Contrats trouvés:', contrats.length);
    res.json({ success: true, data: contrats, message: 'Test réussi' });
  } catch (error) {
    console.error('Erreur test contrats:', error);
    res.status(500).json({ success: false, message: 'Erreur test: ' + error.message });
  }
});

// GET /api/contrats - Récupérer tous les contrats
router.get('/', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    console.log('Route contrats appelée par utilisateur:', req.user?.id);
    const { page = 1, limit = 10, employe_id, type_contrat, statut } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (employe_id) where.employe_id = employe_id;
    if (type_contrat) where.type_contrat = type_contrat;
    if (statut) where.statut = statut;

    console.log('Where clause:', where);

    // D'abord, récupérer le nombre total
    console.log('Récupération du nombre total...');
    const total = await Contrat.count({ where });
    console.log('Total trouvé:', total);
    
    // Ensuite, récupérer les contrats avec les relations
    console.log('Récupération des contrats...');
    const contrats = await Contrat.findAll({
      where,
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'prenoms', 'nom_famille', 'email', 'role', 'poste']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_creation', 'DESC']]
    });

    console.log('Contrats récupérés:', contrats.length);
    console.log('Envoi de la réponse...');

    res.json({
      success: true,
      data: contrats,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contrats:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/contrats/:id - Récupérer un contrat par ID
router.get('/:id', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const contrat = await Contrat.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role', 'telephone']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    if (!contrat) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    res.json({ success: true, data: contrat });
  } catch (error) {
    console.error('Erreur lors de la récupération du contrat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/contrats - Créer un nouveau contrat
router.post('/', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), validateContrat, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Vérifier que l'employé existe
    const employe = await User.findByPk(req.body.employe_id);
    if (!employe) {
      return res.status(400).json({ success: false, message: 'Employé non trouvé' });
    }

    // Vérifier l'unicité du numéro de contrat
    const existingContrat = await Contrat.findOne({ where: { numero_contrat: req.body.numero_contrat } });
    if (existingContrat) {
      return res.status(400).json({ success: false, message: 'Ce numéro de contrat existe déjà' });
    }

    const contrat = await Contrat.create({
      ...req.body,
      cree_par: req.user.id,
      date_creation: new Date(),
      date_modification: new Date()
    });

    // Récupérer le contrat avec les relations
    const contratAvecRelations = await Contrat.findByPk(contrat.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'prenoms', 'nom_famille', 'email', 'role', 'poste']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    res.status(201).json({ success: true, data: contratAvecRelations });
  } catch (error) {
    console.error('Erreur lors de la création du contrat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/contrats/:id - Mettre à jour un contrat
router.put('/:id', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), validateContrat, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const contrat = await Contrat.findByPk(req.params.id);
    if (!contrat) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    // Vérifier l'unicité du numéro de contrat (sauf pour le contrat actuel)
    if (req.body.numero_contrat && req.body.numero_contrat !== contrat.numero_contrat) {
      const existingContrat = await Contrat.findOne({ 
        where: { 
          numero_contrat: req.body.numero_contrat,
          id: { [require('sequelize').Op.ne]: req.params.id }
        } 
      });
      if (existingContrat) {
        return res.status(400).json({ success: false, message: 'Ce numéro de contrat existe déjà' });
      }
    }

    await contrat.update({
      ...req.body,
      date_modification: new Date()
    });

    // Récupérer le contrat mis à jour avec les relations
    const contratMisAJour = await Contrat.findByPk(contrat.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    res.json({ success: true, data: contratMisAJour });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contrat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/contrats/:id - Supprimer un contrat
router.delete('/:id', requireRole(['Administrateur', 'Patron']), async (req, res) => {
  try {
    const contrat = await Contrat.findByPk(req.params.id);
    if (!contrat) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    await contrat.destroy();
    res.json({ success: true, message: 'Contrat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du contrat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/contrats/employe/:employe_id - Récupérer les contrats d'un employé
router.get('/employe/:employe_id', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const contrats = await Contrat.findAll({
      where: { employe_id: req.params.employe_id },
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ],
      order: [['date_creation', 'DESC']]
    });

    res.json({ success: true, data: contrats });
  } catch (error) {
    console.error('Erreur lors de la récupération des contrats de l\'employé:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;