const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { CheckLinge, User, Chambre, Inventaire } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Validation rules
const checkLingeValidation = [
  body('date_check').isISO8601().withMessage('Date de check invalide'),
  body('agent_id').isInt({ min: 1 }).withMessage('ID agent invalide'),
  body('nom_agent').notEmpty().withMessage('Nom agent requis'),
  body('chambre_id').isInt({ min: 1 }).withMessage('ID chambre invalide'),
  body('numero_chambre').notEmpty().withMessage('Numéro chambre requis'),
  body('article_id').isInt({ min: 1 }).withMessage('ID article invalide'),
  body('nom_article').notEmpty().withMessage('Nom article requis'),
  body('code_produit').notEmpty().withMessage('Code produit requis'),
  body('categorie').notEmpty().withMessage('Catégorie requise'),
  body('quantite_affectee').isInt({ min: 0 }).withMessage('Quantité affectée invalide'),
  body('quantite_propre').isInt({ min: 0 }).withMessage('Quantité propre invalide'),
  body('quantite_sale').isInt({ min: 0 }).withMessage('Quantité sale invalide'),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
];

const updateCheckLingeValidation = [
  body('quantite_propre').optional().isInt({ min: 0 }).withMessage('Quantité propre invalide'),
  body('quantite_sale').optional().isInt({ min: 0 }).withMessage('Quantité sale invalide'),
  body('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
];

// GET /api/check-linge - Récupérer tous les checks linge avec filtres
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
  query('date_check').optional().isISO8601().withMessage('Date invalide'),
  query('agent_id').optional().isInt({ min: 1 }).withMessage('ID agent invalide'),
  query('chambre_id').optional().isInt({ min: 1 }).withMessage('ID chambre invalide'),
  query('statut').optional().isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide'),
  query('search').optional().isString().withMessage('Recherche invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      date_check,
      agent_id,
      chambre_id,
      statut,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filtres
    if (date_check) where.date_check = date_check;
    if (agent_id) where.agent_id = agent_id;
    if (chambre_id) where.chambre_id = chambre_id;
    if (statut) where.statut = statut;

    // Recherche
    if (search) {
      where[Op.or] = [
        { nom_agent: { [Op.like]: `%${search}%` } },
        { numero_chambre: { [Op.like]: `%${search}%` } },
        { nom_article: { [Op.like]: `%${search}%` } },
        { code_produit: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: checks } = await CheckLinge.findAndCountAll({
      where,
      include: [
        { model: User, as: 'agent', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ],
      order: [['date_check', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: checks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching check linge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des checks linge',
      error: error.message
    });
  }
});

// GET /api/check-linge/:id - Récupérer un check linge par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const check = await CheckLinge.findByPk(id, {
      include: [
        { model: User, as: 'agent', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ]
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'Check linge non trouvé'
      });
    }

    res.json({
      success: true,
      data: check
    });
  } catch (error) {
    console.error('Error fetching check linge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du check linge',
      error: error.message
    });
  }
});

