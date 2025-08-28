const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { FicheExecution, ElementIntervention, Tache, User } = require('../models');
const { Op } = require('sequelize');

// Générer un numéro unique pour la fiche
const generateNumero = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Compter les fiches du jour
  const count = await FicheExecution.count({
    where: {
      created_at: {
        [Op.gte]: new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }
    }
  });
  
  return `FE-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;
};

// Récupérer toutes les fiches d'exécution (avec pagination et filtres)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, priorite, responsable_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Construire les conditions de recherche
    const where = {};
    if (statut) where.statut = statut;
    if (priorite) where.priorite = priorite;
    if (responsable_id) where.responsable_id = responsable_id;
    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } },
        { numero: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await FicheExecution.findAndCountAll({
      where,
      include: [
        {
          model: Tache,
          as: 'tache',
          attributes: ['id', 'titre', 'description', 'priorite']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: ElementIntervention,
          as: 'elements',
          attributes: ['id', 'type', 'nom', 'statut', 'disponible']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fiches d\'exécution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des fiches d\'exécution' 
    });
  }
});

// Récupérer une fiche d'exécution par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const fiche = await FicheExecution.findByPk(req.params.id, {
      include: [
        {
          model: Tache,
          as: 'tache',
          attributes: ['id', 'titre', 'description', 'priorite', 'statut']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: User,
          as: 'superviseur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        },
        {
          model: ElementIntervention,
          as: 'elements',
          order: [['type', 'ASC'], ['nom', 'ASC']]
        }
      ]
    });
    
    if (!fiche) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiche d\'exécution non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      data: fiche 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche d\'exécution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la fiche d\'exécution' 
    });
  }
});

// Créer une nouvelle fiche d'exécution
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      tache_id,
      titre,
      description,
      priorite,
      date_debut_prevue,
      date_fin_prevue,
      duree_prevue,
      responsable_id,
      superviseur_id,
      commentaire,
      elements
    } = req.body;
    
    // Validation
    if (!tache_id || !titre || !responsable_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tâche, titre et responsable sont obligatoires' 
      });
    }
    
    // Vérifier que la tâche existe
    const tache = await Tache.findByPk(tache_id);
    if (!tache) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tâche non trouvée' 
      });
    }
    
    // Générer le numéro unique
    const numero = await generateNumero();
    
    // Créer la fiche d'exécution
    const fiche = await FicheExecution.create({
      numero,
      tache_id,
      titre,
      description,
      priorite: priorite || 'normale',
      date_debut_prevue: date_debut_prevue ? new Date(date_debut_prevue) : null,
      date_fin_prevue: date_fin_prevue ? new Date(date_fin_prevue) : null,
      duree_prevue: duree_prevue ? parseInt(duree_prevue) : null,
      responsable_id,
      superviseur_id: superviseur_id || null,
      commentaire,
      statut: 'en_preparation'
    });
    
    // Créer les éléments d'intervention si fournis
    if (elements && elements.length > 0) {
      const elementsData = elements.map(element => ({
        fiche_execution_id: fiche.id,
        type: element.type,
        nom: element.nom,
        description: element.description,
        quantite: element.quantite || 1,
        unite: element.unite,
        disponible: element.disponible || false,
        fournisseur: element.fournisseur,
        reference: element.reference,
        cout_estime: element.cout_estime,
        devise: element.devise || 'EUR',
        statut: element.disponible ? 'receptionne' : 'a_commander'
      }));
      
      await ElementIntervention.bulkCreate(elementsData);
    }
    
    // Récupérer la fiche avec tous les détails
    const ficheComplete = await FicheExecution.findByPk(fiche.id, {
      include: [
        {
          model: Tache,
          as: 'tache',
          attributes: ['id', 'titre', 'description', 'priorite']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: ElementIntervention,
          as: 'elements'
        }
      ]
    });
    
    res.status(201).json({ 
      success: true, 
      data: ficheComplete,
      message: 'Fiche d\'exécution créée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la fiche d\'exécution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la fiche d\'exécution' 
    });
  }
});

// Mettre à jour une fiche d'exécution
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const fiche = await FicheExecution.findByPk(req.params.id);
    
    if (!fiche) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiche d\'exécution non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'Agent' && fiche.responsable_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    const {
      titre,
      description,
      priorite,
      date_debut_prevue,
      date_fin_prevue,
      duree_prevue,
      responsable_id,
      superviseur_id,
      commentaire,
      elements
    } = req.body;
    
    // Mettre à jour la fiche
    await fiche.update({
      titre: titre || fiche.titre,
      description: description !== undefined ? description : fiche.description,
      priorite: priorite || fiche.priorite,
      date_debut_prevue: date_debut_prevue ? new Date(date_debut_prevue) : fiche.date_debut_prevue,
      date_fin_prevue: date_fin_prevue ? new Date(date_fin_prevue) : fiche.date_fin_prevue,
      duree_prevue: duree_prevue ? parseInt(duree_prevue) : fiche.duree_prevue,
      responsable_id: responsable_id || fiche.responsable_id,
      superviseur_id: superviseur_id !== undefined ? superviseur_id : fiche.superviseur_id,
      commentaire: commentaire !== undefined ? commentaire : fiche.commentaire
    });
    
    // Mettre à jour les éléments d'intervention si fournis
    if (elements) {
      // Supprimer les anciens éléments
      await ElementIntervention.destroy({
        where: { fiche_execution_id: fiche.id }
      });
      
      // Créer les nouveaux éléments
      if (elements.length > 0) {
        const elementsData = elements.map(element => ({
          fiche_execution_id: fiche.id,
          type: element.type,
          nom: element.nom,
          description: element.description,
          quantite: element.quantite || 1,
          unite: element.unite,
          disponible: element.disponible || false,
          fournisseur: element.fournisseur,
          reference: element.reference,
          cout_estime: element.cout_estime,
          devise: element.devise || 'EUR',
          statut: element.disponible ? 'receptionne' : 'a_commander'
        }));
        
        await ElementIntervention.bulkCreate(elementsData);
      }
    }
    
    // Récupérer la fiche mise à jour
    const ficheMiseAJour = await FicheExecution.findByPk(fiche.id, {
      include: [
        {
          model: Tache,
          as: 'tache',
          attributes: ['id', 'titre', 'description', 'priorite']
        },
        {
          model: User,
          as: 'responsable',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: ElementIntervention,
          as: 'elements'
        }
      ]
    });
    
    res.json({ 
      success: true, 
      data: ficheMiseAJour,
      message: 'Fiche d\'exécution mise à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la fiche d\'exécution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la fiche d\'exécution' 
    });
  }
});

// Changer le statut d'une fiche d'exécution
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { statut, date_debut_reelle, date_fin_reelle, duree_reelle, resultat, satisfaction } = req.body;
    
    if (!['en_preparation', 'en_cours', 'terminee', 'annulee'].includes(statut)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statut invalide' 
      });
    }
    
    const fiche = await FicheExecution.findByPk(req.params.id);
    
    if (!fiche) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiche d\'exécution non trouvée' 
      });
    }
    
    // Mettre à jour le statut et les dates
    const updateData = { statut };
    
    if (statut === 'en_cours' && date_debut_reelle) {
      updateData.date_debut_reelle = new Date(date_debut_reelle);
    }
    
    if (statut === 'terminee' && date_fin_reelle) {
      updateData.date_fin_reelle = new Date(date_fin_reelle);
      if (fiche.date_debut_reelle) {
        const debut = new Date(fiche.date_debut_reelle);
        const fin = new Date(date_fin_reelle);
        updateData.duree_reelle = Math.round((fin - debut) / (1000 * 60)); // en minutes
      }
    }
    
    if (duree_reelle) updateData.duree_reelle = parseInt(duree_reelle);
    if (resultat !== undefined) updateData.resultat = resultat;
    if (satisfaction) updateData.satisfaction = satisfaction;
    
    await fiche.update(updateData);
    
    res.json({ 
      success: true, 
      data: fiche,
      message: `Fiche d'exécution ${statut === 'en_cours' ? 'démarrée' : statut === 'terminee' ? 'terminée' : statut}` 
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de statut' 
    });
  }
});

// Supprimer une fiche d'exécution
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const fiche = await FicheExecution.findByPk(req.params.id);
    
    if (!fiche) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiche d\'exécution non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'Agent' && fiche.responsable_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    // Seules les fiches en préparation peuvent être supprimées
    if (fiche.statut !== 'en_preparation') {
      return res.status(400).json({ 
        success: false, 
        message: 'Seules les fiches en préparation peuvent être supprimées' 
      });
    }
    
    await fiche.destroy();
    
    res.json({ 
      success: true, 
      message: 'Fiche d\'exécution supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la fiche d\'exécution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de la fiche d\'exécution' 
    });
  }
});

module.exports = router;
