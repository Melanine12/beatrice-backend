const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/encaissements - Récupérer tous les encaissements
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Récupération des encaissements...');
    
    const encaissements = await sequelize.query(`
      SELECT 
        e.id, e.reference, e.montant, e.devise, e.type_paiement, e.statut,
        e.date_paiement, e.beneficiaire, e.description, e.created_at, e.updated_at,
        e.user_guichet_id, e.created_by, e.encaissement_caisse_id,
        u.nom as guichetier_nom, u.prenom as guichetier_prenom
      FROM tbl_encaissements e
      LEFT JOIN tbl_utilisateurs u ON e.user_guichet_id = u.id
      ORDER BY e.date_paiement DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log('✅ Encaissements récupérés:', encaissements.length);
    
    res.json({
      success: true,
      encaissements: encaissements
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des encaissements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des encaissements',
      error: error.message
    });
  }
});

// POST /api/encaissements - Créer un nouvel encaissement
router.post('/', requireRole(['Administrateur', 'Superviseur Comptable', 'Caissier', 'Guichetier']), [
  body('reference').notEmpty().withMessage('La référence est requise'),
  body('montant').isNumeric().withMessage('Le montant doit être numérique'),
  body('devise').notEmpty().withMessage('La devise est requise'),
  body('type_paiement').notEmpty().withMessage('Le type de paiement est requis'),
  body('statut').notEmpty().withMessage('Le statut est requis'),
  body('date_paiement').isISO8601().withMessage('La date de paiement est requise'),
  body('caisse_id').isInt({ min: 1 }).withMessage('La caisse est requise')
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

    console.log('🔍 Création d\'un nouvel encaissement...');
    
    const {
      reference,
      montant,
      devise,
      type_paiement,
      statut,
      date_paiement,
      description,
      beneficiaire,
      utilisateur_id,
      user_guichet_id,
      caisse_id,
      numero_cheque
    } = req.body;

    // Vérifier que la référence est unique
    const existingEncaissement = await sequelize.query(`
      SELECT id FROM tbl_encaissements WHERE reference = ?
    `, {
      replacements: [reference],
      type: sequelize.QueryTypes.SELECT
    });

    if (existingEncaissement.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    // Insérer le nouvel encaissement
    const result = await sequelize.query(`
      INSERT INTO tbl_encaissements (
        reference, montant, devise, type_paiement, statut, date_paiement,
        description, beneficiaire, user_guichet_id, created_by,
        encaissement_caisse_id, numero_transaction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        reference, montant, devise, type_paiement, statut, date_paiement,
        description || null, beneficiaire || null, user_guichet_id || utilisateur_id, req.user.id,
        caisse_id, numero_cheque || null
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✅ Encaissement créé avec l\'ID:', result[0]);
    
    res.status(201).json({
      success: true,
      message: 'Encaissement créé avec succès',
      id: result[0]
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'encaissement',
      error: error.message
    });
  }
});

// PUT /api/encaissements/:id - Modifier un encaissement
router.put('/:id', requireRole(['Administrateur', 'Superviseur Comptable', 'Caissier', 'Guichetier']), [
  body('reference').notEmpty().withMessage('La référence est requise'),
  body('montant').isNumeric().withMessage('Le montant doit être numérique'),
  body('devise').notEmpty().withMessage('La devise est requise'),
  body('type_paiement').notEmpty().withMessage('Le type de paiement est requis'),
  body('statut').notEmpty().withMessage('Le statut est requis'),
  body('date_paiement').isISO8601().withMessage('La date de paiement est requise')
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

    console.log('🔍 Modification de l\'encaissement:', req.params.id);
    
    const {
      reference,
      montant,
      devise,
      type_paiement,
      statut,
      date_paiement,
      description,
      beneficiaire,
      utilisateur_id,
      user_guichet_id,
      caisse_id,
      numero_cheque
    } = req.body;

    // Vérifier que l'encaissement existe et récupérer la caisse actuelle
    const existingEncaissement = await sequelize.query(`
      SELECT id, encaissement_caisse_id FROM tbl_encaissements WHERE id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });

    if (existingEncaissement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    // Vérifier que la référence est unique (sauf pour cet encaissement)
    const duplicateReference = await sequelize.query(`
      SELECT id FROM tbl_encaissements WHERE reference = ? AND id != ?
    `, {
      replacements: [reference, req.params.id],
      type: sequelize.QueryTypes.SELECT
    });

    if (duplicateReference.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    // Déterminer la caisse à utiliser (nouvelle valeur ou valeur existante)
    const encaissementCaisseId = (typeof caisse_id !== 'undefined' && caisse_id !== null) 
      ? caisse_id 
      : existingEncaissement[0].encaissement_caisse_id;

    if (!encaissementCaisseId) {
      return res.status(400).json({
        success: false,
        message: 'La caisse de l\'encaissement est requise'
      });
    }

    // Mettre à jour l'encaissement
    await sequelize.query(`
      UPDATE tbl_encaissements SET
        reference = ?, montant = ?, devise = ?, type_paiement = ?, statut = ?,
        date_paiement = ?, description = ?, beneficiaire = ?, user_guichet_id = ?,
        encaissement_caisse_id = ?, numero_transaction = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [
        reference, montant, devise, type_paiement, statut, date_paiement,
        description || null, beneficiaire || null, user_guichet_id || utilisateur_id,
        encaissementCaisseId, numero_cheque || null,
        req.user.id, req.params.id
      ],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Encaissement modifié avec succès');
    
    res.json({
      success: true,
      message: 'Encaissement modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la modification de l\'encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'encaissement',
      error: error.message
    });
  }
});

// DELETE /api/encaissements/:id - Supprimer un encaissement
router.delete('/:id', requireRole(['Administrateur', 'Superviseur Comptable', 'Caissier', 'Guichetier']), async (req, res) => {
  try {
    console.log('🔍 Suppression de l\'encaissement:', req.params.id);
    
    // Vérifier que l'encaissement existe
    const existingEncaissement = await sequelize.query(`
      SELECT id FROM tbl_encaissements WHERE id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });

    if (existingEncaissement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encaissement non trouvé'
      });
    }

    // Supprimer l'encaissement
    await sequelize.query(`
      DELETE FROM tbl_encaissements WHERE id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.DELETE
    });

    console.log('✅ Encaissement supprimé avec succès');
    
    res.json({
      success: true,
      message: 'Encaissement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'encaissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'encaissement',
      error: error.message
    });
  }
});

module.exports = router;