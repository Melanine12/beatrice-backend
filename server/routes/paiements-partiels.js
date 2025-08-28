const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { PaiementPartiel, Depense, User } = require('../models');
const { Op } = require('sequelize');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// GET /api/paiements-partiels - Récupérer tous les paiements partiels
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      depense_id,
      mode_paiement,
      date_debut,
      date_fin,
      utilisateur_id
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtres
    if (depense_id) whereClause.depense_id = depense_id;
    if (mode_paiement) whereClause.mode_paiement = mode_paiement;
    if (utilisateur_id) whereClause.utilisateur_id = utilisateur_id;
    
    if (date_debut || date_fin) {
      whereClause.date_paiement = {};
      if (date_debut) whereClause.date_paiement[Op.gte] = new Date(date_debut);
      if (date_fin) whereClause.date_paiement[Op.lte] = new Date(date_fin);
    }

    const { count, rows: paiements } = await PaiementPartiel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_paiement', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      paiements,
      pagination: {
        total: count,
        pages: totalPages,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements partiels:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/paiements-partiels/:id - Récupérer un paiement partiel spécifique
router.get('/:id', async (req, res) => {
  try {
    const paiement = await PaiementPartiel.findByPk(req.params.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'montant_paye', 'montant_restant']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement partiel non trouvé' });
    }

    res.json({ paiement });
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement partiel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// POST /api/paiements-partiels - Créer un nouveau paiement partiel
router.post('/', requireRole(['Superviseur', 'Administrateur', 'Patron']), async (req, res) => {
  try {
    const {
      depense_id,
      montant,
      mode_paiement,
      reference_paiement,
      notes,
      caisse_id
    } = req.body;

    // Validation des données
    if (!depense_id || !montant || !mode_paiement) {
      return res.status(400).json({ 
        error: 'depense_id, montant et mode_paiement sont requis' 
      });
    }

    // Vérifier que la dépense existe
    const depense = await Depense.findByPk(depense_id);
    if (!depense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Vérifier que le montant ne dépasse pas le montant restant
    const montantRestant = parseFloat(depense.montant) - parseFloat(depense.montant_paye || 0);
    if (parseFloat(montant) > montantRestant) {
      return res.status(400).json({ 
        error: `Le montant du paiement (${montant}) dépasse le montant restant (${montantRestant})` 
      });
    }

    // Créer le paiement partiel
    const paiement = await PaiementPartiel.create({
      depense_id,
      montant: parseFloat(montant),
      mode_paiement,
      reference_paiement,
      notes,
      utilisateur_id: req.user.id,
      caisse_id: caisse_id || null
    });

    // Mettre à jour le montant payé dans la dépense
    const nouveauMontantPaye = parseFloat(depense.montant_paye || 0) + parseFloat(montant);
    await depense.update({
      montant_paye: nouveauMontantPaye,
      statut_paiement: nouveauMontantPaye >= parseFloat(depense.montant) ? 'Payé' : 'Partiellement payé'
    });

    // Si complètement payé, mettre à jour le statut général
    if (nouveauMontantPaye >= parseFloat(depense.montant)) {
      await depense.update({ statut: 'Payée' });
    }

    // Récupérer le paiement avec les associations
    const paiementComplet = await PaiementPartiel.findByPk(paiement.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'montant_paye', 'montant_restant']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    // Si c'est un paiement immédiat avec caisse, mettre à jour le solde de la caisse
    if (caisse_id) {
      try {
        const Caisse = require('../models/Caisse');
        const caisse = await Caisse.findByPk(caisse_id);
        if (caisse) {
          await caisse.calculerSoldeActuel();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du solde de la caisse:', error);
      }
    }

    res.status(201).json({ 
      message: 'Paiement partiel créé avec succès',
      paiement: paiementComplet
    });
  } catch (error) {
    console.error('Erreur lors de la création du paiement partiel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// PUT /api/paiements-partiels/:id - Mettre à jour un paiement partiel
router.put('/:id', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    const paiement = await PaiementPartiel.findByPk(req.params.id);
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement partiel non trouvé' });
    }

    const {
      montant,
      mode_paiement,
      reference_paiement,
      notes
    } = req.body;

    // Mettre à jour le paiement
    await paiement.update({
      montant: montant || paiement.montant,
      mode_paiement: mode_paiement || paiement.mode_paiement,
      reference_paiement: reference_paiement !== undefined ? reference_paiement : paiement.reference_paiement,
      notes: notes !== undefined ? notes : paiement.notes
    });

    // Récupérer le paiement mis à jour avec les associations
    const paiementMisAJour = await PaiementPartiel.findByPk(paiement.id, {
      include: [
        {
          model: Depense,
          as: 'depense',
          attributes: ['id', 'titre', 'montant', 'statut', 'statut_paiement', 'montant_paye', 'montant_restant']
        },
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    res.json({ 
      message: 'Paiement partiel mis à jour avec succès',
      paiement: paiementMisAJour
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement partiel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// DELETE /api/paiements-partiels/:id - Supprimer un paiement partiel
router.delete('/:id', requireRole(['Administrateur']), async (req, res) => {
  try {
    const paiement = await PaiementPartiel.findByPk(req.params.id);
    if (!paiement) {
      return res.status(404).json({ error: 'Paiement partiel non trouvé' });
    }

    // Récupérer la dépense pour ajuster le montant payé
    const depense = await Depense.findByPk(paiement.depense_id);
    if (depense) {
      const nouveauMontantPaye = parseFloat(depense.montant_paye || 0) - parseFloat(paiement.montant);
      await depense.update({
        montant_paye: Math.max(0, nouveauMontantPaye),
        statut_paiement: nouveauMontantPaye <= 0 ? 'En attente' : 'Partiellement payé'
      });

      // Si plus de paiement, remettre le statut en attente
      if (nouveauMontantPaye <= 0) {
        await depense.update({ statut: 'Approuvée' });
      }
    }

    // Supprimer le paiement partiel
    await paiement.destroy();

    res.json({ message: 'Paiement partiel supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement partiel:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/paiements-partiels/depense/:depense_id - Récupérer tous les paiements d'une dépense
router.get('/depense/:depense_id', async (req, res) => {
  try {
    const paiements = await PaiementPartiel.findAll({
      where: { depense_id: req.params.depense_id },
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom']
        }
      ],
      order: [['date_paiement', 'DESC']]
    });

    res.json({ paiements });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements de la dépense:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

// GET /api/paiements-partiels/stats/summary - Statistiques des paiements partiels
router.get('/stats/summary', async (req, res) => {
  try {
    const totalPaiements = await PaiementPartiel.count();
    const totalMontant = await PaiementPartiel.sum('montant');
    
    const paiementsParMode = await PaiementPartiel.findAll({
      attributes: [
        'mode_paiement',
        [PaiementPartiel.sequelize.fn('COUNT', PaiementPartiel.sequelize.col('id')), 'count'],
        [PaiementPartiel.sequelize.fn('SUM', PaiementPartiel.sequelize.col('montant')), 'total']
      ],
      group: ['mode_paiement']
    });

    const paiementsParMois = await PaiementPartiel.findAll({
      attributes: [
        [PaiementPartiel.sequelize.fn('DATE_FORMAT', PaiementPartiel.sequelize.col('date_paiement'), '%Y-%m'), 'mois'],
        [PaiementPartiel.sequelize.fn('COUNT', PaiementPartiel.sequelize.col('id')), 'count'],
        [PaiementPartiel.sequelize.fn('SUM', PaiementPartiel.sequelize.col('montant')), 'total']
      ],
      group: ['mois'],
      order: [['mois', 'DESC']],
      limit: 12
    });

    res.json({
      stats: {
        total_paiements: totalPaiements,
        total_montant: totalMontant || 0,
        paiements_par_mode: paiementsParMode,
        paiements_par_mois: paiementsParMois
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

module.exports = router;
