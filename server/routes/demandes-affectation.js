const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const DemandeAffectation = require('../models/DemandeAffectation');
const DemandeAffectationLigne = require('../models/DemandeAffectationLigne');
const Inventaire = require('../models/Inventaire');
const Chambre = require('../models/Chambre');
const User = require('../models/User');
const Departement = require('../models/Departement');
const SousDepartement = require('../models/SousDepartement');
const MouvementStock = require('../models/MouvementStock');
const { sequelize } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/demandes-affectation - list with filters
router.get('/', [
  query('statut').optional().isIn(['en_attente', 'approuvee', 'rejetee', 'annulee']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('user_id').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { statut, page = 1, limit = 20, search, user_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;

    // Déterminer les permissions de l'utilisateur
    const canViewAll = req.user.role === 'Superviseur Stock' || req.user.role === 'Auditeur';
    
    if (canViewAll) {
      // Superviseur Stock et Auditeur voient toutes les demandes
      // Si user_id est fourni, filtrer par cet utilisateur
      if (user_id) {
        where.demandeur_id = parseInt(user_id, 10);
      }
    } else {
      // Autres utilisateurs voient seulement leurs propres demandes
      where.demandeur_id = req.user.id;
    }

    const include = [
      {
        model: User,
        as: 'demandeur',
        attributes: ['id', 'prenom', 'nom', 'email', 'role'],
        include: [
          { model: Departement, as: 'Departement', attributes: ['id', 'nom'] },
          { model: SousDepartement, as: 'SousDepartement', attributes: ['id', 'nom'] }
        ]
      },
      {
        model: DemandeAffectationLigne,
        as: 'lignes',
        include: [
          { model: Inventaire, as: 'inventaire', attributes: ['id', 'nom', 'code_produit', 'unite'] },
          { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
        ]
      }
    ];

    const { count, rows } = await DemandeAffectation.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error listing demandes affectation:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des demandes' });
  }
});

// POST /api/demandes-affectation - create a new request with multiple items and rooms
router.post('/', [
  body('commentaire').optional().isString(),
  body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne est requise'),
  body('lignes.*.inventaire_id').isInt({ min: 1 }),
  body('lignes.*.quantite_demandee').isInt({ min: 1 }),
  body('lignes.*.chambre_ids').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { commentaire = '', lignes } = req.body;

    // Create header
    const demande = await DemandeAffectation.create({
      demandeur_id: req.user.id,
      statut: 'en_attente',
      commentaire
    });

    // Expand lines (support multiple rooms per item)
    const linesToCreate = [];
    for (const line of lignes) {
      const chambreIds = Array.isArray(line.chambre_ids) && line.chambre_ids.length > 0 ? line.chambre_ids : [null];
      for (const chambreId of chambreIds) {
        linesToCreate.push({
          demande_affectation_id: demande.id,
          inventaire_id: line.inventaire_id,
          chambre_id: chambreId,
          quantite_demandee: parseInt(line.quantite_demandee, 10) || 1,
          quantite_approvee: 0
        });
      }
    }

    await DemandeAffectationLigne.bulkCreate(linesToCreate);

    const created = await DemandeAffectation.findByPk(demande.id, {
      include: [
        {
          model: DemandeAffectationLigne,
          as: 'lignes',
          include: [
            { model: Inventaire, as: 'inventaire', attributes: ['id', 'nom', 'code_produit', 'unite'] },
            { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
          ]
        }
      ]
    });

    res.status(201).json({ success: true, message: 'Demande d\'affectation créée', data: created });
  } catch (error) {
    console.error('Error creating demande affectation:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
});

// GET /api/demandes-affectation/:id - details
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const demande = await DemandeAffectation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'prenom', 'nom', 'email', 'role'],
          include: [
            { model: Departement, as: 'Departement', attributes: ['id', 'nom'] },
            { model: SousDepartement, as: 'SousDepartement', attributes: ['id', 'nom'] }
          ]
        },
        {
          model: DemandeAffectationLigne, as: 'lignes',
          include: [
            { model: Inventaire, as: 'inventaire', attributes: ['id', 'nom', 'code_produit', 'unite'] },
            { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
          ]
        }
      ]
    });
    if (!demande) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    
    // Vérifier les permissions d'accès
    const canViewAll = req.user.role === 'Superviseur Stock' || req.user.role === 'Auditeur';
    if (!canViewAll && demande.demandeur_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    res.json({ success: true, data: demande });
  } catch (error) {
    console.error('Error fetching demande details:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/demandes-affectation/:id - delete
router.delete('/:id', [requireRole(['Superviseur', 'Superviseur Stock', 'Auditeur', 'Administrateur', 'Patron'])], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const demande = await DemandeAffectation.findByPk(id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande non trouvée' });

    await DemandeAffectationLigne.destroy({ where: { demande_affectation_id: id } });
    await demande.destroy();
    res.json({ success: true, message: 'Demande supprimée' });
  } catch (error) {
    console.error('Error deleting demande:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/demandes-affectation/:id/approve-lines - approve quantities per line
router.put('/:id/approve-lines', [
  requireRole(['Superviseur', 'Superviseur Stock', 'Auditeur', 'Administrateur', 'Patron']),
  body('approvals').isArray({ min: 1 }),
  body('approvals.*.ligne_id').isInt({ min: 1 }),
  body('approvals.*.quantite_approvee').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const demandeId = parseInt(req.params.id, 10);
    const demande = await DemandeAffectation.findByPk(demandeId);
    if (!demande) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const { approvals } = req.body;

    // Use a transaction for consistency: update lines, inventory, and create movements
    await sequelize.transaction(async (t) => {
      for (const ap of approvals) {
        const ligne = await DemandeAffectationLigne.findByPk(ap.ligne_id, { transaction: t });
        if (!ligne || ligne.demande_affectation_id !== demandeId) continue;

        // Update approved quantity for the line
        const approvedQty = Math.max(0, parseInt(ap.quantite_approvee, 10) || 0);
        await ligne.update({ quantite_approvee: approvedQty }, { transaction: t });

        // Create stock movement (Sortie) and update inventory if applicable
        if (approvedQty > 0 && ligne.inventaire_id) {
          const inventaire = await Inventaire.findByPk(ligne.inventaire_id, { transaction: t });
          if (inventaire) {
            const quantiteAvant = parseInt(inventaire.quantite || 0, 10);
            const quantiteSortie = Math.min(approvedQty, quantiteAvant);
            const quantiteApres = Math.max(0, quantiteAvant - quantiteSortie);

            // Create movement record
            await MouvementStock.create({
              inventaire_id: ligne.inventaire_id,
              type_mouvement: 'Sortie',
              quantite: quantiteSortie,
              quantite_avant: quantiteAvant,
              quantite_apres: quantiteApres,
              prix_unitaire: inventaire.prix_unitaire || null,
              montant_total: inventaire.prix_unitaire ? (parseFloat(inventaire.prix_unitaire) * quantiteSortie) : null,
              motif: 'Affectation',
              reference_document: 'DemandeAffectation',
              numero_document: String(demandeId),
              utilisateur_id: req.user.id,
              chambre_id: ligne.chambre_id || null,
              date_mouvement: new Date(),
              statut: 'Validé'
            }, { transaction: t });

            // Update inventory quantity
            await inventaire.update({ quantite: quantiteApres }, { transaction: t });
          }
        }
      }

      // Update header status at the end
      await demande.update({ statut: 'approuvee' }, { transaction: t });
    });

    const updated = await DemandeAffectation.findByPk(demandeId, {
      include: [
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'prenom', 'nom', 'email', 'role'],
          include: [
            { model: Departement, as: 'Departement', attributes: ['id', 'nom'] },
            { model: SousDepartement, as: 'SousDepartement', attributes: ['id', 'nom'] }
          ]
        },
        {
          model: DemandeAffectationLigne, as: 'lignes',
          include: [
            { model: Inventaire, as: 'inventaire', attributes: ['id', 'nom', 'code_produit', 'unite'] },
            { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
          ]
        }
      ]
    });

    res.json({ success: true, message: 'Quantités approuvées et mouvements créés', data: updated });
  } catch (error) {
    console.error('Error approving lines:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'approbation' });
  }
});

module.exports = router;


