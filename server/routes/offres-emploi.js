const express = require('express');
const router = express.Router();
const { OffreEmploi, CandidatureOffre, User, Departement } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const offreNotificationService = require('../services/offreNotificationService');

// Apply authentication to all routes
router.use(authenticateToken);

// Middleware de validation
const validateOffre = [
  body('titre_poste').notEmpty().withMessage('Titre du poste requis'),
  body('description').notEmpty().withMessage('Description requise'),
  body('type_contrat').isIn(['CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant']).withMessage('Type de contrat invalide'),
  body('salaire_min').optional().isDecimal().withMessage('Salaire minimum invalide'),
  body('salaire_max').optional().isDecimal().withMessage('Salaire maximum invalide'),
  body('devise').optional().isLength({ min: 3, max: 3 }).withMessage('Devise invalide'),
  body('duree_hebdomadaire').optional().isInt({ min: 1, max: 60 }).withMessage('Durée hebdomadaire invalide'),
  body('date_debut_poste').optional().isISO8601().withMessage('Date de début invalide'),
  body('date_limite_candidature').optional().isISO8601().withMessage('Date limite invalide'),
  body('statut').optional().isIn(['Ouverte', 'Fermée', 'Suspendue', 'Pourvue']).withMessage('Statut invalide'),
  body('niveau_experience').optional().isIn(['Débutant', 'Intermédiaire', 'Expérimenté', 'Expert']).withMessage('Niveau d\'expérience invalide'),
  body('nombre_poste').optional().isInt({ min: 1 }).withMessage('Nombre de postes invalide')
];

