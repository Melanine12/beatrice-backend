const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Demande = require('../models/Demande');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configuration multer pour upload de pièces justificatives
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/demandes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'piece-justificative-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

// Application de l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/demandes - Récupérer toutes les demandes avec filtres
router.get('/', [
  query('statut').optional().isIn(['en_attente', 'approuvee', 'rejetee', 'annulee']),
  query('priorite').optional().isIn(['basse', 'normale', 'haute', 'urgente']),
  query('categorie').optional().isString(),
  query('guichetier_id').optional().isInt(),
  query('superviseur_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString()
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
      priorite, 
      categorie, 
      guichetier_id, 
      superviseur_id, 
      page = 1, 
      limit = 20, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construction de la clause WHERE
    const whereClause = {};
    if (statut) whereClause.statut = statut;
    if (priorite) whereClause.priorite = priorite;
    if (categorie) whereClause.categorie = categorie;
    if (guichetier_id) whereClause.guichetier_id = guichetier_id;
    if (superviseur_id) whereClause.superviseur_id = superviseur_id;

    // Recherche textuelle
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { motif: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
        { categorie: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    // Filtrage par rôle utilisateur
    if (req.user.role === 'Guichetier') {
      whereClause.guichetier_id = req.user.id;
    }

    const { count, rows: demandes } = await Demande.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ],
      order: [
        ['priorite', 'ASC'],
        ['date_demande', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: demandes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des demandes',
      message: error.message 
    });
  }
});

// GET /api/demandes/en-attente - Récupérer les demandes en attente (pour superviseurs)
router.get('/en-attente', requireRole(['Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const demandes = await Demande.getDemandesEnAttente();
    
    res.json({
      success: true,
      data: demandes,
      count: demandes.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes en attente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des demandes en attente',
      message: error.message 
    });
  }
});

// GET /api/demandes/guichetier/:id - Récupérer les demandes d'un guichetier spécifique
router.get('/guichetier/:id', async (req, res) => {
  try {
    const guichetierId = parseInt(req.params.id);
    
    // Vérification des permissions
    if (req.user.role === 'Guichetier' && req.user.id !== guichetierId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé' 
      });
    }

    const demandes = await Demande.getDemandesParGuichetier(guichetierId);
    
    res.json({
      success: true,
      data: demandes,
      count: demandes.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes du guichetier:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des demandes du guichetier',
      message: error.message 
    });
  }
});

// GET /api/demandes/:id - Récupérer une demande spécifique
router.get('/:id', async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    
    const demande = await Demande.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    // Vérification des permissions
    if (req.user.role === 'Guichetier' && demande.guichetier_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé' 
      });
    }

    res.json({
      success: true,
      data: demande
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération de la demande',
      message: error.message 
    });
  }
});

// POST /api/demandes - Créer une nouvelle demande
router.post('/', [
  body('motif').notEmpty().withMessage('Le motif est requis'),
  body('montant').isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),
  body('description').optional().isString(),
  body('priorite').optional().isIn(['basse', 'normale', 'haute', 'urgente']),
  body('categorie').optional().isString(),
  upload.single('piece_justificative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    // Vérification du rôle
    if (req.user.role !== 'Guichetier') {
      return res.status(403).json({ 
        success: false, 
        error: 'Seuls les guichetiers peuvent créer des demandes' 
      });
    }

    const demandeData = {
      motif: req.body.motif,
      description: req.body.description || '',
      montant: parseFloat(req.body.montant),
      priorite: req.body.priorite || 'normale',
      categorie: req.body.categorie || '',
      guichetier_id: req.user.id,
      piece_justificative: req.file ? req.file.path : null
    };

    const nouvelleDemande = await Demande.create(demandeData);

    // Récupérer la demande avec les relations
    const demandeComplete = await Demande.findByPk(nouvelleDemande.id, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Demande créée avec succès',
      data: demandeComplete
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la création de la demande',
      message: error.message 
    });
  }
});

