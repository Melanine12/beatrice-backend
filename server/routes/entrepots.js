const express = require('express');
const router = express.Router();
const { Entrepot } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Récupérer tous les entrepôts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entrepots = await Entrepot.findAll({
      order: [['nom', 'ASC']]
    });
    res.json(entrepots);
  } catch (error) {
    console.error('Erreur lors de la récupération des entrepôts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un entrepôt par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entrepot = await Entrepot.findByPk(req.params.id);
    if (!entrepot) {
      return res.status(404).json({ error: 'Entrepôt non trouvé' });
    }
    res.json(entrepot);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entrepôt:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouvel entrepôt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const entrepot = await Entrepot.create(req.body);
    res.status(201).json(entrepot);
  } catch (error) {
    console.error('Erreur lors de la création de l\'entrepôt:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un entrepôt
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const entrepot = await Entrepot.findByPk(req.params.id);
    if (!entrepot) {
      return res.status(404).json({ error: 'Entrepôt non trouvé' });
    }
    
    await entrepot.update(req.body);
    res.json(entrepot);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'entrepôt:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un entrepôt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entrepot = await Entrepot.findByPk(req.params.id);
    if (!entrepot) {
      return res.status(404).json({ error: 'Entrepôt non trouvé' });
    }
    
    // Vérifier s'il y a des articles dans cet entrepôt
    const { Inventaire } = require('../models');
    const articlesCount = await Inventaire.count({
      where: { emplacement_id: req.params.id }
    });
    
    if (articlesCount > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer cet entrepôt car il contient des articles',
        articlesCount 
      });
    }
    
    await entrepot.destroy();
    res.json({ message: 'Entrepôt supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entrepôt:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des entrepôts
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { Inventaire } = require('../models');
    
    const stats = await Entrepot.findAll({
      attributes: [
        'id',
        'nom',
        'type',
        'capacite',
        'utilisation',
        'statut',
        [sequelize.fn('COUNT', sequelize.col('Inventaire.id')), 'articles_count']
      ],
      include: [{
        model: Inventaire,
        as: 'articles',
        attributes: []
      }],
      group: ['Entrepot.id'],
      order: [['nom', 'ASC']]
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 