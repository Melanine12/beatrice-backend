const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { Resend } = require('resend');

const router = express.Router();
router.use(authenticateToken);

const ALLOWED_TYPES = ['Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective'];
const ALLOWED_PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'];
const ALLOWED_FREQUENCE_UNITES = ['jours', 'semaines', 'mois'];
const CRUD_ROLES = ['Superviseur', 'Agent de maintenance', 'Administrateur', 'Patron'];

const computeNextExecution = (startDate, valeur, unite) => {
  const base = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  const next = new Date(base);
  const step = Math.max(1, parseInt(valeur, 10) || 1);
  if (unite === 'jours') next.setDate(next.getDate() + step);
  if (unite === 'semaines') next.setDate(next.getDate() + (step * 7));
  if (unite === 'mois') next.setMonth(next.getMonth() + step);
  return next.toISOString().split('T')[0];
};

const sendCreationEmails = async (emails, row) => {
  if (!emails || emails.length === 0) return { sent: 0, skipped: true };
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: true, reason: 'RESEND_API_KEY manquante' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const freqText = `tous les ${row.frequence_valeur} ${row.frequence_unite}`;

  const { data, error } = await resend.emails.send({
    from,
    to: emails,
    subject: `Nouvelle maintenance récurrente: ${row.titre}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2 style="margin:0 0 12px">Nouvelle maintenance récurrente</h2>
        <p><strong>Titre:</strong> ${row.titre}</p>
        <p><strong>Type:</strong> ${row.type}</p>
        <p><strong>Priorité:</strong> ${row.priorite}</p>
        <p><strong>Fréquence:</strong> ${freqText}</p>
        <p><strong>Prochaine exécution:</strong> ${row.prochaine_execution || '-'}</p>
        <p><strong>Description:</strong> ${row.description || '-'}</p>
      </div>
    `
  });

  if (error) {
    return { sent: 0, skipped: false, reason: error.message || 'Erreur Resend' };
  }
  return { sent: Array.isArray(data) ? data.length : emails.length, skipped: false };
};

router.get('/', async (req, res) => {
  try {
    const rows = await sequelize.query(`
      SELECT
        mr.*,
        u.nom AS createur_nom,
        u.prenom AS createur_prenom
      FROM tbl_maintenances_recurrentes mr
      LEFT JOIN tbl_utilisateurs u ON u.id = mr.createur_id
      ORDER BY mr.created_at DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur GET maintenances-recurrentes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/',
  requireRole(CRUD_ROLES),
  [
    body('titre').notEmpty().withMessage('Titre requis'),
    body('type').isIn(ALLOWED_TYPES),
    body('priorite').isIn(ALLOWED_PRIORITES),
    body('frequence_unite').isIn(ALLOWED_FREQUENCE_UNITES),
    body('frequence_valeur').isInt({ min: 1 }),
    body('destinataires_emails').optional().isArray(),
    body('destinataires_emails.*').optional().isEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Données invalides', errors: errors.array() });
      }

      const {
        titre,
        description,
        type,
        priorite,
        frequence_unite,
        frequence_valeur,
        date_debut,
        date_fin,
        actif,
        destinataires_emails = []
      } = req.body;

      const prochaine_execution = computeNextExecution(date_debut, frequence_valeur, frequence_unite);
      const emailsJson = JSON.stringify((destinataires_emails || []).filter(Boolean));

      const insertResult = await sequelize.query(`
        INSERT INTO tbl_maintenances_recurrentes
        (titre, description, type, priorite, frequence_unite, frequence_valeur, date_debut, date_fin, prochaine_execution, destinataires_emails, actif, createur_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          titre,
          description || null,
          type,
          priorite,
          frequence_unite,
          parseInt(frequence_valeur, 10),
          date_debut || null,
          date_fin || null,
          prochaine_execution || null,
          emailsJson,
          actif === false ? 0 : 1,
          req.user.id
        ],
        type: sequelize.QueryTypes.INSERT
      });
      const insertedId = Array.isArray(insertResult) ? insertResult[0] : insertResult;

      const [row] = await sequelize.query(`
        SELECT * FROM tbl_maintenances_recurrentes WHERE id = ?
      `, { replacements: [insertedId], type: sequelize.QueryTypes.SELECT });

      const emailResult = await sendCreationEmails(destinataires_emails, row);
      res.status(201).json({
        success: true,
        message: 'Maintenance récurrente créée',
        data: row,
        email_result: emailResult
      });
    } catch (error) {
      console.error('Erreur POST maintenances-recurrentes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

router.put('/:id',
  requireRole(CRUD_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('titre').notEmpty().withMessage('Titre requis'),
    body('type').isIn(ALLOWED_TYPES),
    body('priorite').isIn(ALLOWED_PRIORITES),
    body('frequence_unite').isIn(ALLOWED_FREQUENCE_UNITES),
    body('frequence_valeur').isInt({ min: 1 }),
    body('destinataires_emails').optional().isArray(),
    body('destinataires_emails.*').optional().isEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Données invalides', errors: errors.array() });
      }

      const id = parseInt(req.params.id, 10);
      const {
        titre,
        description,
        type,
        priorite,
        frequence_unite,
        frequence_valeur,
        date_debut,
        date_fin,
        actif,
        destinataires_emails = []
      } = req.body;

      const prochaine_execution = computeNextExecution(date_debut, frequence_valeur, frequence_unite);
      const emailsJson = JSON.stringify((destinataires_emails || []).filter(Boolean));

      await sequelize.query(`
        UPDATE tbl_maintenances_recurrentes
        SET titre = ?, description = ?, type = ?, priorite = ?, frequence_unite = ?, frequence_valeur = ?, date_debut = ?, date_fin = ?, prochaine_execution = ?, destinataires_emails = ?, actif = ?, updated_at = NOW()
        WHERE id = ?
      `, {
        replacements: [
          titre,
          description || null,
          type,
          priorite,
          frequence_unite,
          parseInt(frequence_valeur, 10),
          date_debut || null,
          date_fin || null,
          prochaine_execution || null,
          emailsJson,
          actif === false ? 0 : 1,
          id
        ],
        type: sequelize.QueryTypes.UPDATE
      });

      const [row] = await sequelize.query(`
        SELECT * FROM tbl_maintenances_recurrentes WHERE id = ?
      `, { replacements: [id], type: sequelize.QueryTypes.SELECT });

      res.json({ success: true, message: 'Maintenance récurrente mise à jour', data: row });
    } catch (error) {
      console.error('Erreur PUT maintenances-recurrentes:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

router.delete('/:id', requireRole(['Superviseur', 'Administrateur', 'Patron']), [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'ID invalide', errors: errors.array() });
    }
    const id = parseInt(req.params.id, 10);
    await sequelize.query(`DELETE FROM tbl_maintenances_recurrentes WHERE id = ?`, {
      replacements: [id],
      type: sequelize.QueryTypes.DELETE
    });
    res.json({ success: true, message: 'Maintenance récurrente supprimée' });
  } catch (error) {
    console.error('Erreur DELETE maintenances-recurrentes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
