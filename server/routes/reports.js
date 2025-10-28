const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Models that use factory pattern
const CheckLinge = require('../models/CheckLinge')(sequelize);
const Pointage = require('../models/Pointage')(sequelize);
const NettoyageChambre = require('../models/NettoyageChambre')(sequelize);

// Models that are imported directly
const DemandeAffectation = require('../models/DemandeAffectation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', [
  query('date').optional().isISO8601().withMessage('Date invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const dateParam = req.query.date || new Date().toISOString().split('T')[0];

    // Build day range for DATETIME/TIMESTAMP fields
    const [year, month, day] = dateParam.split('-').map(n => parseInt(n, 10));
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    // Collect daily metrics in parallel
    const [
      checkLinges,
      employesPresents,
      chambresNettoyees,
      bonsPrelevementApprouves
    ] = await Promise.all([
      // Check linges mis à jour ce jour (par updated_at)
      (async () => {
        try {
          return await CheckLinge.count({
            where: {
              updated_at: { [Op.between]: [startOfDay, endOfDay] }
            }
          });
        } catch (e) { return 0; }
      })(),

      // Employés présents ce jour (DATEONLY)
      (async () => {
        try {
          return await Pointage.count({
            where: {
              present: true,
              date_pointage: dateParam
            }
          });
        } catch (e) { return 0; }
      })(),

      // Chambres nettoyées validées ce jour (par date_nettoyage & statut)
      (async () => {
        try {
          return await NettoyageChambre.count({
            where: {
              date_nettoyage: dateParam,
              statut: 'Validé'
            }
          });
        } catch (e) { return 0; }
      })(),

      // Bons de prélèvements approuvés ce jour (DemandeAffectation statut approuvee)
      (async () => {
        try {
          return await DemandeAffectation.count({
            where: {
              statut: 'approuvee',
              created_at: { [Op.between]: [startOfDay, endOfDay] }
            }
          });
        } catch (e) { return 0; }
      })()
    ]);

    return res.json({
      success: true,
      date: dateParam,
      data: {
        check_linges_mis_a_jour: checkLinges,
        employes_presents: employesPresents,
        chambres_nettoyees_validees: chambresNettoyees,
        bons_prelevement_approuves: bonsPrelevementApprouves
      }
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport journalier'
    });
  }
});

module.exports = router;


