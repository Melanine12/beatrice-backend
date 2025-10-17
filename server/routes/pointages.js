const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Pointage, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// GET /api/pointages - Récupérer les pointages avec filtres
router.get('/', [
  query('employe_id').optional().isInt({ min: 1 }),
  query('date_debut').optional().isDate(),
  query('date_fin').optional().isDate(),
  query('present').optional().isBoolean(),
  query('type_pointage').optional().isIn(['Manuel', 'Automatique', 'Correction']),
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
      date_debut, 
      date_fin, 
      present, 
      type_pointage,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construire la clause WHERE
    const whereClause = {};
    if (employe_id) whereClause.employe_id = parseInt(employe_id);
    if (present !== undefined) whereClause.present = present === 'true';
    if (type_pointage) whereClause.type_pointage = type_pointage;
    
    if (date_debut || date_fin) {
      whereClause.date_pointage = {};
      if (date_debut) whereClause.date_pointage[Op.gte] = date_debut;
      if (date_fin) whereClause.date_pointage[Op.lte] = date_fin;
    }

    const { count, rows: pointages } = await Pointage.findAndCountAll({
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
      order: [['date_pointage', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: pointages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pointages:', error);
    res.status(500).json({
      error: 'Failed to fetch pointages',
      message: 'Erreur lors de la récupération des pointages'
    });
  }
});

// GET /api/pointages/mois/:year/:month - Récupérer les pointages d'un mois
router.get('/mois/:year/:month', [
  param('year').isInt({ min: 2020, max: 2030 }),
  param('month').isInt({ min: 1, max: 12 }),
  query('employe_id').optional().isInt({ min: 1 })
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

    const { year, month } = req.params;
    const { employe_id } = req.query;

    const pointages = await Pointage.getPointagesByMonth(
      parseInt(year), 
      parseInt(month), 
      employe_id ? parseInt(employe_id) : null
    );

    res.json({
      success: true,
      data: pointages,
      mois: {
        annee: parseInt(year),
        mois: parseInt(month),
        nom: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'long' })
      }
    });

  } catch (error) {
    console.error('Error fetching monthly pointages:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly pointages',
      message: 'Erreur lors de la récupération des pointages du mois'
    });
  }
});

// GET /api/pointages/stats/:year/:month - Récupérer les statistiques d'un mois
router.get('/stats/:year/:month', [
  param('year').isInt({ min: 2020, max: 2030 }),
  param('month').isInt({ min: 1, max: 12 }),
  query('employe_id').optional().isInt({ min: 1 })
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

    const { year, month } = req.params;
    const { employe_id } = req.query;

    const stats = await Pointage.getStatsByMonth(
      parseInt(year), 
      parseInt(month), 
      employe_id ? parseInt(employe_id) : null
    );

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching pointage stats:', error);
    res.status(500).json({
      error: 'Failed to fetch pointage stats',
      message: 'Erreur lors de la récupération des statistiques de pointage'
    });
  }
});

// POST /api/pointages - Créer ou mettre à jour un pointage
router.post('/', [
  requireRole(['Administrateur', 'Superviseur RH', 'Superviseur']),
  body('employe_id').isInt({ min: 1 }).withMessage('ID employé requis'),
  body('date_pointage').isDate().withMessage('Date de pointage invalide'),
  body('present').isBoolean().withMessage('Statut de présence requis'),
  body('heure_arrivee').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format d\'heure invalide (HH:MM)'),
  body('heure_depart').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format d\'heure invalide (HH:MM)'),
  body('commentaires').optional().isLength({ max: 1000 }).withMessage('Commentaires trop longs'),
  body('type_pointage').optional().isIn(['Manuel', 'Automatique', 'Correction'])
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

    const pointageData = req.body;
    
    // Vérifier que l'employé existe
    const employe = await User.findByPk(pointageData.employe_id);
    if (!employe) {
      return res.status(404).json({ 
        error: 'Employee not found',
        message: 'Employé non trouvé'
      });
    }

    // Vérifier s'il existe déjà un pointage pour cette date
    const existingPointage = await Pointage.findOne({
      where: {
        employe_id: pointageData.employe_id,
        date_pointage: pointageData.date_pointage
      }
    });

    let pointage;
    if (existingPointage) {
      // Mettre à jour le pointage existant
      await existingPointage.update({
        ...pointageData,
        updated_by: req.user.id
      }, { user: req.user });
      
      pointage = await Pointage.findByPk(existingPointage.id, {
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
        ]
      });
    } else {
      // Créer un nouveau pointage
      pointage = await Pointage.create({
        ...pointageData,
        created_by: req.user.id
      }, { user: req.user });

      // Récupérer le pointage avec les relations
      pointage = await Pointage.findByPk(pointage.id, {
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
        ]
      });
    }

    res.status(201).json({
      success: true,
      data: pointage,
      message: existingPointage ? 'Pointage mis à jour avec succès' : 'Pointage créé avec succès'
    });

  } catch (error) {
    console.error('Error creating/updating pointage:', error);
    res.status(500).json({
      error: 'Failed to create/update pointage',
      message: 'Erreur lors de la création/mise à jour du pointage'
    });
  }
});