// GET /api/check-linge/chambre/:chambreId - Récupérer les checks linge d'une chambre
router.get('/chambre/:chambreId', authenticateToken, [
  query('date_check').optional().isISO8601().withMessage('Date invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { chambreId } = req.params;
    const { date_check } = req.query;

    const where = { chambre_id: chambreId };
    if (date_check) where.date_check = date_check;

    const checks = await CheckLinge.findAll({
      where,
      include: [
        { model: User, as: 'agent', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ],
      order: [['date_check', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: checks
    });
  } catch (error) {
    console.error('Error fetching check linge by chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des checks linge de la chambre',
      error: error.message
    });
  }
});

// GET /api/check-linge/agent/:agentId - Récupérer les checks linge d'un agent
router.get('/agent/:agentId', authenticateToken, [
  query('date_check').optional().isISO8601().withMessage('Date invalide'),
  query('start_date').optional().isISO8601().withMessage('Date de début invalide'),
  query('end_date').optional().isISO8601().withMessage('Date de fin invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { agentId } = req.params;
    const { date_check, start_date, end_date } = req.query;

    const where = { agent_id: agentId };
    if (date_check) {
      where.date_check = date_check;
    } else if (start_date && end_date) {
      where.date_check = {
        [Op.between]: [start_date, end_date]
      };
    }

    const checks = await CheckLinge.findAll({
      where,
      include: [
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ],
      order: [['date_check', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: checks
    });
  } catch (error) {
    console.error('Error fetching check linge by agent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des checks linge de l\'agent',
      error: error.message
    });
  }
});

// GET /api/check-linge/stats/overview - Statistiques générales
router.get('/stats/overview', authenticateToken, [
  query('date_check').optional().isISO8601().withMessage('Date invalide'),
  query('start_date').optional().isISO8601().withMessage('Date de début invalide'),
  query('end_date').optional().isISO8601().withMessage('Date de fin invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { date_check, start_date, end_date } = req.query;

    let stats;
    if (date_check) {
      stats = await CheckLinge.getStatsByDate(date_check);
    } else if (start_date && end_date) {
      // Pour une période, on fait une requête personnalisée
      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');
      
      const result = await sequelize.query(`
        SELECT 
          COUNT(*) as total_checks,
          SUM(quantite_affectee) as total_quantite_affectee,
          SUM(quantite_propre) as total_quantite_propre,
          SUM(quantite_sale) as total_quantite_sale,
          SUM(quantite_totale) as total_quantite_totale,
          SUM(quantite_manquante) as total_quantite_manquante,
          COUNT(CASE WHEN statut = 'Terminé' THEN 1 END) as checks_termines,
          COUNT(CASE WHEN statut = 'Validé' THEN 1 END) as checks_valides,
          COUNT(CASE WHEN quantite_manquante > 0 THEN 1 END) as checks_avec_manquants
        FROM tbl_check_linge 
        WHERE date_check BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate: start_date, endDate: end_date },
        type: QueryTypes.SELECT
      });
      
      stats = result[0] || {};
    } else {
      // Statistiques générales
      const { QueryTypes } = require('sequelize');
      const { sequelize } = require('../config/database');
      
      const result = await sequelize.query(`
        SELECT 
          COUNT(*) as total_checks,
          SUM(quantite_affectee) as total_quantite_affectee,
          SUM(quantite_propre) as total_quantite_propre,
          SUM(quantite_sale) as total_quantite_sale,
          SUM(quantite_totale) as total_quantite_totale,
          SUM(quantite_manquante) as total_quantite_manquants,
          COUNT(CASE WHEN statut = 'Terminé' THEN 1 END) as checks_termines,
          COUNT(CASE WHEN statut = 'Validé' THEN 1 END) as checks_valides,
          COUNT(CASE WHEN quantite_manquante > 0 THEN 1 END) as checks_avec_manquants
        FROM tbl_check_linge
      `, {
        type: QueryTypes.SELECT
      });
      
      stats = result[0] || {};
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching check linge stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// GET /api/check-linge/stats/agent/:agentId - Statistiques par agent
router.get('/stats/agent/:agentId', authenticateToken, [
  query('start_date').isISO8601().withMessage('Date de début requise'),
  query('end_date').isISO8601().withMessage('Date de fin requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { agentId } = req.params;
    const { start_date, end_date } = req.query;

    const stats = await CheckLinge.getStatsByAgent(agentId, start_date, end_date);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching check linge agent stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de l\'agent',
      error: error.message
    });
  }
});

// GET /api/check-linge/stats/chambre/:chambreId - Statistiques par chambre
router.get('/stats/chambre/:chambreId', authenticateToken, [
  query('start_date').isISO8601().withMessage('Date de début requise'),
  query('end_date').isISO8601().withMessage('Date de fin requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { chambreId } = req.params;
    const { start_date, end_date } = req.query;

    const stats = await CheckLinge.getStatsByChambre(chambreId, start_date, end_date);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching check linge chambre stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de la chambre',
      error: error.message
    });
  }
});

// POST /api/check-linge - Créer un nouveau check linge
router.post('/', authenticateToken, checkLingeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const checkData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    // Vérifier que la quantité totale ne dépasse pas la quantité affectée
    const quantiteTotale = checkData.quantite_propre + checkData.quantite_sale;
    if (quantiteTotale > checkData.quantite_affectee) {
      return res.status(400).json({
        success: false,
        message: 'La quantité totale ne peut pas dépasser la quantité affectée'
      });
    }

    const check = await CheckLinge.create(checkData);

    // Récupérer le check avec les associations
    const checkWithAssociations = await CheckLinge.findByPk(check.id, {
      include: [
        { model: User, as: 'agent', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Check linge créé avec succès',
      data: checkWithAssociations
    });
  } catch (error) {
    console.error('Error creating check linge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du check linge',
      error: error.message
    });
  }
});

// PUT /api/check-linge/:id - Mettre à jour un check linge
router.put('/:id', authenticateToken, updateCheckLingeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    // Vérifier que la quantité totale ne dépasse pas la quantité affectée
    if (updateData.quantite_propre !== undefined || updateData.quantite_sale !== undefined) {
      const check = await CheckLinge.findByPk(id);
      if (!check) {
        return res.status(404).json({
          success: false,
          message: 'Check linge non trouvé'
        });
      }

      const quantitePropre = updateData.quantite_propre !== undefined ? updateData.quantite_propre : check.quantite_propre;
      const quantiteSale = updateData.quantite_sale !== undefined ? updateData.quantite_sale : check.quantite_sale;
      const quantiteTotale = quantitePropre + quantiteSale;

      if (quantiteTotale > check.quantite_affectee) {
        return res.status(400).json({
          success: false,
          message: 'La quantité totale ne peut pas dépasser la quantité affectée'
        });
      }
    }

    const [updatedRowsCount] = await CheckLinge.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Check linge non trouvé'
      });
    }

    // Récupérer le check mis à jour avec les associations
    const updatedCheck = await CheckLinge.findByPk(id, {
      include: [
        { model: User, as: 'agent', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Inventaire, as: 'article', attributes: ['id', 'nom', 'code_produit', 'categorie'] }
      ]
    });

    res.json({
      success: true,
      message: 'Check linge mis à jour avec succès',
      data: updatedCheck
    });
  } catch (error) {
    console.error('Error updating check linge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du check linge',
      error: error.message
    });
  }
});

// PATCH /api/check-linge/:id/status - Mettre à jour le statut
router.patch('/:id/status', authenticateToken, [
  body('statut').isIn(['En cours', 'Terminé', 'Validé', 'Rejeté']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { statut } = req.body;

    const [updatedRowsCount] = await CheckLinge.update(
      { statut, updated_by: req.user.id },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Check linge non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating check linge status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

// PUT /api/check-linge/chambre/:chambreId/article/:articleId - Mettre à jour un article spécifique
router.put('/chambre/:chambreId/article/:articleId', authenticateToken, [
  body('quantite_verifiee').optional().isInt({ min: 0 }).withMessage('Quantité vérifiée invalide'),
  body('etat').optional().isIn(['Bon', 'Usé', 'Abîmé', 'Manquant']).withMessage('État invalide'),
  body('observations').optional().isString().withMessage('Observations invalides')
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

    const { chambreId, articleId } = req.params;
    const { quantite_verifiee, etat, observations } = req.body;

    // Vérifier que la chambre existe
    const chambre = await Chambre.findByPk(chambreId);
    if (!chambre) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Vérifier que l'article existe
    const article = await Inventaire.findByPk(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Trouver le check linge le plus récent pour cette chambre
    const checkLinge = await CheckLinge.findOne({
      where: { chambre_id: chambreId },
      order: [['date_check', 'DESC']]
    });

    if (!checkLinge) {
      return res.status(404).json({
        success: false,
        message: 'Aucun check linge trouvé pour cette chambre'
      });
    }

    // Mettre à jour les détails de l'article dans le check linge
    const articles = checkLinge.articles || [];
    const articleIndex = articles.findIndex(item => item.article_id === parseInt(articleId));
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé dans ce check linge'
      });
    }

    // Mettre à jour les données de l'article
    if (quantite_verifiee !== undefined) {
      articles[articleIndex].quantite_verifiee = quantite_verifiee;
    }
    if (etat !== undefined) {
      articles[articleIndex].etat = etat;
    }
    if (observations !== undefined) {
      articles[articleIndex].observations = observations;
    }

    // Sauvegarder les modifications
    await checkLinge.update({
      articles: articles,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: {
        check_linge_id: checkLinge.id,
        article_id: articleId,
        quantite_verifiee: articles[articleIndex].quantite_verifiee,
        etat: articles[articleIndex].etat,
        observations: articles[articleIndex].observations
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de l\'article',
      error: error.message
    });
  }
});

// DELETE /api/check-linge/:id - Supprimer un check linge
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRowsCount = await CheckLinge.destroy({
      where: { id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Check linge non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Check linge supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting check linge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du check linge',
      error: error.message
    });
  }
});

module.exports = router;
