const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/alertes - Récupérer toutes les alertes
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Récupération des alertes...');
    
    const alertes = await sequelize.query(`
      SELECT 
        a.*,
        u.nom as utilisateur_nom,
        u.prenom as utilisateur_prenom
      FROM tbl_alertes a
      LEFT JOIN tbl_utilisateurs u ON a.utilisateur_id = u.id
      ORDER BY a.date_creation DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log('✅ Alertes récupérées:', alertes.length);
    
    res.json({
      success: true,
      alertes: alertes
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes',
      error: error.message
    });
  }
});

// POST /api/alertes - Créer une nouvelle alerte
router.post('/', requireRole(['Superviseur', 'Administrateur']), [
  body('titre').notEmpty().withMessage('Le titre est requis'),
  body('message').notEmpty().withMessage('Le message est requis'),
  body('type').isIn(['info', 'warning', 'error', 'success']).withMessage('Type d\'alerte invalide'),
  body('priorite').isIn(['basse', 'normale', 'haute', 'critique']).withMessage('Priorité invalide')
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

    console.log('🔍 Création d\'une nouvelle alerte...');
    
    const {
      titre,
      message,
      type,
      priorite,
      utilisateur_id,
      date_echeance,
      statut
    } = req.body;

    const result = await sequelize.query(`
      INSERT INTO tbl_alertes (
        titre, message, type, priorite, utilisateur_id, date_echeance,
        statut, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        titre, message, type, priorite, utilisateur_id || null,
        date_echeance || null, statut || 'active', req.user.id
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✅ Alerte créée avec l\'ID:', result[0]);
    
    res.status(201).json({
      success: true,
      message: 'Alerte créée avec succès',
      id: result[0]
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'alerte',
      error: error.message
    });
  }
});

// PUT /api/alertes/:id - Modifier une alerte
router.put('/:id', requireRole(['Superviseur', 'Administrateur']), [
  body('statut').optional().isIn(['active', 'resolue', 'archivee']).withMessage('Statut invalide')
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

    console.log('🔍 Modification de l\'alerte:', req.params.id);
    
    const {
      titre,
      message,
      type,
      priorite,
      date_echeance,
      statut
    } = req.body;

    await sequelize.query(`
      UPDATE tbl_alertes SET
        titre = ?, message = ?, type = ?, priorite = ?,
        date_echeance = ?, statut = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [
        titre, message, type, priorite,
        date_echeance || null, statut, req.user.id, req.params.id
      ],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Alerte modifiée avec succès');
    
    res.json({
      success: true,
      message: 'Alerte modifiée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la modification de l\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'alerte',
      error: error.message
    });
  }
});

// DELETE /api/alertes/:id - Supprimer une alerte
router.delete('/:id', requireRole(['Superviseur', 'Administrateur']), async (req, res) => {
  try {
    console.log('🔍 Suppression de l\'alerte:', req.params.id);
    
    await sequelize.query(`
      DELETE FROM tbl_alertes WHERE id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.DELETE
    });

    console.log('✅ Alerte supprimée avec succès');
    
    res.json({
      success: true,
      message: 'Alerte supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'alerte',
      error: error.message
    });
  }
});

module.exports = router;