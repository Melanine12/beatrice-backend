const express = require('express');
const router = express.Router();
const { DocumentRH, Contrat, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const CloudinaryDocumentService = require('../services/cloudinaryDocumentService');
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

    // Log pour debug - voir les noms de fichiers
    console.log('Documents récupérés:', documents.map(doc => ({
      id: doc.id,
      nom_fichier: doc.nom_fichier,
      nom_fichier_original: doc.nom_fichier_original,
      public_id_cloudinary: doc.public_id_cloudinary
    })));

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
    console.log('=== DEBUG UPLOAD DOCUMENT ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('================================');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      console.log('❌ Aucun fichier reçu');
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

    // Utiliser le service Cloudinary pour traiter le document
    console.log('🔄 Traitement du document avec CloudinaryDocumentService...');
    const documentService = new CloudinaryDocumentService();
    const documentData = await documentService.processAndSaveDocument(req.file, req.body.type_document);

    console.log('✅ Document traité avec succès:', documentData);

    const document = await DocumentRH.create({
      employe_id: req.body.employe_id,
      contrat_id: req.body.contrat_id || null,
      type_document: req.body.type_document,
      nom_fichier: documentData.nom_fichier,
      nom_fichier_original: documentData.nom_fichier_original,
      chemin_fichier: documentData.chemin_fichier,
      url_cloudinary: documentData.url_cloudinary,
      public_id_cloudinary: documentData.public_id_cloudinary,
      taille_fichier: documentData.taille_fichier,
      type_mime: documentData.type_mime,
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
router.put('/:id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), upload.single('fichier'), validateDocument, async (req, res) => {
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

    // Préparer les données de mise à jour
    const updateData = {
      contrat_id: req.body.contrat_id || document.contrat_id,
      type_document: req.body.type_document,
      description: req.body.description || document.description,
      date_emission: req.body.date_emission || document.date_emission,
      date_expiration: req.body.date_expiration || document.date_expiration,
      statut: req.body.statut || document.statut,
      confidentialite: req.body.confidentialite || document.confidentialite,
      date_modification: new Date()
    };

    // Si un nouveau fichier est fourni, le traiter
    if (req.file) {
      console.log('🔄 Nouveau fichier fourni, traitement avec CloudinaryDocumentService...');
      const documentService = new CloudinaryDocumentService();
      const documentData = await documentService.processAndSaveDocument(req.file, req.body.type_document);

      // Mettre à jour les données du fichier
      updateData.nom_fichier = documentData.nom_fichier;
      updateData.nom_fichier_original = documentData.nom_fichier_original;
      updateData.chemin_fichier = documentData.chemin_fichier;
      updateData.url_cloudinary = documentData.url_cloudinary;
      updateData.public_id_cloudinary = documentData.public_id_cloudinary;
      updateData.taille_fichier = documentData.taille_fichier;
      updateData.type_mime = documentData.type_mime;
    }

    await document.update(updateData);

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

// GET /api/documents-rh/debug - Route de debug pour voir les noms de fichiers
router.get('/debug', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const documents = await DocumentRH.findAll({
      attributes: ['id', 'nom_fichier', 'nom_fichier_original', 'public_id_cloudinary', 'url_cloudinary', 'type_mime'],
      order: [['date_creation', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: documents,
      message: 'Debug des noms de fichiers'
    });
  } catch (error) {
    console.error('Erreur lors du debug des documents:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/test-url/:id - Tester les URLs générées pour un document
router.get('/test-url/:id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const document = await DocumentRH.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    const CloudinaryDocumentService = require('../services/cloudinaryDocumentService');
    const cloudinaryService = new CloudinaryDocumentService();
    
    const isPdf = document.type_mime === 'application/pdf' || document.nom_fichier.endsWith('.pdf');
    
    const urls = {
      original_url: document.url_cloudinary,
      signed_url: cloudinaryService.generateSignedUrl(document.public_id_cloudinary, isPdf),
      download_url: cloudinaryService.generateDownloadUrl(document.public_id_cloudinary, isPdf),
      is_pdf: isPdf,
      public_id: document.public_id_cloudinary,
      type_mime: document.type_mime
    };

    res.json({
      success: true,
      data: urls,
      message: 'Test des URLs générées'
    });
  } catch (error) {
    console.error('Erreur lors du test des URLs:', error);
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

    // Utiliser le service Cloudinary pour générer l'URL de téléchargement
    const CloudinaryDocumentService = require('../services/cloudinaryDocumentService');
    const cloudinaryService = new CloudinaryDocumentService();
    
    // Déterminer si c'est un PDF
    const isPdf = document.type_mime === 'application/pdf' || document.nom_fichier.endsWith('.pdf');
    
    let downloadUrl = document.url_cloudinary; // URL par défaut
    
    if (isPdf) {
      // Pour les PDFs, essayer d'abord l'URL signée, puis l'URL de téléchargement
      const signedUrl = cloudinaryService.generateSignedUrl(document.public_id_cloudinary, true);
      const downloadUrlPdf = cloudinaryService.generateDownloadUrl(document.public_id_cloudinary, true);
      
      downloadUrl = signedUrl || downloadUrlPdf || document.url_cloudinary;
      
      console.log('📄 PDF - URL signée:', signedUrl);
      console.log('📄 PDF - URL de téléchargement:', downloadUrlPdf);
      console.log('📄 PDF - URL finale utilisée:', downloadUrl);
    } else {
      // Pour les autres fichiers, utiliser l'URL normale
      downloadUrl = cloudinaryService.generateDownloadUrl(document.public_id_cloudinary, false) || document.url_cloudinary;
      console.log('📄 Fichier non-PDF - URL générée:', downloadUrl);
    }

    // Pour les PDFs, utiliser le proxy au lieu de l'URL directe
    if (isPdf) {
      const proxyUrl = `${req.protocol}://${req.get('host')}/api/documents-rh/${document.id}/proxy`;
      console.log('📄 PDF - Utilisation du proxy:', proxyUrl);
      
      res.json({ 
        success: true, 
        data: {
          url: proxyUrl,
          nom_fichier: document.nom_fichier,
          nom_fichier_original: document.nom_fichier_original,
          type_mime: document.type_mime,
          is_pdf: isPdf,
          public_id: document.public_id_cloudinary,
          use_proxy: true
        }
      });
    } else {
      res.json({ 
        success: true, 
        data: {
          url: downloadUrl,
          nom_fichier: document.nom_fichier,
          nom_fichier_original: document.nom_fichier_original,
          type_mime: document.type_mime,
          is_pdf: isPdf,
          public_id: document.public_id_cloudinary,
          use_proxy: false
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement du document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/documents-rh/:id/proxy - Proxy pour servir les PDFs directement
router.get('/:id/proxy', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const document = await DocumentRH.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    const isPdf = document.type_mime === 'application/pdf' || document.nom_fichier.endsWith('.pdf');
    
    if (!isPdf) {
      return res.status(400).json({ success: false, message: 'Cette route est uniquement pour les PDFs' });
    }

    console.log('🔄 Proxy PDF pour:', document.public_id_cloudinary);

    // Utiliser le service Cloudinary pour récupérer le fichier
    const CloudinaryDocumentService = require('../services/cloudinaryDocumentService');
    const cloudinaryService = new CloudinaryDocumentService();
    
    // Générer une URL signée pour récupérer le fichier
    const signedUrl = cloudinaryService.generateSignedUrl(document.public_id_cloudinary, true);
    
    if (!signedUrl) {
      return res.status(500).json({ success: false, message: 'Impossible de générer l\'URL signée' });
    }

    console.log('🔐 URL signée générée pour proxy:', signedUrl);

    // Faire une requête vers Cloudinary pour récupérer le fichier
    const axios = require('axios');
    const response = await axios.get(signedUrl, {
      responseType: 'stream',
      timeout: 30000
    });

    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', document.type_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${document.nom_fichier_original}"`);
    res.setHeader('Content-Length', response.headers['content-length'] || '');
    
    console.log('📤 Envoi du PDF via proxy...');

    // Streamer le fichier vers la réponse
    response.data.pipe(res);

  } catch (error) {
    console.error('❌ Erreur lors du proxy PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du téléchargement du PDF',
      error: error.message 
    });
  }
});

module.exports = router;
