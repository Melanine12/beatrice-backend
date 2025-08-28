const express = require('express');
const { body, validationResult } = require('express-validator');
const Achat = require('../models/Achat');
const LigneAchat = require('../models/LigneAchat');
const Fournisseur = require('../models/Fournisseur');
const User = require('../models/User');
const Inventaire = require('../models/Inventaire');
const MouvementStock = require('../models/MouvementStock');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/achats - Get all purchases with filtering
router.get('/', async (req, res, next) => {
  try {
    const { statut, fournisseur_id, demandeur_id, priorite, search, page = 1, limit = 20 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};
    
    // Validate statut
    const validStatuts = ['Brouillon', 'En attente', 'Approuvée', 'Commandée', 'Réceptionnée', 'Annulée'];
    if (statut && statut.trim() !== '' && validStatuts.includes(statut.trim())) {
      whereClause.statut = statut.trim();
    }
    
    // Validate priorite
    const validPriorites = ['Basse', 'Normale', 'Haute', 'Urgente'];
    if (priorite && priorite.trim() !== '' && validPriorites.includes(priorite.trim())) {
      whereClause.priorite = priorite.trim();
    }
    
    // Validate IDs
    if (fournisseur_id && fournisseur_id.trim() !== '') {
      const fournisseurId = parseInt(fournisseur_id);
      if (!isNaN(fournisseurId)) {
        whereClause.fournisseur_id = fournisseurId;
      }
    }
    
    if (demandeur_id && demandeur_id.trim() !== '') {
      const demandeurId = parseInt(demandeur_id);
      if (!isNaN(demandeurId)) {
        whereClause.demandeur_id = demandeurId;
      }
    }
    
    // Search functionality
    if (search && search.trim() !== '') {
      whereClause[require('sequelize').Op.or] = [
        { numero_commande: { [require('sequelize').Op.like]: `%${search.trim()}%` } },
        { notes: { [require('sequelize').Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { count, rows: achats } = await Achat.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Fournisseur,
          as: 'fournisseur',
          attributes: ['id', 'nom', 'email', 'telephone']
        },
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'approbateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: LigneAchat,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'categorie']
            }
          ]
        }
      ],
      limit: limitNum,
      offset: offset,
      order: [['date_creation', 'DESC']]
    });

    res.json({
      achats,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    next(error);
  }
});

// GET /api/achats/:id - Get specific purchase with lines
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const achat = await Achat.findByPk(id, {
      include: [
        {
          model: Fournisseur,
          as: 'fournisseur',
          attributes: ['id', 'nom', 'email', 'telephone', 'adresse', 'ville', 'code_postal']
        },
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'approbateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: LigneAchat,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'categorie']
            }
          ]
        }
      ]
    });

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    res.json({ achat });

  } catch (error) {
    console.error('Get purchase error:', error);
    next(error);
  }
});