// PUT /api/pointages/:id - Mettre à jour un pointage
router.put('/:id', [
  requireRole(['Administrateur', 'Superviseur RH', 'Superviseur']),
  param('id').isInt({ min: 1 }),
  body('present').optional().isBoolean(),
  body('heure_arrivee').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('heure_depart').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('commentaires').optional().isLength({ max: 1000 }),
  body('type_pointage').optional().isIn(['Manuel', 'Automatique', 'Correction'])
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

    const pointage = await Pointage.findByPk(id);
    if (!pointage) {
      return res.status(404).json({ 
        error: 'Pointage not found',
        message: 'Pointage non trouvé'
      });
    }

    await pointage.update({
      ...updateData,
      updated_by: req.user.id
    }, { user: req.user });

    // Récupérer le pointage mis à jour avec les relations
    const updatedPointage = await Pointage.findByPk(id, {
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
      ]
    });

    res.json({
      success: true,
      data: updatedPointage,
      message: 'Pointage mis à jour avec succès'
    });

  } catch (error) {
    console.error('Error updating pointage:', error);
    res.status(500).json({
      error: 'Failed to update pointage',
      message: 'Erreur lors de la mise à jour du pointage'
    });
  }
});

// DELETE /api/pointages/:id - Supprimer un pointage
router.delete('/:id', [
  requireRole(['Administrateur', 'Superviseur RH']),
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

    const pointage = await Pointage.findByPk(id);
    if (!pointage) {
      return res.status(404).json({ 
        error: 'Pointage not found',
        message: 'Pointage non trouvé'
      });
    }

    await pointage.destroy();

    res.json({
      success: true,
      message: 'Pointage supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting pointage:', error);
    res.status(500).json({
      error: 'Failed to delete pointage',
      message: 'Erreur lors de la suppression du pointage'
    });
  }
});

// POST /api/pointages/valider/:id - Valider un pointage
router.post('/valider/:id', [
  requireRole(['Administrateur', 'Superviseur RH']),
  param('id').isInt({ min: 1 }),
  body('commentaires_validation').optional().isLength({ max: 1000 })
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
    const { commentaires_validation } = req.body;

    const pointage = await Pointage.findByPk(id);
    if (!pointage) {
      return res.status(404).json({ 
        error: 'Pointage not found',
        message: 'Pointage non trouvé'
      });
    }

    await pointage.update({
      valide_par: req.user.id,
      date_validation: new Date(),
      commentaires: commentaires_validation || pointage.commentaires,
      updated_by: req.user.id
    }, { user: req.user });

    // Récupérer le pointage validé avec les relations
    const validatedPointage = await Pointage.findByPk(id, {
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
      ]
    });

    res.json({
      success: true,
      data: validatedPointage,
      message: 'Pointage validé avec succès'
    });

  } catch (error) {
    console.error('Error validating pointage:', error);
    res.status(500).json({
      error: 'Failed to validate pointage',
      message: 'Erreur lors de la validation du pointage'
    });
  }
});

module.exports = router;
