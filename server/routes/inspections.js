const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

const CREATE_ROLES = ['Superviseur', 'Agent de maintenance', 'Administrateur', 'Patron'];

router.post('/',
  requireRole(CREATE_ROLES),
  [
    body('maintenance_recurrente_id').isInt({ min: 1 }),
    body('utilisateur_id').isInt({ min: 1 }),
    body('date_heure_inspection').notEmpty().isISO8601(),
    body('observations').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Données invalides', errors: errors.array() });
      }

      const {
        maintenance_recurrente_id,
        utilisateur_id,
        date_heure_inspection,
        observations
      } = req.body;

      const [maintenance] = await sequelize.query(
        'SELECT id, titre FROM tbl_maintenances_recurrentes WHERE id = ?',
        { replacements: [maintenance_recurrente_id], type: sequelize.QueryTypes.SELECT }
      );
      if (!maintenance) {
        return res.status(404).json({ success: false, message: 'Maintenance récurrente non trouvée' });
      }

      const [utilisateur] = await sequelize.query(
        'SELECT id FROM tbl_utilisateurs WHERE id = ?',
        { replacements: [utilisateur_id], type: sequelize.QueryTypes.SELECT }
      );
      if (!utilisateur) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      const insertResult = await sequelize.query(`
        INSERT INTO tbl_inspections
        (maintenance_recurrente_id, maintenance_recurrente_titre, utilisateur_id, date_heure_inspection, observations, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          parseInt(maintenance_recurrente_id, 10),
          maintenance.titre,
          parseInt(utilisateur_id, 10),
          date_heure_inspection,
          observations || null,
          req.user.id
        ],
        type: sequelize.QueryTypes.INSERT
      });

      await sequelize.query(`
        UPDATE tbl_maintenances_recurrentes
        SET is_inspected = 1, updated_at = NOW()
        WHERE id = ?
      `, {
        replacements: [parseInt(maintenance_recurrente_id, 10)],
        type: sequelize.QueryTypes.UPDATE
      });

      const insertedId = Array.isArray(insertResult) ? insertResult[0] : insertResult;
      const [created] = await sequelize.query(
        'SELECT * FROM tbl_inspections WHERE id = ?',
        { replacements: [insertedId], type: sequelize.QueryTypes.SELECT }
      );

      res.status(201).json({ success: true, message: 'Inspection créée avec succès', data: created });
    } catch (error) {
      console.error('Erreur POST inspections:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

module.exports = router;
