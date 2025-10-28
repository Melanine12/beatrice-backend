const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { DemandeFonds, LigneDemandeFonds, User, Inventaire, Depense } = require('../models');

// Récupérer toutes les demandes de fonds (avec pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, type, demandeur_id } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (demandeur_id) where.demandeur_id = demandeur_id;
    
    // Si l'utilisateur n'est pas superviseur, ne montrer que ses demandes
    if (req.user.role === 'Agent') {
      where.demandeur_id = req.user.id;
    }
    
    const { count, rows: demandes } = await DemandeFonds.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: LigneDemandeFonds,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: demandes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de fonds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des demandes de fonds' 
    });
  }
});

// Récupérer une demande de fonds spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const demande = await DemandeFonds.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'nom', 'prenom', 'email', 'departement_id', 'sous_departement_id']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: LigneDemandeFonds,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit', 'prix_unitaire']
            }
          ]
        }
      ]
    });
    
    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande de fonds non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'Agent' && demande.demandeur_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    res.json({ success: true, data: demande });
  } catch (error) {
    console.error('Erreur lors de la récupération de la demande de fonds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la demande de fonds' 
    });
  }
});

// Créer une nouvelle demande de fonds
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, motif, commentaire, devise, lignes } = req.body;
    
    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Au moins une ligne est requise' 
      });
    }

    // Vérifier que toutes les lignes ont la même devise
    const devisesLignes = [...new Set(lignes.map(l => l.devise || devise))];
    if (devisesLignes.length > 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Toutes les lignes doivent avoir la même devise' 
      });
    }

    const deviseFinale = devise || devisesLignes[0] || 'EUR';
    
    // Calculer le montant total
    const montantTotal = lignes.reduce((total, ligne) => {
      if (type === 'bon_achat') {
        return total + (ligne.prix_unitaire * ligne.quantite);
      } else {
        return total + ligne.montant;
      }
    }, 0);
    
    // Créer la demande
    const demande = await DemandeFonds.create({
      type,
      motif,
      commentaire,
      devise: deviseFinale,
      montant_total: montantTotal,
      demandeur_id: req.user.id,
      statut: 'en_attente'
    });
    
    // Créer les lignes
    const lignesData = lignes.map(ligne => ({
      demande_fonds_id: demande.id,
      type_ligne: type === 'bon_achat' ? 'article' : 'libelle',
      libelle: ligne.libelle,
      montant: type === 'bon_achat' ? (ligne.prix_unitaire * ligne.quantite) : ligne.montant,
      devise: deviseFinale,
      inventaire_id: ligne.inventaire_id || null,
      quantite: ligne.quantite || 1,
      prix_unitaire: ligne.prix_unitaire || null
    }));
    
    await LigneDemandeFonds.bulkCreate(lignesData);
    
    // Récupérer la demande avec les lignes
    const demandeComplete = await DemandeFonds.findByPk(demande.id, {
      include: [
        {
          model: LigneDemandeFonds,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit']
            }
          ]
        }
      ]
    });
    
    res.status(201).json({ 
      success: true, 
      data: demandeComplete,
      message: 'Demande de fonds créée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de fonds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la demande de fonds' 
    });
  }
});

// Mettre à jour une demande de fonds
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const demande = await DemandeFonds.findByPk(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande de fonds non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'Agent' && demande.demandeur_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    // Seules les demandes en attente peuvent être modifiées
    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        message: 'Seules les demandes en attente peuvent être modifiées' 
      });
    }
    
    const { motif, commentaire, devise, lignes } = req.body;
    
    if (lignes && lignes.length > 0) {
      // Vérifier que toutes les lignes ont la même devise
      const devisesLignes = [...new Set(lignes.map(l => l.devise || devise || demande.devise))];
      if (devisesLignes.length > 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Toutes les lignes doivent avoir la même devise' 
        });
      }

      const deviseFinale = devise || devisesLignes[0] || demande.devise;
      
      // Supprimer les anciennes lignes
      await LigneDemandeFonds.destroy({ where: { demande_fonds_id: demande.id } });
      
      // Créer les nouvelles lignes
      const lignesData = lignes.map(ligne => ({
        demande_fonds_id: demande.id,
        type_ligne: demande.type === 'bon_achat' ? 'article' : 'libelle',
        libelle: ligne.libelle,
        montant: demande.type === 'bon_achat' ? (ligne.prix_unitaire * ligne.quantite) : ligne.montant,
        devise: deviseFinale,
        inventaire_id: ligne.inventaire_id || null,
        quantite: ligne.quantite || 1,
        prix_unitaire: ligne.prix_unitaire || null
      }));
      
      await LigneDemandeFonds.bulkCreate(lignesData);
      
      // Recalculer le montant total
      const montantTotal = lignes.reduce((total, ligne) => {
        if (demande.type === 'bon_achat') {
          return total + (ligne.prix_unitaire * ligne.quantite);
        } else {
          return total + ligne.montant;
        }
      }, 0);
      
      demande.montant_total = montantTotal;
      demande.devise = deviseFinale;
    }
    
    if (motif !== undefined) demande.motif = motif;
    if (commentaire !== undefined) demande.commentaire = commentaire;
    
    await demande.save();
    
    // Récupérer la demande mise à jour
    const demandeMiseAJour = await DemandeFonds.findByPk(demande.id, {
      include: [
        {
          model: LigneDemandeFonds,
          as: 'lignes',
          include: [
            {
              model: Inventaire,
              as: 'inventaire',
              attributes: ['id', 'nom', 'code_produit']
            }
          ]
        }
      ]
    });
    
    res.json({ 
      success: true, 
      data: demandeMiseAJour,
      message: 'Demande de fonds mise à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la demande de fonds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la demande de fonds' 
    });
  }
});

