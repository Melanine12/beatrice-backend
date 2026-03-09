const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { EmployeUser, Employe, User } = require('../models');

const ROLES_LIAISON = ['Superviseur RH', 'Administrateur', 'Patron'];

const includeUser = { model: User, as: 'user', attributes: ['id', 'nom', 'prenom', 'email', 'role'] };
const includeEmploye = { model: Employe, as: 'employe', attributes: ['id', 'prenoms', 'nom_famille', 'matricule'] };

// GET /api/employe-utilisateur/list — toutes les liaisons (pour exclure les utilisateurs déjà liés)
router.get('/list', authenticateToken, requireRole(ROLES_LIAISON), async (req, res) => {
  try {
    const list = await EmployeUser.findAll({
      include: [includeUser, includeEmploye],
      order: [['id', 'ASC']]
    });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Erreur list employe-utilisateur:', err);
    res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
});

// GET /api/employe-utilisateur?employe_id=X ou ?user_id=Y — une seule liaison
router.get('/', authenticateToken, async (req, res) => {
  try {
    const employe_id = req.query.employe_id ? parseInt(req.query.employe_id, 10) : null;
    const user_id = req.query.user_id ? parseInt(req.query.user_id, 10) : null;

    if (employe_id && user_id) {
      return res.status(400).json({ success: false, message: 'Indiquer uniquement employe_id ou user_id' });
    }
    if (!employe_id && !user_id) {
      return res.status(400).json({ success: false, message: 'employe_id ou user_id requis' });
    }
    if ((employe_id && employe_id < 1) || (user_id && user_id < 1)) {
      return res.status(400).json({ success: false, message: 'employe_id et user_id doivent être >= 1' });
    }

    const where = employe_id ? { employe_id } : { user_id };
    const liaison = await EmployeUser.findOne({
      where,
      include: [includeUser, includeEmploye]
    });
    res.json({ success: true, data: liaison });
  } catch (err) {
    console.error('Erreur get employe-utilisateur:', err);
    res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
});

// POST /api/employe-utilisateur — créer une liaison
router.post('/',
  authenticateToken,
  requireRole(ROLES_LIAISON),
  [
    body('employe_id').isInt({ min: 1 }),
    body('user_id').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'employe_id et user_id obligatoires (entiers >= 1)', errors: errors.array() });
      }
      const { employe_id, user_id } = req.body;

      const existingByEmploye = await EmployeUser.findOne({ where: { employe_id } });
      if (existingByEmploye) {
        return res.status(409).json({ success: false, message: 'Cet employé est déjà lié à un utilisateur.' });
      }
      const existingByUser = await EmployeUser.findOne({ where: { user_id } });
      if (existingByUser) {
        return res.status(409).json({ success: false, message: 'Cet utilisateur est déjà lié à un employé.' });
      }

      const liaison = await EmployeUser.create({ employe_id, user_id });
      const withAssoc = await EmployeUser.findByPk(liaison.id, { include: [includeUser, includeEmploye] });
      res.status(201).json({ success: true, message: 'Liaison créée', data: withAssoc });
    } catch (err) {
      console.error('Erreur POST employe-utilisateur:', err);
      res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
    }
  }
);

// DELETE /api/employe-utilisateur?employe_id=X — supprimer la liaison pour cet employé
router.delete('/', authenticateToken, requireRole(ROLES_LIAISON), [
  query('employe_id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'employe_id obligatoire (entier >= 1)' });
    }
    const employe_id = parseInt(req.query.employe_id, 10);
    const deleted = await EmployeUser.destroy({ where: { employe_id } });
    if (deleted === 0) {
      return res.status(404).json({ success: false, message: 'Aucune liaison pour cet employé' });
    }
    res.json({ success: true, message: 'Liaison supprimée' });
  } catch (err) {
    console.error('Erreur DELETE employe-utilisateur:', err);
    res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
});

module.exports = router;