// POST /api/achats - Create new purchase
router.post('/', [
  body('fournisseur_id').optional().isInt(),
  body('fournisseur_principal_id').optional().isInt(),
  body('statut').optional().isIn(['Brouillon', 'En attente', 'Approuvée', 'Commandée', 'Réceptionnée', 'Annulée']),
  body('priorite').optional().isIn(['Basse', 'Normale', 'Haute', 'Urgente']),
  body('date_livraison_souhaitee').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(Date.parse(value));
  }),
  body('montant_ht').optional().isFloat({ min: 0 }),
  body('montant_tva').optional().isFloat({ min: 0 }),
  body('taux_tva').optional().isFloat({ min: 0, max: 100 }),
  body('frais_livraison').optional().isFloat({ min: 0 }),
  body('pieces_justificatives').optional().isLength({ max: 2000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const achatData = {
      ...req.body,
      demandeur_id: req.user.id,
      numero_commande: generateOrderNumber()
    };

    // Map fournisseur_principal_id to fournisseur_id if needed
    if (achatData.fournisseur_principal_id && !achatData.fournisseur_id) {
      achatData.fournisseur_id = achatData.fournisseur_principal_id;
      delete achatData.fournisseur_principal_id;
    }

    // Clean up empty values
    Object.keys(achatData).forEach(key => {
      if (achatData[key] === '' || achatData[key] === null) {
        delete achatData[key];
      }
    });

    // Extract lignes_achat from request body
    const lignesAchat = req.body.lignes_achat || [];
    delete achatData.lignes_achat; // Remove from achat data

    // Calculate totals from lignes if provided
    let totalHT = 0;
    let totalTVA = 0;
    
    if (lignesAchat.length > 0) {
      lignesAchat.forEach(ligne => {
        const qte = parseInt(ligne.quantite) || 0;
        const prix = parseFloat(ligne.prix_unitaire) || 0;
        const taux = parseFloat(ligne.taux_tva) || 20;
        
        const montantHT = qte * prix;
        const montantTVA = montantHT * (taux / 100);
        
        totalHT += montantHT;
        totalTVA += montantTVA;
      });
      
      // Update achat totals based on lignes
      achatData.montant_ht = totalHT;
      achatData.montant_tva = totalTVA;
    } else {
      // Use provided totals if no lignes
      const ht = parseFloat(achatData.montant_ht) || 0;
      const tva = parseFloat(achatData.montant_tva) || 0;
      totalHT = ht;
      totalTVA = tva;
    }
    
    const livraison = parseFloat(achatData.frais_livraison) || 0;
    achatData.montant_total = totalHT + totalTVA + livraison;

    const achat = await Achat.create(achatData);

    // Create lignes d'achat if provided
    if (lignesAchat.length > 0) {
      const lignesToCreate = lignesAchat.map(ligne => ({
        achat_id: achat.id,
        inventaire_id: ligne.produit_id || null,
        description: ligne.description || `Produit ${ligne.produit_id || 'N/A'}`,
        quantite: parseInt(ligne.quantite) || 1,
        prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
        taux_tva: parseFloat(ligne.taux_tva) || 20,
        unite: ligne.unite || 'pièce',
        reference_fournisseur: ligne.reference_fournisseur || null,
        notes: ligne.notes || null,
        date_livraison_souhaitee: ligne.date_livraison_souhaitee || null
      }));

      // Calculate totals for each ligne
      lignesToCreate.forEach(ligne => {
        const qte = parseInt(ligne.quantite) || 0;
        const prix = parseFloat(ligne.prix_unitaire) || 0;
        const taux = parseFloat(ligne.taux_tva) || 20;
        
        ligne.montant_ht = qte * prix;
        ligne.montant_tva = ligne.montant_ht * (taux / 100);
        ligne.montant_ttc = ligne.montant_ht + ligne.montant_tva;
      });

      await LigneAchat.bulkCreate(lignesToCreate);

      // Create automatic stock movements for each line
      const mouvementsToCreate = lignesToCreate.map(ligne => {
        return {
          inventaire_id: ligne.inventaire_id,
          type_mouvement: 'Entrée',
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          montant_total: ligne.montant_ttc,
          motif: `Réception achat ${achat.numero_commande}`,
          reference_document: 'Achat',
          numero_document: achat.numero_commande,
          achat_id: achat.id,
          utilisateur_id: req.user.id,
          chambre_id: null,
          emplacement_source: 'Fournisseur',
          emplacement_destination: 'Entrepôt',
          date_mouvement: new Date(),
          notes: `Entrée automatique depuis l'achat ${achat.numero_commande}`,
          statut: 'Validé'
        };
      });

      // Create stock movements
      if (mouvementsToCreate.length > 0) {
        await MouvementStock.bulkCreate(mouvementsToCreate);
      }

      // Update inventory quantities
      for (const ligne of lignesToCreate) {
        if (ligne.inventaire_id) {
          const inventaire = await Inventaire.findByPk(ligne.inventaire_id);
          if (inventaire) {
            const nouvelleQuantite = (inventaire.quantite || 0) + ligne.quantite;
            await inventaire.update({ quantite: nouvelleQuantite });
          }
        }
      }
    }

    // Fetch the created achat with lignes
    const achatWithLignes = await Achat.findByPk(achat.id, {
      include: [
        {
          model: LigneAchat,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'categorie']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Achat créé avec succès',
      achat: achatWithLignes
    });

  } catch (error) {
    console.error('Create purchase error:', error);
    next(error);
  }
});

