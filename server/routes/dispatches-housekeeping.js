const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const DispatchHousekeeping = require('../models/DispatchHousekeeping');
const DispatchHousekeepingArticle = require('../models/DispatchHousekeepingArticle');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const Inventaire = require('../models/Inventaire');
const { sequelize } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/dispatches-housekeeping - List all dispatches with filters
router.get('/', [
  query('agent_id').optional().isInt({ min: 1 }),
  query('statut').optional().isIn(['en_attente', 'en_cours', 'complete', 'annule']),
  query('date_debut').optional().isISO8601().toDate(),
  query('date_fin').optional().isISO8601().toDate(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Erreur de validation',
        errors: errors.array() 
      });
    }

    const { agent_id, statut, date_debut, date_fin, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (agent_id) where.agent_id = parseInt(agent_id);
    if (statut) where.statut = statut;
    
    if (date_debut || date_fin) {
      where.created_at = {};
      if (date_debut) where.created_at[Op.gte] = new Date(date_debut);
      if (date_fin) where.created_at[Op.lte] = new Date(date_fin);
    }

    const include = [
      {
        model: User,
        as: 'agent',
        attributes: ['id', 'prenom', 'nom', 'email', 'role']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'prenom', 'nom', 'email']
      },
      {
        model: Chambre,
        as: 'chambre',
        attributes: ['id', 'numero', 'type'],
        required: false
      },
      {
        model: DispatchHousekeepingArticle,
        as: 'articles',
        include: [
          {
            model: Inventaire,
            as: 'inventaire',
            attributes: ['id', 'nom', 'code_produit', 'unite', 'categorie']
          }
        ]
      }
    ];

    const { count, rows } = await DispatchHousekeeping.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      dispatches: rows,
      data: rows, // Pour compatibilité avec le frontend
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error listing dispatches:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des dispatches' });
  }
});

// GET /api/dispatches-housekeeping/:id - Get a single dispatch by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dispatch = await DispatchHousekeeping.findByPk(id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type'],
          required: false
        },
        {
          model: DispatchHousekeepingArticle,
          as: 'articles',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit', 'unite', 'categorie']
            }
          ]
        }
      ]
    });

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch non trouvé' });
    }

    res.json({ success: true, dispatch, data: dispatch });
  } catch (error) {
    console.error('Error fetching dispatch:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement du dispatch' });
  }
});

// POST /api/dispatches-housekeeping - Create a new dispatch
router.post('/', [
  body('agent_id').isInt({ min: 1 }).withMessage('Agent ID est requis'),
  body('chambre_id').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(parseInt(value)) && parseInt(value) > 0;
  }).withMessage('Chambre ID invalide'),
  body('statut').optional().isIn(['en_attente', 'en_cours', 'complete', 'annule']),
  body('date_prevue').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date prévue doit être au format YYYY-MM-DD'),
  body('notes').optional({ nullable: true }).isString(),
  body('articles').isArray({ min: 1 }).withMessage('Au moins un article est requis'),
  body('articles.*.id').isInt({ min: 1 }).withMessage('ID article invalide'),
  body('articles.*.quantite').isInt({ min: 1 }).withMessage('Quantité doit être au moins 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Erreur de validation',
        errors: errors.array() 
      });
    }

    const { agent_id, chambre_id, statut = 'en_attente', date_prevue, notes, articles } = req.body;
    
    // Convertir date_prevue en format DATE si c'est une chaîne YYYY-MM-DD
    const datePrevueValue = date_prevue ? (typeof date_prevue === 'string' ? date_prevue : date_prevue.toISOString().split('T')[0]) : null;

    // Vérifier que l'agent existe
    const agent = await User.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    }

    // Vérifier que la chambre existe si fournie
    if (chambre_id) {
      const chambre = await Chambre.findByPk(chambre_id);
      if (!chambre) {
        return res.status(404).json({ success: false, message: 'Chambre non trouvée' });
      }
    }

    // Vérifier que tous les articles existent
    const articleIds = articles.map(a => a.id);
    const existingArticles = await Inventaire.findAll({
      where: { id: { [Op.in]: articleIds } }
    });

    if (existingArticles.length !== articleIds.length) {
      return res.status(400).json({ success: false, message: 'Un ou plusieurs articles sont invalides' });
    }

    // Créer le dispatch dans une transaction
    const result = await sequelize.transaction(async (t) => {
      const dispatch = await DispatchHousekeeping.create({
        agent_id,
        chambre_id: chambre_id || null,
        statut,
        date_prevue: datePrevueValue,
        notes: notes || null,
        created_by: req.user.id
      }, { transaction: t });

      // Créer les articles du dispatch
      const dispatchArticles = articles.map(article => ({
        dispatch_id: dispatch.id,
        inventaire_id: article.id,
        quantite: parseInt(article.quantite) || 1
      }));

      await DispatchHousekeepingArticle.bulkCreate(dispatchArticles, { transaction: t });

      // Récupérer le dispatch complet avec les associations
      return await DispatchHousekeeping.findByPk(dispatch.id, {
        include: [
          {
            model: User,
            as: 'agent',
            attributes: ['id', 'prenom', 'nom', 'email', 'role']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'prenom', 'nom', 'email']
          },
          {
            model: Chambre,
            as: 'chambre',
            attributes: ['id', 'numero', 'type'],
            required: false
          },
          {
            model: DispatchHousekeepingArticle,
            as: 'articles',
            include: [
              {
                model: Inventaire,
                as: 'inventaire',
                attributes: ['id', 'nom', 'code_produit', 'unite', 'categorie']
              }
            ]
          }
        ],
        transaction: t
      });
    });

    res.status(201).json({ success: true, dispatch: result, message: 'Dispatch créé avec succès' });
  } catch (error) {
    console.error('Error creating dispatch:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du dispatch', error: error.message });
  }
});

