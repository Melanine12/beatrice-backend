const express = require('express');
const router = express.Router();
const { DocumentRH, Contrat, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const { body, validationResult } = require('express-validator');

// Apply authentication to all routes
router.use(authenticateToken);

// Middleware de validation
const validateDocument = [
  body('employe_id').isInt({ min: 1 }).withMessage('ID employé requis'),
  body('type_document').isIn([
    'Contrat', 'Avenant', 'Attestation_travail', 'Bulletin_salaire',
    'Certificat_medical', 'Justificatif_absence', 'Demande_conge',
    'Evaluation_performance', 'Formation', 'Autre'
  ]).withMessage('Type de document invalide'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description trop longue'),
  body('date_emission').optional().isISO8601().withMessage('Date d\'émission invalide'),
  body('date_expiration').optional().isISO8601().withMessage('Date d\'expiration invalide'),
  body('confidentialite').optional().isIn(['Public', 'Interne', 'Confidentiel', 'Secret']).withMessage('Niveau de confidentialité invalide')
];

// GET /api/documents-rh - Récupérer tous les documents
router.get('/', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const { page = 1, limit = 10, employe_id, type_document, statut, confidentialite } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (employe_id) where.employe_id = employe_id;
    if (type_document) where.type_document = type_document;
    if (statut) where.statut = statut;
    if (confidentialite) where.confidentialite = confidentialite;

    // D'abord, récupérer le nombre total
    const total = await DocumentRH.count({ where });
    
    // Ensuite, récupérer les documents avec les relations
    const documents = await DocumentRH.findAll({
      where,
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
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

    res.json({
      success: true,
      data: documents,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/:id - Récupérer un document par ID
router.get('/:id', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const document = await DocumentRH.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role', 'telephone']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/documents-rh - Créer un nouveau document avec upload de fichier
router.post('/', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), upload.single('fichier'), validateDocument, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fichier requis' });
    }

    // Vérifier que l'employé existe
    const employe = await User.findByPk(req.body.employe_id);
    if (!employe) {
      return res.status(400).json({ success: false, message: 'Employé non trouvé' });
    }

    // Vérifier que le contrat existe si fourni
    if (req.body.contrat_id) {
      const contrat = await Contrat.findByPk(req.body.contrat_id);
      if (!contrat) {
        return res.status(400).json({ success: false, message: 'Contrat non trouvé' });
      }
    }

    // Vérifier que le fichier a été uploadé sur Cloudinary
    if (!req.file.url || !req.file.public_id) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'upload sur Cloudinary. URL ou public_id manquant.' 
      });
    }
    
    console.log('Fichier uploadé sur Cloudinary:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: req.file.url,
      public_id: req.file.public_id,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const document = await DocumentRH.create({
      employe_id: req.body.employe_id,
      contrat_id: req.body.contrat_id || null,
      type_document: req.body.type_document,
      nom_fichier: req.file.filename || req.file.public_id.split('/').pop(),
      nom_fichier_original: req.file.originalname,
      chemin_fichier: req.file.url,
      url_cloudinary: req.file.url,
      public_id_cloudinary: req.file.public_id,
      taille_fichier: req.file.size || 0,
      type_mime: req.file.mimetype,
      description: req.body.description || null,
      date_emission: req.body.date_emission || null,
      date_expiration: req.body.date_expiration || null,
      confidentialite: req.body.confidentialite || 'Interne',
      cree_par: req.user.id
    });

    // Récupérer le document avec les relations
    const documentAvecRelations = await DocumentRH.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    res.status(201).json({ success: true, data: documentAvecRelations });
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/documents-rh/:id - Mettre à jour un document
router.put('/:id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), validateDocument, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const document = await DocumentRH.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    // Vérifier que le contrat existe si fourni
    if (req.body.contrat_id) {
      const contrat = await Contrat.findByPk(req.body.contrat_id);
      if (!contrat) {
        return res.status(400).json({ success: false, message: 'Contrat non trouvé' });
      }
    }

    await document.update({
      contrat_id: req.body.contrat_id || document.contrat_id,
      type_document: req.body.type_document,
      description: req.body.description || document.description,
      date_emission: req.body.date_emission || document.date_emission,
      date_expiration: req.body.date_expiration || document.date_expiration,
      statut: req.body.statut || document.statut,
      confidentialite: req.body.confidentialite || document.confidentialite,
      date_modification: new Date()
    });

    // Récupérer le document mis à jour avec les relations
    const documentMisAJour = await DocumentRH.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    res.json({ success: true, data: documentMisAJour });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/documents-rh/:id - Supprimer un document
router.delete('/:id', requireRole(['Administrateur', 'Patron']), async (req, res) => {
  try {
    const document = await DocumentRH.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    // Supprimer le fichier de Cloudinary
    try {
      await cloudinary.uploader.destroy(document.public_id_cloudinary);
    } catch (cloudinaryError) {
      console.error('Erreur lors de la suppression du fichier Cloudinary:', cloudinaryError);
      // Continuer même si la suppression Cloudinary échoue
    }

    await document.destroy();
    res.json({ success: true, message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/employe/:employe_id - Récupérer les documents d'un employé
router.get('/employe/:employe_id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const documents = await DocumentRH.findAll({
      where: { employe_id: req.params.employe_id },
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ],
      order: [['date_creation', 'DESC']]
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents de l\'employé:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/contrat/:contrat_id - Récupérer les documents d'un contrat
router.get('/contrat/:contrat_id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const documents = await DocumentRH.findAll({
      where: { contrat_id: req.params.contrat_id },
      include: [
        {
          model: User,
          as: 'employe',
          attributes: ['id', 'prenom', 'nom', 'email', 'role']
        },
        {
          model: Contrat,
          as: 'contrat',
          attributes: ['id', 'numero_contrat', 'type_contrat', 'date_debut', 'date_fin']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ],
      order: [['date_creation', 'DESC']]
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents du contrat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/:id/download - Télécharger un document
router.get('/:id/download', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const document = await DocumentRH.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    res.json({ 
      success: true, 
      data: {
        url: document.url_cloudinary,
        nom_fichier: document.nom_fichier_original,
        type_mime: document.type_mime
      }
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement du document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