// PUT /api/achats/:id - Update purchase
router.put('/:id', [
  body('fournisseur_id').optional().isInt(),
  body('fournisseur_principal_id').optional().isInt(),
  body('statut').optional().isIn(['Brouillon', 'En attente', 'Approuvée', 'Commandée', 'Réceptionnée', 'Annulée']),
  body('priorite').optional().isIn(['Basse', 'Normale', 'Haute', 'Urgente']),
  body('date_livraison_souhaitee').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(Date.parse(value));
  }),
  body('montant_ht').optional().isFloat({ min: 0 }),
  body('montant_tva').optional().isFloat({ min: 0 }),
  body('taux_tva').optional().isFloat({ min: 0, max: 100 }),
  body('frais_livraison').optional().isFloat({ min: 0 }),
  body('pieces_justificatives').optional().isLength({ max: 2000 })
], async (req, res, next) => {
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
    const achat = await Achat.findByPk(id);

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    // Check permissions
    if (achat.demandeur_id !== req.user.id && !req.user.hasPermission('Superviseur')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Permissions insuffisantes pour modifier cet achat'
      });
    }

    const updateData = { ...req.body };

    // Extract lignes_achat from request body
    const lignesAchat = req.body.lignes_achat || [];
    delete updateData.lignes_achat; // Remove from update data

    // Map fournisseur_principal_id to fournisseur_id if needed
    if (updateData.fournisseur_principal_id && !updateData.fournisseur_id) {
      updateData.fournisseur_id = updateData.fournisseur_principal_id;
      delete updateData.fournisseur_principal_id;
    }

    // Clean up empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Calculate totals from lignes if provided
    let totalHT = 0;
    let totalTVA = 0;
    
    if (lignesAchat.length > 0) {
      lignesAchat.forEach(ligne => {
        const qte = parseInt(ligne.quantite) || 0;
        const prix = parseFloat(ligne.prix_unitaire) || 0;
        const taux = parseFloat(ligne.taux_tva) || 20;
        
        const montantHT = qte * prix;
        const montantTVA = montantHT * (taux / 100);
        
        totalHT += montantHT;
        totalTVA += montantTVA;
      });
      
      // Update achat totals based on lignes
      updateData.montant_ht = totalHT;
      updateData.montant_tva = totalTVA;
    } else {
      // Use provided totals if no lignes
      const ht = parseFloat(updateData.montant_ht) || parseFloat(achat.montant_ht) || 0;
      const tva = parseFloat(updateData.montant_tva) || parseFloat(achat.montant_tva) || 0;
      totalHT = ht;
      totalTVA = tva;
    }
    
    const livraison = parseFloat(updateData.frais_livraison) || parseFloat(achat.frais_livraison) || 0;
    updateData.montant_total = totalHT + totalTVA + livraison;

    await achat.update(updateData);

    // Update lignes d'achat if provided
    if (lignesAchat.length > 0) {
      // Delete existing lignes
      await LigneAchat.destroy({ where: { achat_id: id } });
      
      // Create new lignes
      const lignesToCreate = lignesAchat.map(ligne => ({
        achat_id: id,
        inventaire_id: ligne.produit_id || null,
        description: ligne.description || `Produit ${ligne.produit_id || 'N/A'}`,
        quantite: parseInt(ligne.quantite) || 1,
        prix_unitaire: parseFloat(ligne.prix_unitaire) || 0,
        taux_tva: parseFloat(ligne.taux_tva) || 20,
        unite: ligne.unite || 'pièce',
        reference_fournisseur: ligne.reference_fournisseur || null,
        notes: ligne.notes || null,
        date_livraison_souhaitee: ligne.date_livraison_souhaitee || null
      }));

      // Calculate totals for each ligne
      lignesToCreate.forEach(ligne => {
        const qte = parseInt(ligne.quantite) || 0;
        const prix = parseFloat(ligne.prix_unitaire) || 0;
        const taux = parseFloat(ligne.taux_tva) || 20;
        
        ligne.montant_ht = qte * prix;
        ligne.montant_tva = ligne.montant_ht * (taux / 100);
        ligne.montant_ttc = ligne.montant_ht + ligne.montant_tva;
      });

      await LigneAchat.bulkCreate(lignesToCreate);

      // Create automatic stock movements if status is "Réceptionnée"
      if (updateData.statut === 'Réceptionnée') {
        const mouvementsToCreate = lignesToCreate.map(ligne => {
          return {
            inventaire_id: ligne.inventaire_id,
            type_mouvement: 'Entrée',
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
            montant_total: ligne.montant_ttc,
            motif: `Réception achat ${achat.numero_commande}`,
            reference_document: 'Achat',
            numero_document: achat.numero_commande,
            achat_id: achat.id,
            utilisateur_id: req.user.id,
            chambre_id: null,
            emplacement_source: 'Fournisseur',
            emplacement_destination: 'Entrepôt',
            date_mouvement: new Date(),
            notes: `Entrée automatique depuis l'achat ${achat.numero_commande}`,
            statut: 'Validé'
          };
        });

        // Create stock movements
        if (mouvementsToCreate.length > 0) {
          await MouvementStock.bulkCreate(mouvementsToCreate);
        }

        // Update inventory quantities
        for (const ligne of lignesToCreate) {
          if (ligne.inventaire_id) {
            const inventaire = await Inventaire.findByPk(ligne.inventaire_id);
            if (inventaire) {
              const nouvelleQuantite = (inventaire.quantite || 0) + ligne.quantite;
              await inventaire.update({ quantite: nouvelleQuantite });
            }
          }
        }
      }
    }

    // Fetch the updated achat with lignes
    const achatWithLignes = await Achat.findByPk(id, {
      include: [
        {
          model: LigneAchat,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'categorie']
            }
          ]
        }
      ]
    });

    res.json({
      message: 'Achat mis à jour avec succès',
      achat: achatWithLignes
    });

  } catch (error) {
    console.error('Update purchase error:', error);
    next(error);
  }
});