// PUT /api/dispatches-housekeeping/:id - Update a dispatch
router.put('/:id', [
  body('agent_id').optional().isInt({ min: 1 }),
  body('chambre_id').optional().isInt({ min: 1 }),
  body('statut').optional().isIn(['en_attente', 'en_cours', 'complete', 'annule']),
  body('date_prevue').optional().isISO8601(),
  body('notes').optional().isString(),
  body('articles').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Erreur de validation',
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { agent_id, chambre_id, statut, date_prevue, notes, articles } = req.body;

    const dispatch = await DispatchHousekeeping.findByPk(id);
    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch non trouvé' });
    }

    // Vérifier que l'agent existe si fourni
    if (agent_id) {
      const agent = await User.findByPk(agent_id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent non trouvé' });
      }
    }

    // Vérifier que la chambre existe si fournie
    if (chambre_id) {
      const chambre = await Chambre.findByPk(chambre_id);
      if (!chambre) {
        return res.status(404).json({ success: false, message: 'Chambre non trouvée' });
      }
    }

    // Mettre à jour le dispatch dans une transaction
    await sequelize.transaction(async (t) => {
      // Mettre à jour les champs du dispatch
      const updateData = {};
      if (agent_id) updateData.agent_id = agent_id;
      if (chambre_id !== undefined) updateData.chambre_id = chambre_id || null;
      if (statut) updateData.statut = statut;
      if (date_prevue) {
        // Convertir date_prevue en format DATE si c'est une chaîne YYYY-MM-DD
        updateData.date_prevue = typeof date_prevue === 'string' ? date_prevue : date_prevue.toISOString().split('T')[0];
      }
      if (notes !== undefined) updateData.notes = notes || null;

      await dispatch.update(updateData, { transaction: t });

      // Si des articles sont fournis, remplacer tous les articles
      if (articles && Array.isArray(articles)) {
        // Supprimer les anciens articles
        await DispatchHousekeepingArticle.destroy({
          where: { dispatch_id: id },
          transaction: t
        });

        // Vérifier que tous les articles existent
        const articleIds = articles.map(a => a.id);
        const existingArticles = await Inventaire.findAll({
          where: { id: { [Op.in]: articleIds } },
          transaction: t
        });

        if (existingArticles.length !== articleIds.length) {
          throw new Error('Un ou plusieurs articles sont invalides');
        }

        // Créer les nouveaux articles
        const dispatchArticles = articles.map(article => ({
          dispatch_id: id,
          inventaire_id: article.id,
          quantite: parseInt(article.quantite) || 1
        }));

        await DispatchHousekeepingArticle.bulkCreate(dispatchArticles, { transaction: t });
      }
    });

    // Récupérer le dispatch mis à jour
    const updatedDispatch = await DispatchHousekeeping.findByPk(id, {
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: Chambre,
          as: 'chambre',
          attributes: ['id', 'numero', 'type'],
          required: false
        },
        {
          model: DispatchHousekeepingArticle,
          as: 'articles',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit', 'unite', 'categorie']
            }
          ]
        }
      ]
    });

    res.json({ success: true, dispatch: updatedDispatch, message: 'Dispatch mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating dispatch:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du dispatch', error: error.message });
  }
});

// DELETE /api/dispatches-housekeeping/:id - Delete a dispatch
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dispatch = await DispatchHousekeeping.findByPk(id);
    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch non trouvé' });
    }

    // Supprimer le dispatch (les articles seront supprimés en cascade)
    await dispatch.destroy();

    res.json({ success: true, message: 'Dispatch supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting dispatch:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du dispatch' });
  }
});

module.exports = router;
