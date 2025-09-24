const express = require('express');
const router = express.Router();
const { OffreEmploi, CandidatureOffre, User, Departement } = require('../models');
const { body, validationResult } = require('express-validator');

// GET /api/offres-emploi/public - Liste publique des offres d'emploi
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Construire les conditions de recherche
    const whereClause = {
      statut: 'Ouverte' // Seules les offres ouvertes sont visibles publiquement
    };

    // Recherche par titre ou description
    if (req.query.search) {
      whereClause[require('sequelize').Op.or] = [
        { titre_poste: { [require('sequelize').Op.like]: `%${req.query.search}%` } },
        { description: { [require('sequelize').Op.like]: `%${req.query.search}%` } }
      ];
    }

    // Filtre par type de contrat
    if (req.query.type_contrat) {
      whereClause.type_contrat = req.query.type_contrat;
    }

    // Filtre par lieu de travail
    if (req.query.lieu_travail) {
      whereClause.lieu_travail = { [require('sequelize').Op.like]: `%${req.query.lieu_travail}%` };
    }

    const { count, rows } = await OffreEmploi.findAndCountAll({
      where: whereClause,
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
      order: [['date_creation', 'DESC']],
      limit: limit,
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement des offres publiques:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/offres-emploi/public/:id - Détails d'une offre publique
router.get('/:id', async (req, res) => {
  try {
    const offre = await OffreEmploi.findOne({
      where: {
        id: req.params.id,
        statut: 'Ouverte' // Seules les offres ouvertes sont visibles publiquement
      },
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
      return res.status(404).json({ success: false, message: 'Offre non trouvée ou non disponible' });
    }

    // Incrémenter le compteur de vues
    await offre.increment('vues');

    res.json({ success: true, data: offre });
  } catch (error) {
    console.error('Erreur lors du chargement de l\'offre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/offres-emploi/:id/candidater - Candidature publique
router.post('/:id/candidater', [
  body('candidat_nom').notEmpty().withMessage('Le nom est requis'),
  body('candidat_prenom').notEmpty().withMessage('Le prénom est requis'),
  body('candidat_email').isEmail().withMessage('Email invalide'),
  body('candidat_telephone').optional().isLength({ min: 10 }).withMessage('Téléphone invalide'),
  body('lettre_motivation').notEmpty().withMessage('La lettre de motivation est requise'),
  body('experience_annees').optional().isInt({ min: 0 }).withMessage('L\'expérience doit être un nombre positif')
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

    const { candidat_nom, candidat_prenom, candidat_email, candidat_telephone, lettre_motivation, experience_annees } = req.body;

    // Vérifier que l'offre existe et est ouverte
    const offre = await OffreEmploi.findOne({
      where: {
        id: req.params.id,
        statut: 'Ouverte'
      }
    });

    if (!offre) {
      return res.status(404).json({ success: false, message: 'Offre non trouvée ou non disponible' });
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

    // Créer la candidature
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

    res.status(201).json({ 
      success: true, 
      data: candidature,
      message: 'Candidature envoyée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la candidature:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