// POST /api/achats/:id/approve - Approve purchase (Superviseur only)
router.post('/:id/approve', [
  requireRole('Superviseur')
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const achat = await Achat.findByPk(id);

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    if (!achat.canBeApproved()) {
      return res.status(400).json({ 
        error: 'Cannot approve purchase',
        message: 'Cet achat ne peut pas être approuvé'
      });
    }

    await achat.update({
      statut: 'Approuvée',
      approbateur_id: req.user.id,
      date_modification: new Date()
    });

    res.json({
      message: 'Achat approuvé avec succès',
      achat
    });

  } catch (error) {
    console.error('Approve purchase error:', error);
    next(error);
  }
});

// POST /api/achats/:id/cancel - Cancel purchase
router.post('/:id/cancel', [
  body('motif_annulation').isLength({ min: 5, max: 500 })
], async (req, res, next) => {
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
    const achat = await Achat.findByPk(id);

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    if (!achat.canBeCancelled()) {
      return res.status(400).json({ 
        error: 'Cannot cancel purchase',
        message: 'Cet achat ne peut pas être annulé'
      });
    }

    // Check permissions
    if (achat.demandeur_id !== req.user.id && !req.user.hasPermission('Superviseur')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Permissions insuffisantes pour annuler cet achat'
      });
    }

    await achat.update({
      statut: 'Annulée',
      motif_annulation: req.body.motif_annulation,
      date_modification: new Date()
    });

    res.json({
      message: 'Achat annulé avec succès',
      achat
    });

  } catch (error) {
    console.error('Cancel purchase error:', error);
    next(error);
  }
});

// DELETE /api/achats/:id - Delete purchase (Administrateur only)
router.delete('/:id', [
  requireRole('Administrateur')
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const achat = await Achat.findByPk(id);

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    // Delete associated lines first
    await LigneAchat.destroy({ where: { achat_id: id } });
    
    // Delete the purchase
    await achat.destroy();

    res.json({
      message: 'Achat supprimé avec succès'
    });

  } catch (error) {
    console.error('Delete purchase error:', error);
    next(error);
  }
});

// POST /api/achats/:id/lignes - Add line to purchase
router.post('/:id/lignes', [
  body('description').isLength({ min: 3, max: 500 }),
  body('quantite').isInt({ min: 1 }),
  body('prix_unitaire').isFloat({ min: 0 }),
  body('taux_tva').optional().isFloat({ min: 0, max: 100 }),
  body('inventaire_id').optional().isInt(),
  body('unite').optional().isLength({ max: 20 }),
  body('reference_fournisseur').optional().isLength({ max: 100 })
], async (req, res, next) => {
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
    const achat = await Achat.findByPk(id);

    if (!achat) {
      return res.status(404).json({ 
        error: 'Purchase not found',
        message: 'Achat non trouvé'
      });
    }

    const ligneData = {
      ...req.body,
      achat_id: id,
      taux_tva: req.body.taux_tva || 20.00
    };

    // Clean up empty values
    Object.keys(ligneData).forEach(key => {
      if (ligneData[key] === '' || ligneData[key] === null) {
        delete ligneData[key];
      }
    });

    const ligne = await LigneAchat.create(ligneData);
    
    // Calculate line totals
    ligne.calculateTotals();
    await ligne.save();

    res.status(201).json({
      message: 'Ligne ajoutée avec succès',
      ligne
    });

  } catch (error) {
    console.error('Add line error:', error);
    next(error);
  }
});

