const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/suivis-maintenances - Récupérer tous les suivis de maintenance
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Récupération des suivis de maintenance...');
    
    const suivis = await sequelize.query(`
      SELECT 
        sm.*,
        p.titre as probleme_titre,
        p.description as probleme_description,
        u.nom as technicien_nom,
        u.prenom as technicien_prenom
      FROM tbl_suivis_maintenances sm
      LEFT JOIN tbl_problematiques p ON sm.problematique_id = p.id
      LEFT JOIN tbl_utilisateurs u ON sm.technicien_id = u.id
      ORDER BY sm.date_intervention DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log('✅ Suivis de maintenance récupérés:', suivis.length);
    
    res.json({
      success: true,
      suivis: suivis
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des suivis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suivis de maintenance',
      error: error.message
    });
  }
});

// POST /api/suivis-maintenances - Créer un nouveau suivi de maintenance
router.post('/', requireRole(['Superviseur', 'Maintenance', 'Administrateur']), [
  body('problematique_id').isInt({ min: 1 }).withMessage('ID problématique requis'),
  body('technicien_id').isInt({ min: 1 }).withMessage('ID technicien requis'),
  body('date_intervention').isISO8601().withMessage('Date d\'intervention requise'),
  body('type_intervention').notEmpty().withMessage('Type d\'intervention requis'),
  body('statut').isIn(['Planifiée', 'En cours', 'Terminée', 'Reportée']).withMessage('Statut invalide')
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

    console.log('🔍 Création d\'un nouveau suivi de maintenance...');
    
    const {
      problematique_id,
      technicien_id,
      date_intervention,
      type_intervention,
      statut,
      description_intervention,
      duree_intervention,
      pieces_utilisees,
      cout_intervention
    } = req.body;

    const result = await sequelize.query(`
      INSERT INTO tbl_suivis_maintenances (
        problematique_id, technicien_id, date_intervention, type_intervention,
        statut, description_intervention, duree_intervention, pieces_utilisees,
        cout_intervention, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        problematique_id, technicien_id, date_intervention, type_intervention,
        statut, description_intervention || null, duree_intervention || null,
        pieces_utilisees || null, cout_intervention || null, req.user.id
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✅ Suivi de maintenance créé avec l\'ID:', result[0]);
    
    res.status(201).json({
      success: true,
      message: 'Suivi de maintenance créé avec succès',
      id: result[0]
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du suivi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du suivi de maintenance',
      error: error.message
    });
  }
});

// PUT /api/suivis-maintenances/:id - Modifier un suivi de maintenance
router.put('/:id', requireRole(['Superviseur', 'Maintenance', 'Administrateur']), [
  body('statut').optional().isIn(['Planifiée', 'En cours', 'Terminée', 'Reportée']).withMessage('Statut invalide')
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

    console.log('🔍 Modification du suivi de maintenance:', req.params.id);
    
    const {
      date_intervention,
      type_intervention,
      statut,
      description_intervention,
      duree_intervention,
      pieces_utilisees,
      cout_intervention
    } = req.body;

    await sequelize.query(`
      UPDATE tbl_suivis_maintenances SET
        date_intervention = ?, type_intervention = ?, statut = ?,
        description_intervention = ?, duree_intervention = ?, pieces_utilisees = ?,
        cout_intervention = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [
        date_intervention, type_intervention, statut,
        description_intervention || null, duree_intervention || null,
        pieces_utilisees || null, cout_intervention || null,
        req.user.id, req.params.id
      ],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Suivi de maintenance modifié avec succès');
    
    res.json({
      success: true,
      message: 'Suivi de maintenance modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la modification du suivi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du suivi de maintenance',
      error: error.message
    });
  }
});

// DELETE /api/suivis-maintenances/:id - Supprimer un suivi de maintenance
router.delete('/:id', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    console.log('🔍 Suppression du suivi de maintenance:', req.params.id);
    
    await sequelize.query(`
      DELETE FROM tbl_suivis_maintenances WHERE id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.DELETE
    });

    console.log('✅ Suivi de maintenance supprimé avec succès');
    
    res.json({
      success: true,
      message: 'Suivi de maintenance supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du suivi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du suivi de maintenance',
      error: error.message
    });
  }
});

module.exports = router;