// PUT /api/demandes/:id - Modifier une demande
router.put('/:id', [
  body('motif').optional().notEmpty().withMessage('Le motif ne peut pas être vide'),
  body('montant').optional().isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),
  body('description').optional().isString(),
  body('priorite').optional().isIn(['basse', 'normale', 'haute', 'urgente']),
  body('categorie').optional().isString(),
  upload.single('piece_justificative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const demandeId = parseInt(req.params.id);
    const demande = await Demande.findByPk(demandeId);

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    // Vérification des permissions
    if (req.user.role === 'Guichetier' && demande.guichetier_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé' 
      });
    }

    // Vérification que la demande peut être modifiée
    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        error: 'Seules les demandes en attente peuvent être modifiées' 
      });
    }

    const updateData = {};
    if (req.body.motif) updateData.motif = req.body.motif;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.montant) updateData.montant = parseFloat(req.body.montant);
    if (req.body.priorite) updateData.priorite = req.body.priorite;
    if (req.body.categorie !== undefined) updateData.categorie = req.body.categorie;
    if (req.file) updateData.piece_justificative = req.file.path;

    await demande.update(updateData);

    // Récupérer la demande mise à jour avec les relations
    const demandeMiseAJour = await Demande.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Demande modifiée avec succès',
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error('Erreur lors de la modification de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la modification de la demande',
      message: error.message 
    });
  }
});

// POST /api/demandes/:id/approuver - Approuver une demande
router.post('/:id/approuver', [
  body('commentaire_superviseur').optional().isString(),
  requireRole(['Superviseur', 'Administrateur', 'Patron'])
], async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    const demande = await Demande.findByPk(demandeId);

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        error: 'Seules les demandes en attente peuvent être approuvées' 
      });
    }

    await demande.approuver(req.user.id, req.body.commentaire_superviseur || '');

    // Récupérer la demande mise à jour avec les relations
    const demandeMiseAJour = await Demande.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Demande approuvée avec succès',
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error('Erreur lors de l\'approbation de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'approbation de la demande',
      message: error.message 
    });
  }
});

// POST /api/demandes/:id/rejeter - Rejeter une demande
router.post('/:id/rejeter', [
  body('commentaire_superviseur').notEmpty().withMessage('Un commentaire est requis pour rejeter une demande'),
  requireRole(['Superviseur', 'Administrateur', 'Patron'])
], async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    const demande = await Demande.findByPk(demandeId);

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        error: 'Seules les demandes en attente peuvent être rejetées' 
      });
    }

    await demande.rejeter(req.user.id, req.body.commentaire_superviseur);

    // Récupérer la demande mise à jour avec les relations
    const demandeMiseAJour = await Demande.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Demande rejetée avec succès',
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error('Erreur lors du rejet de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du rejet de la demande',
      message: error.message 
    });
  }
});

// POST /api/demandes/:id/annuler - Annuler une demande
router.post('/:id/annuler', async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    const demande = await Demande.findByPk(demandeId);

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    // Vérification des permissions
    if (req.user.role === 'Guichetier' && demande.guichetier_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé' 
      });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        error: 'Seules les demandes en attente peuvent être annulées' 
      });
    }

    await demande.annuler();

    // Récupérer la demande mise à jour avec les relations
    const demandeMiseAJour = await Demande.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'guichetier',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Demande annulée avec succès',
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'annulation de la demande',
      message: error.message 
    });
  }
});

// DELETE /api/demandes/:id - Supprimer une demande
router.delete('/:id', async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    const demande = await Demande.findByPk(demandeId);

    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }

    // Vérification des permissions
    if (req.user.role === 'Guichetier' && demande.guichetier_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé' 
      });
    }

    // Vérification que la demande peut être supprimée
    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        error: 'Seules les demandes en attente peuvent être supprimées' 
      });
    }

    // Supprimer le fichier de pièce justificative s'il existe
    if (demande.piece_justificative && fs.existsSync(demande.piece_justificative)) {
      fs.unlinkSync(demande.piece_justificative);
    }

    await demande.destroy();

    res.json({
      success: true,
      message: 'Demande supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la demande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la suppression de la demande',
      message: error.message 
    });
  }
});

module.exports = router;