// PUT /api/achats/:id/lignes/:ligneId - Update line
router.put('/:id/lignes/:ligneId', [
  body('description').optional().isLength({ min: 3, max: 500 }),
  body('quantite').optional().isInt({ min: 1 }),
  body('prix_unitaire').optional().isFloat({ min: 0 }),
  body('taux_tva').optional().isFloat({ min: 0, max: 100 }),
  body('inventaire_id').optional().isInt(),
  body('unite').optional().isLength({ max: 20 }),
  body('reference_fournisseur').optional().isLength({ max: 100 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array()
      });
    }

    const { id, ligneId } = req.params;
    const ligne = await LigneAchat.findOne({
      where: { id: ligneId, achat_id: id }
    });

    if (!ligne) {
      return res.status(404).json({ 
        error: 'Line not found',
        message: 'Ligne non trouvée'
      });
    }

    const updateData = { ...req.body };

    // Clean up empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    await ligne.update(updateData);
    
    // Recalculate totals
    ligne.calculateTotals();
    await ligne.save();

    res.json({
      message: 'Ligne mise à jour avec succès',
      ligne
    });

  } catch (error) {
    console.error('Update line error:', error);
    next(error);
  }
});

// DELETE /api/achats/:id/lignes/:ligneId - Delete line
router.delete('/:id/lignes/:ligneId', async (req, res, next) => {
  try {
    const { id, ligneId } = req.params;
    const ligne = await LigneAchat.findOne({
      where: { id: ligneId, achat_id: id }
    });

    if (!ligne) {
      return res.status(404).json({ 
        error: 'Line not found',
        message: 'Ligne non trouvée'
      });
    }

    await ligne.destroy();

    res.json({
      message: 'Ligne supprimée avec succès'
    });

  } catch (error) {
    console.error('Delete line error:', error);
    next(error);
  }
});

// GET /api/achats/stats/overview - Get purchase statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    
    // Basic counts
    const totalPurchases = await Achat.count();
    const draftPurchases = await Achat.count({ where: { statut: 'Brouillon' } });
    const pendingPurchases = await Achat.count({ where: { statut: 'En attente' } });
    const approvedPurchases = await Achat.count({ where: { statut: 'Approuvée' } });
    const orderedPurchases = await Achat.count({ where: { statut: 'Commandée' } });
    const receivedPurchases = await Achat.count({ where: { statut: 'Réceptionnée' } });
    const cancelledPurchases = await Achat.count({ where: { statut: 'Annulée' } });

    // Amount statistics
    const totalAmount = await Achat.findAll({
      attributes: [
        [Achat.sequelize.fn('SUM', Achat.sequelize.col('montant_total')), 'totalAmount'],
        [Achat.sequelize.fn('SUM', Achat.sequelize.col('montant_ht')), 'totalHT'],
        [Achat.sequelize.fn('SUM', Achat.sequelize.col('montant_tva')), 'totalTVA']
      ]
    });

    // Purchases by status
    const purchasesByStatus = await Achat.findAll({
      attributes: [
        'statut',
        [Achat.sequelize.fn('COUNT', Achat.sequelize.col('id')), 'count'],
        [Achat.sequelize.fn('SUM', Achat.sequelize.col('montant_total')), 'totalAmount']
      ],
      group: ['statut']
    });

    // Recent purchases (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPurchases = await Achat.count({
      where: {
        date_creation: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      stats: {
        total: totalPurchases,
        draft: draftPurchases,
        pending: pendingPurchases,
        approved: approvedPurchases,
        ordered: orderedPurchases,
        received: receivedPurchases,
        cancelled: cancelledPurchases,
        recent: recentPurchases,
        totalAmount: totalAmount[0]?.dataValues?.totalAmount || 0,
        totalHT: totalAmount[0]?.dataValues?.totalHT || 0,
        totalTVA: totalAmount[0]?.dataValues?.totalTVA || 0
      },
      purchasesByStatus
    });

  } catch (error) {
    console.error('Get purchase stats error:', error);
    next(error);
  }
});

// Helper function to generate order number
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CMD-${year}${month}${day}-${random}`;
}

module.exports = router; 