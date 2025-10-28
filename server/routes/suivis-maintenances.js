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
        c.numero as chambre_numero,
        c.type as chambre_type,
        u_resp.nom as responsable_nom,
        u_resp.prenom as responsable_prenom,
        u_creat.nom as createur_nom,
        u_creat.prenom as createur_prenom
      FROM tbl_suivi_maintenances sm
      LEFT JOIN tbl_chambres c ON sm.chambre_id = c.id
      LEFT JOIN tbl_utilisateurs u_resp ON sm.responsable_id = u_resp.id
      LEFT JOIN tbl_utilisateurs u_creat ON sm.createur_id = u_creat.id
      ORDER BY sm.date_creation DESC
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
router.post('/', requireRole(['Superviseur', 'Agent de maintenance', 'Administrateur']), [
  body('titre').notEmpty().withMessage('Le titre est requis'),
  body('type').isIn(['Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective']).withMessage('Type invalide'),
  body('priorite').isIn(['Basse', 'Normale', 'Haute', 'Urgente']).withMessage('Priorité invalide'),
  body('statut').isIn(['Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée']).withMessage('Statut invalide'),
  body('createur_id').isInt({ min: 1 }).withMessage('ID créateur requis')
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
      titre,
      description,
      type,
      priorite,
      statut,
      responsable_id,
      chambre_id,
      createur_id,
      date_planifiee,
      date_debut,
      date_fin,
      cout_estime,
      cout_reel,
      materiel_utilise,
      notes
    } = req.body;

    const result = await sequelize.query(`
      INSERT INTO tbl_suivi_maintenances (
        titre, description, type, priorite, statut, responsable_id, chambre_id,
        createur_id, date_planifiee, date_debut, date_fin, cout_estime, cout_reel,
        materiel_utilise, notes, date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, {
      replacements: [
        titre, description || null, type, priorite, statut,
        responsable_id || null, chambre_id || null, createur_id,
        date_planifiee || null, date_debut || null, date_fin || null,
        cout_estime || null, cout_reel || null, materiel_utilise || null,
        notes || null
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
router.put('/:id', requireRole(['Superviseur', 'Agent de maintenance', 'Administrateur']), [
  body('statut').optional().isIn(['Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée']).withMessage('Statut invalide')
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
      titre,
      description,
      type,
      priorite,
      statut,
      responsable_id,
      chambre_id,
      date_planifiee,
      date_debut,
      date_fin,
      cout_estime,
      cout_reel,
      materiel_utilise,
      notes
    } = req.body;

    await sequelize.query(`
      UPDATE tbl_suivi_maintenances SET
        titre = ?, description = ?, type = ?, priorite = ?, statut = ?,
        responsable_id = ?, chambre_id = ?, date_planifiee = ?, date_debut = ?,
        date_fin = ?, cout_estime = ?, cout_reel = ?, materiel_utilise = ?,
        notes = ?, date_modification = NOW()
      WHERE id = ?
    `, {
      replacements: [
        titre, description || null, type, priorite, statut,
        responsable_id || null, chambre_id || null, date_planifiee || null,
        date_debut || null, date_fin || null, cout_estime || null,
        cout_reel || null, materiel_utilise || null, notes || null,
        req.params.id
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