// GET /api/offres-emploi - Récupérer toutes les offres
router.get('/', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type_contrat, departement_id, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    if (type_contrat) where.type_contrat = type_contrat;
    if (departement_id) where.departement_id = departement_id;
    
    // Recherche textuelle
    if (search) {
      where[require('sequelize').Op.or] = [
        { titre_poste: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
        { lieu_travail: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const total = await OffreEmploi.count({ where });
    
    const offres = await OffreEmploi.findAll({
      where,
      include: [
        {
          model: Departement,
          as: 'departement',
          attributes: ['id', 'nom']
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
      data: offres,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/offres-emploi/:id - Récupérer une offre par ID
router.get('/:id', requireRole(['Superviseur RH', 'Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const offre = await OffreEmploi.findByPk(req.params.id, {
      include: [
        {
          model: Departement,
          as: 'departement',
          attributes: ['id', 'nom', 'description']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom', 'email']
        },
        {
          model: CandidatureOffre,
          as: 'Candidatures',
          attributes: ['id', 'candidat_nom', 'candidat_prenom', 'statut', 'date_candidature'],
          order: [['date_candidature', 'DESC']]
        }
      ]
    });

    if (!offre) {
      return res.status(404).json({ success: false, message: 'Offre non trouvée' });
    }

    // Incrémenter le compteur de vues
    await offre.incrementerVues();

    res.json({ success: true, data: offre });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'offre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/offres-emploi - Créer une nouvelle offre
router.post('/', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), validateOffre, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Vérifier que le département existe si fourni
    if (req.body.departement_id) {
      const departement = await Departement.findByPk(req.body.departement_id);
      if (!departement) {
        return res.status(400).json({ success: false, message: 'Département non trouvé' });
      }
    }

    const offre = await OffreEmploi.create({
      ...req.body,
      cree_par: req.user.id,
      date_publication: req.body.statut === 'Ouverte' ? new Date() : null
    });

    // Récupérer l'offre avec les relations
    const offreAvecRelations = await OffreEmploi.findByPk(offre.id, {
      include: [
        {
          model: Departement,
          as: 'departement',
          attributes: ['id', 'nom']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    // Créer une notification pour la création de l'offre
    try {
      await offreNotificationService.createOffreNotification(
        'offre_created',
        offreAvecRelations,
        req.user,
        { additionalInfo: `Type: ${req.body.type_contrat}` }
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
      // Ne pas faire échouer la création de l'offre si la notification échoue
    }

    res.status(201).json({ success: true, data: offreAvecRelations });
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/offres-emploi/:id - Mettre à jour une offre
router.put('/:id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), validateOffre, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const offre = await OffreEmploi.findByPk(req.params.id);
    if (!offre) {
      return res.status(404).json({ success: false, message: 'Offre non trouvée' });
    }

    // Vérifier que le département existe si fourni
    if (req.body.departement_id) {
      const departement = await Departement.findByPk(req.body.departement_id);
      if (!departement) {
        return res.status(400).json({ success: false, message: 'Département non trouvé' });
      }
    }

    // Mettre à jour la date de publication si le statut change vers "Ouverte"
    const updateData = { ...req.body };
    const ancienStatut = offre.statut;
    const nouveauStatut = req.body.statut;
    
    if (nouveauStatut === 'Ouverte' && ancienStatut !== 'Ouverte') {
      updateData.date_publication = new Date();
    }

    await offre.update(updateData);

    // Récupérer l'offre mise à jour avec les relations
    const offreMiseAJour = await OffreEmploi.findByPk(offre.id, {
      include: [
        {
          model: Departement,
          as: 'departement',
          attributes: ['id', 'nom']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });

    // Créer une notification pour la mise à jour de l'offre
    try {
      let notificationType = 'offre_updated';
      let additionalInfo = `Statut: ${ancienStatut} → ${nouveauStatut}`;
      
      if (nouveauStatut === 'Ouverte' && ancienStatut !== 'Ouverte') {
        notificationType = 'offre_published';
        additionalInfo = 'L\'offre est maintenant ouverte aux candidatures';
      } else if (nouveauStatut === 'Fermée' && ancienStatut !== 'Fermée') {
        notificationType = 'offre_closed';
        additionalInfo = 'L\'offre a été fermée';
      }

      await offreNotificationService.createOffreNotification(
        notificationType,
        offreMiseAJour,
        req.user,
        { additionalInfo }
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
      // Ne pas faire échouer la mise à jour de l'offre si la notification échoue
    }

    res.json({ success: true, data: offreMiseAJour });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/offres-emploi/:id - Supprimer une offre
router.delete('/:id', requireRole(['Administrateur', 'Patron']), async (req, res) => {
  try {
    const offre = await OffreEmploi.findByPk(req.params.id, {
      include: [
        {
          model: Departement,
          as: 'departement',
          attributes: ['id', 'nom']
        },
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'prenom', 'nom']
        }
      ]
    });
    
    if (!offre) {
      return res.status(404).json({ success: false, message: 'Offre non trouvée' });
    }

    // Créer une notification pour la suppression de l'offre
    try {
      await offreNotificationService.createOffreNotification(
        'offre_deleted',
        offre,
        req.user,
        { additionalInfo: `Supprimée définitivement` }
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
      // Ne pas faire échouer la suppression de l'offre si la notification échoue
    }

    await offre.destroy();
    res.json({ success: true, message: 'Offre supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/offres-emploi/:id/candidature - Postuler à une offre
router.post('/:id/candidature', async (req, res) => {
  try {
    const { candidat_nom, candidat_prenom, candidat_email, candidat_telephone, lettre_motivation, experience_annees } = req.body;

    // Vérifier que l'offre existe et est ouverte
    const offre = await OffreEmploi.findByPk(req.params.id);
    if (!offre) {
      return res.status(404).json({ success: false, message: 'Offre non trouvée' });
    }

    if (!offre.isOuverte()) {
      return res.status(400).json({ success: false, message: 'Cette offre n\'accepte plus de candidatures' });
    }

    // Vérifier si le candidat a déjà postulé
    const candidatureExistante = await CandidatureOffre.findOne({
      where: {
        offre_id: req.params.id,
        candidat_email: candidat_email
      }
    });

    if (candidatureExistante) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà postulé à cette offre' });
    }

    const candidature = await CandidatureOffre.create({
      offre_id: req.params.id,
      candidat_nom,
      candidat_prenom,
      candidat_email,
      candidat_telephone,
      lettre_motivation,
      experience_annees: experience_annees || 0
    });

    // Incrémenter le compteur de candidatures
    await offre.increment('candidatures');

    // Créer une notification pour la nouvelle candidature
    try {
      await offreNotificationService.createCandidatureNotification(
        'candidature_received',
        candidature,
        offre,
        { prenom: candidature.candidat_prenom, nom: candidature.candidat_nom }, // Utilisateur fictif pour les candidatures externes
        { additionalInfo: `Email: ${candidature.candidat_email}` }
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification candidature:', notificationError);
      // Ne pas faire échouer la candidature si la notification échoue
    }

    res.status(201).json({ success: true, data: candidature });
  } catch (error) {
    console.error('Erreur lors de la candidature:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/offres-emploi/:id/candidatures - Récupérer les candidatures d'une offre
router.get('/:id/candidatures', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const candidatures = await CandidatureOffre.findAll({
      where: { offre_id: req.params.id },
      order: [['date_candidature', 'DESC']]
    });

    res.json({ success: true, data: candidatures });
  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/offres-emploi/candidatures/:id - Mettre à jour le statut d'une candidature
router.put('/candidatures/:id', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const { statut, notes } = req.body;

    const candidature = await CandidatureOffre.findByPk(req.params.id);
    if (!candidature) {
      return res.status(404).json({ success: false, message: 'Candidature non trouvée' });
    }

    await candidature.update({
      statut,
      notes,
      traite_par: req.user.id,
      date_traitement: new Date()
    });

    // Récupérer l'offre pour la notification
    const offre = await OffreEmploi.findByPk(candidature.offre_id);

    // Créer une notification pour la mise à jour de la candidature
    try {
      let notificationType = 'candidature_updated';
      if (statut === 'Acceptée') {
        notificationType = 'candidature_accepted';
      } else if (statut === 'Refusée') {
        notificationType = 'candidature_rejected';
      }

      await offreNotificationService.createCandidatureNotification(
        notificationType,
        candidature,
        offre,
        req.user,
        { additionalInfo: `Statut: ${statut}` }
      );
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification candidature:', notificationError);
      // Ne pas faire échouer la mise à jour si la notification échoue
    }

    res.json({ success: true, data: candidature });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la candidature:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/offres-emploi/stats - Statistiques des offres
router.get('/stats', requireRole(['Superviseur RH', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const totalOffres = await OffreEmploi.count();
    const offresOuvertes = await OffreEmploi.count({ where: { statut: 'Ouverte' } });
    const offresFermees = await OffreEmploi.count({ where: { statut: 'Fermée' } });
    const offresPourvues = await OffreEmploi.count({ where: { statut: 'Pourvue' } });
    const totalCandidatures = await CandidatureOffre.count();
    const candidaturesEnAttente = await CandidatureOffre.count({ where: { statut: 'En_attente' } });

    res.json({
      success: true,
      data: {
        totalOffres,
        offresOuvertes,
        offresFermees,
        offresPourvues,
        totalCandidatures,
        candidaturesEnAttente
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