// Approuver/Rejeter une demande de fonds (superviseur et auditeur uniquement)
router.put('/:id/status', authenticateToken, requireRole(['Superviseur', 'Superviseur Finance', 'Auditeur']), async (req, res) => {
  try {
    console.log('🔐 Tentative de changement de statut - Utilisateur:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    
    const { statut, commentaire_superviseur } = req.body;
    console.log('📝 Données reçues:', { statut, commentaire_superviseur });
    
    if (!['approuvee', 'rejetee'].includes(statut)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statut invalide' 
      });
    }
    
    const demande = await DemandeFonds.findByPk(req.params.id, {
      include: [
        {
          model: LigneDemandeFonds,
          as: 'lignes'
        },
        {
          model: User,
          as: 'demandeur',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });
    
    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande de fonds non trouvée' 
      });
    }
    
    console.log('📋 Demande trouvée:', {
      id: demande.id,
      type: demande.type,
      statut: demande.statut,
      montant: demande.montant_total
    });
    
    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        message: 'Seules les demandes en attente peuvent être traitées' 
      });
    }
    
    demande.statut = statut;
    demande.commentaire_superviseur = commentaire_superviseur;
    demande.superviseur_id = req.user.id;
    demande.date_validation = new Date();
    
    await demande.save();
    console.log('✅ Demande mise à jour avec succès');
    
    // Si la demande est approuvée, créer automatiquement une dépense
    if (statut === 'approuvee') {
      try {
        console.log('💰 Création automatique de la dépense...');
        
        // Créer le titre de la dépense basé sur le type
        const titre = demande.type === 'bon_achat' 
          ? `Bon d'achat approuvé #${demande.id}`
          : `Demande de fonds approuvée #${demande.id}`;
        
        // Créer la description avec les détails
        let description = `Demande de fonds approuvée le ${new Date().toLocaleDateString('fr-FR')}\n`;
        if (demande.motif) {
          description += `Motif: ${demande.motif}\n`;
        }
        if (demande.commentaire) {
          description += `Commentaire: ${demande.commentaire}\n`;
        }
        if (commentaire_superviseur) {
          description += `Commentaire superviseur: ${commentaire_superviseur}\n`;
        }
        
        // Ajouter les détails des lignes
        description += '\nDétails:\n';
        demande.lignes.forEach((ligne, index) => {
          if (demande.type === 'bon_achat') {
            description += `${index + 1}. ${ligne.inventaire?.nom || 'Article'} - Qte: ${ligne.quantite} - Prix: ${ligne.prix_unitaire} ${ligne.devise}\n`;
          } else {
            description += `${index + 1}. ${ligne.libelle} - Montant: ${ligne.montant} ${ligne.devise}\n`;
          }
        });
        
        // Créer la dépense
        const depense = await Depense.create({
          titre: titre,
          description: description,
          montant: demande.montant_total,
          devise: demande.devise,
          categorie: 'Autre',
          statut: 'En attente',
          date_depense: new Date(),
          demandeur_id: demande.demandeur_id,
          approbateur_id: req.user.id,
          notes: `Générée automatiquement depuis la demande de fonds #${demande.id}`,
          tags: JSON.stringify([demande.type === 'bon_achat' ? 'bon_achat' : 'demande_fonds', 'auto_genere'])
        });
        
        console.log(`✅ Dépense créée automatiquement: ID ${depense.id} pour la demande de fonds #${demande.id}`);
      } catch (depenseError) {
        console.error('❌ Erreur lors de la création automatique de la dépense:', depenseError);
        // On continue même si la création de la dépense échoue
        // La demande est quand même approuvée
      }
    }
    
    console.log('🎉 Changement de statut terminé avec succès');
    res.json({ 
      success: true, 
      data: demande,
      message: `Demande de fonds ${statut === 'approuvee' ? 'approuvée' : 'rejetée'} avec succès` 
    });
  } catch (error) {
    console.error('❌ Erreur lors du changement de statut:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de statut' 
    });
  }
});

// Supprimer une demande de fonds
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const demande = await DemandeFonds.findByPk(req.params.id);
    
    if (!demande) {
      return res.status(404).json({ 
        success: false, 
        message: 'Demande de fonds non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'Agent' && demande.demandeur_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    // Seules les demandes en attente peuvent être supprimées
    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ 
        success: false, 
        message: 'Seules les demandes en attente peuvent être supprimées' 
      });
    }
    
    await demande.destroy();
    
    res.json({ 
      success: true, 
      message: 'Demande de fonds supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la demande de fonds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de la demande de fonds' 
    });
  }
});

module.exports = router;
