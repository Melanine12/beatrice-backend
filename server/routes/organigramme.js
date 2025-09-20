const express = require('express');
const router = express.Router();
const Organigramme = require('../models/Organigramme');
const { authenticateToken } = require('../middleware/auth');

// GET /api/organigramme - Récupérer l'organigramme complet
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organigramme = await Organigramme.getOrganigrammeComplet();
    
    res.json({
      success: true,
      data: organigramme
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'organigramme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de l\'organigramme'
    });
  }
});

// GET /api/organigramme/employes-disponibles - Récupérer les employés disponibles
router.get('/employes-disponibles', authenticateToken, async (req, res) => {
  try {
    const employes = await Organigramme.getEmployesDisponibles();
    
    res.json({
      success: true,
      data: employes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des employés disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des employés disponibles'
    });
  }
});

// GET /api/organigramme/poste/:id - Récupérer un poste par ID
router.get('/poste/:id', authenticateToken, async (req, res) => {
  try {
    const poste = await Organigramme.getPosteById(req.params.id);
    
    if (!poste) {
      return res.status(404).json({
        success: false,
        message: 'Poste non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: poste
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du poste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du poste'
    });
  }
});

// POST /api/organigramme/assigner - Assigner un employé à un poste
router.post('/assigner', authenticateToken, async (req, res) => {
  try {
    const { posteId, employeId } = req.body;
    
    if (!posteId || !employeId) {
      return res.status(400).json({
        success: false,
        message: 'posteId et employeId sont requis'
      });
    }

    const success = await Organigramme.assignerEmploye(posteId, employeId, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Employé assigné avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'assignation de l\'employé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'assignation de l\'employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'assignation de l\'employé'
    });
  }
});

// DELETE /api/organigramme/desassigner/:posteId - Désassigner un employé d'un poste
router.delete('/desassigner/:posteId', authenticateToken, async (req, res) => {
  try {
    const { posteId } = req.params;
    
    const success = await Organigramme.desassignerEmploye(posteId, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Employé désassigné avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la désassignation de l\'employé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la désassignation de l\'employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la désassignation de l\'employé'
    });
  }
});

// PUT /api/organigramme/poste/:id - Mettre à jour un poste
router.put('/poste/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const success = await Organigramme.updatePoste(id, data, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Poste mis à jour avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du poste'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du poste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du poste'
    });
  }
});

module.exports = router;
