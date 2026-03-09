const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { SanctionPro, Employe, User } = require('../models');
const CloudinaryDocumentService = require('../services/cloudinaryDocumentService');

// Rôles qui voient toutes les demandes
const ROLES_VOIR_TOUT = ['Patron', 'Administrateur', 'Superviseur RH', 'Auditeur'];
// Rôles qui peuvent créer une demande
const ROLES_CREER = ['Superviseur', 'Patron', 'Administrateur'];
// Rôles qui peuvent valider / faire avancer le circuit
const ROLES_RH_ETAPE = ['Superviseur RH', 'Patron', 'Administrateur'];

const canSeeAll = (user) => user && ROLES_VOIR_TOUT.includes(user.role);
const canCreate = (user) => user && ROLES_CREER.includes(user.role);
const canManageEtape = (user) => user && ROLES_RH_ETAPE.includes(user.role);

const CLOUDINARY_FOLDER = 'hotel-beatrice/sanctions-pro';

// Multer : stockage temporaire (fichiers envoyés vers Cloudinary puis supprimés)
const uploadDir = path.join(__dirname, '../../uploads/temp/sanctions-pro');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `sanction_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(file.originalname)) return cb(null, true);
    cb(new Error('Type de fichier non autorisé. Autorisés: pdf, doc, docx, xls, xlsx, images.'), false);
  }
});

async function uploadFileToCloudinary(file, key) {
  const docService = new CloudinaryDocumentService();
  const result = await docService.uploadDocument(file.path, CLOUDINARY_FOLDER);
  try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  if (!result.success) throw new Error(result.error || 'Upload Cloudinary échoué');
  return { url: result.url, nom: file.originalname };
}

const uploadCreation = upload.fields([
  { name: 'piece_1', maxCount: 1 },
  { name: 'piece_2', maxCount: 1 },
  { name: 'piece_3', maxCount: 1 }
]);

const uploadEtape = upload.fields([
  { name: 'lettre_convocation', maxCount: 1 },
  { name: 'proces_verbal', maxCount: 1 },
  { name: 'lettre_notification', maxCount: 1 }
]);

function buildWhereList(req) {
  const where = {};
  const { statut, statuts, type_sanction, employe_id, demandeur_id, date_debut, date_fin, search } = req.query;
  if (statuts) {
    const list = statuts.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length) where.statut = { [Op.in]: list };
  } else if (statut) where.statut = statut;
  if (type_sanction) where.type_sanction = type_sanction;
  if (employe_id) where.employe_id = employe_id;
  if (demandeur_id) where.demandeur_id = demandeur_id;
  if (date_debut || date_fin) {
    where.date_incident = {};
    if (date_debut) where.date_incident[Op.gte] = date_debut;
    if (date_fin) where.date_incident[Op.lte] = date_fin;
  }
  if (!canSeeAll(req.user)) {
    where.demandeur_id = req.user.id;
  }
  return where;
}

// GET /api/sanctions-pro/stats — avant /:id
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const where = buildWhereList(req);
    const total = await SanctionPro.count({ where });

    const parType = {};
    for (const t of SanctionPro.TYPE_SANCTION) {
      parType[t] = await SanctionPro.count({ where: { ...where, type_sanction: t } });
    }
    const parStatut = {};
    for (const s of SanctionPro.STATUTS) {
      parStatut[s] = await SanctionPro.count({ where: { ...where, statut: s } });
    }

    res.json({
      success: true,
      data: { total, par_type_sanction: parType, par_statut: parStatut }
    });
  } catch (err) {
    console.error('Erreur stats sanctions-pro:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/sanctions-pro/ — liste paginée
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = buildWhereList(req);

    if (search && search.trim()) {
      const ids = await SanctionPro.findAll({
        attributes: ['id'],
        where,
        include: [
          { model: Employe, as: 'employe', attributes: ['id'], where: {
            [Op.or]: [
              { nom_famille: { [Op.like]: `%${search.trim()}%` } },
              { prenoms: { [Op.like]: `%${search.trim()}%` } },
              { matricule: { [Op.like]: `%${search.trim()}%` } }
            ]
          }, required: true }
        ]
      }).then(rows => rows.map(r => r.id));
      where.id = ids.length ? { [Op.in]: ids } : { [Op.in]: [] };
    }

    const { count, rows } = await SanctionPro.findAndCountAll({
      where,
      include: [
        { model: Employe, as: 'employe', attributes: ['id', 'nom_famille', 'prenoms', 'matricule', 'poste'] },
        { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom'] },
        { model: User, as: 'validateur', attributes: ['id', 'nom', 'prenom'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Math.min(100, parseInt(limit) || 20),
      offset: (Math.max(1, parseInt(page)) - 1) * (parseInt(limit) || 20)
    });

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, pages: Math.ceil(count / (parseInt(limit) || 20)) }
    });
  } catch (err) {
    console.error('Erreur liste sanctions-pro:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/sanctions-pro/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const row = await SanctionPro.findByPk(req.params.id, {
      include: [
        { model: Employe, as: 'employe' },
        { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'email'] },
        { model: User, as: 'validateur', attributes: ['id', 'nom', 'prenom'] },
        { model: User, as: 'validationDirection', attributes: ['id', 'nom', 'prenom'] }
      ]
    });
    if (!row) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (!canSeeAll(req.user) && row.demandeur_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('Erreur détail sanctions-pro:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/sanctions-pro/ — création
router.post('/',
  authenticateToken,
  requireRole(ROLES_CREER),
  uploadCreation,
  [
    body('employe_id').isInt({ min: 1 }),
    body('type_sanction').isIn(SanctionPro.TYPE_SANCTION),
    body('motif').isLength({ min: 10, max: 2000 }),
    body('description').optional().isLength({ max: 5000 }),
    body('date_incident').isISO8601().toDate(),
    body('duree_suspension').optional().isInt({ min: 1, max: 8 }),
    body('date_debut_suspension').optional().isISO8601().toDate(),
    body('montant_amende').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Données invalides', errors: errors.array() });
      }
      const payload = {
        employe_id: parseInt(req.body.employe_id),
        type_sanction: req.body.type_sanction,
        motif: req.body.motif,
        description: req.body.description || null,
        date_incident: req.body.date_incident,
        duree_suspension: req.body.duree_suspension ? parseInt(req.body.duree_suspension) : null,
        date_debut_suspension: req.body.date_debut_suspension || null,
        montant_amende: req.body.montant_amende != null ? parseFloat(req.body.montant_amende) : null,
        statut: 'en_attente',
        demandeur_id: req.user.id
      };
      const documents = {};
      const uploads = [];
      ['piece_1', 'piece_2', 'piece_3'].forEach((key) => {
        const f = req.files && req.files[key] && req.files[key][0];
        if (f) uploads.push({ key, file: f });
      });
      for (const { key, file } of uploads) {
        documents[key] = await uploadFileToCloudinary(file, key);
      }
      if (Object.keys(documents).length) payload.documents = documents;

      const created = await SanctionPro.create(payload);
      const withAssoc = await SanctionPro.findByPk(created.id, {
        include: [
          { model: Employe, as: 'employe', attributes: ['id', 'nom_famille', 'prenoms', 'matricule'] },
          { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom'] }
        ]
      });
      res.status(201).json({ success: true, message: 'Demande créée', data: withAssoc });
    } catch (err) {
      console.error('Erreur création sanction-pro:', err);
      res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
    }
  }
);

// PUT /api/sanctions-pro/:id — modification (uniquement si en_attente)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const row = await SanctionPro.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (row.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Modification autorisée uniquement pour une demande en attente' });
    }
    const canEdit = row.demandeur_id === req.user.id || ['Patron', 'Administrateur'].includes(req.user.role);
    if (!canEdit) return res.status(403).json({ success: false, message: 'Accès refusé' });

    const allowed = ['type_sanction', 'motif', 'description', 'date_incident', 'duree_suspension', 'date_debut_suspension', 'montant_amende'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    if (req.body.motif !== undefined) update.motif = req.body.motif;
    await row.update(update);
    const withAssoc = await SanctionPro.findByPk(row.id, {
      include: [
        { model: Employe, as: 'employe' },
        { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom'] },
        { model: User, as: 'validateur', attributes: ['id', 'nom', 'prenom'] }
      ]
    });
    res.json({ success: true, message: 'Demande mise à jour', data: withAssoc });
  } catch (err) {
    console.error('Erreur PUT sanctions-pro:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/sanctions-pro/:id/status — approuve / rejete (statut actuel = en_attente)
router.put('/:id/status',
  authenticateToken,
  requireRole(ROLES_RH_ETAPE),
  [
    body('statut').isIn(['approuve', 'rejete']),
    body('commentaire_rh').optional().isLength({ max: 2000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
      const row = await SanctionPro.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
      if (row.statut !== 'en_attente') {
        return res.status(400).json({ success: false, message: 'Seules les demandes en attente peuvent être approuvées ou rejetées via cette route' });
      }
      await row.update({
        statut: req.body.statut,
        commentaire_rh: req.body.commentaire_rh || null,
        date_validation: new Date(),
        validateur_id: req.user.id
      });
      const withAssoc = await SanctionPro.findByPk(row.id, {
        include: [
          { model: Employe, as: 'employe' },
          { model: User, as: 'demandeur' },
          { model: User, as: 'validateur' }
        ]
      });
      res.json({ success: true, message: `Demande ${req.body.statut === 'approuve' ? 'approuvée' : 'rejetée'}`, data: withAssoc });
    } catch (err) {
      console.error('Erreur status sanctions-pro:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/sanctions-pro/:id/etape — avancement du circuit
router.put('/:id/etape',
  authenticateToken,
  requireRole(ROLES_RH_ETAPE),
  uploadEtape,
  async (req, res) => {
    try {
      const row = await SanctionPro.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Demande non trouvée' });

      const etape = req.body.etape; // analyse_rh | convocation | entretien | decision | notification | cloture | classement_sans_suite
      if (!etape) return res.status(400).json({ success: false, message: 'Champ etape requis' });

      let newStatut = null;
      const updates = { validateur_id: req.user.id };
      const docs = row.documents && typeof row.documents === 'object' ? { ...row.documents } : {};

      if (etape === 'analyse_rh' && row.statut === 'en_attente') {
        newStatut = 'en_analyse_rh';
      } else if (etape === 'classement_sans_suite' && ['en_attente', 'en_analyse_rh'].includes(row.statut)) {
        newStatut = 'classement_sans_suite';
        if (req.body.commentaire_rh) updates.commentaire_rh = req.body.commentaire_rh;
      } else if (etape === 'convocation' && row.statut === 'en_analyse_rh') {
        newStatut = 'convocation_envoyee';
        updates.date_convocation = req.body.date_convocation || new Date().toISOString().split('T')[0];
        const f = req.files && req.files.lettre_convocation && req.files.lettre_convocation[0];
        if (f) docs.lettre_convocation = await uploadFileToCloudinary(f, 'lettre_convocation');
      } else if (etape === 'entretien' && row.statut === 'convocation_envoyee') {
        newStatut = 'entretien_realise';
        updates.date_entretien = req.body.date_entretien || new Date().toISOString().split('T')[0];
        const f = req.files && req.files.proces_verbal && req.files.proces_verbal[0];
        if (f) docs.proces_verbal = await uploadFileToCloudinary(f, 'proces_verbal');
      } else if (etape === 'decision' && row.statut === 'entretien_realise') {
        newStatut = 'sanction_validee';
        updates.date_decision = req.body.date_decision || new Date().toISOString().split('T')[0];
        if (req.body.type_sanction && SanctionPro.TYPE_SANCTION.includes(req.body.type_sanction)) updates.type_sanction = req.body.type_sanction;
        if (req.body.niveau_gravite && SanctionPro.NIVEAU_GRAVITE.includes(req.body.niveau_gravite)) updates.niveau_gravite = req.body.niveau_gravite;
        if (req.body.commentaire_rh) updates.commentaire_rh = req.body.commentaire_rh;
        if (req.body.validation_direction_id !== undefined) updates.validation_direction_id = req.body.validation_direction_id || null;
      } else if (etape === 'notification' && row.statut === 'sanction_validee') {
        newStatut = 'sanction_notifiee';
        updates.date_notification = req.body.date_notification || new Date().toISOString().split('T')[0];
        const f = req.files && req.files.lettre_notification && req.files.lettre_notification[0];
        if (f) docs.lettre_notification = await uploadFileToCloudinary(f, 'lettre_notification');
      } else if (etape === 'cloture' && row.statut === 'sanction_notifiee') {
        newStatut = 'dossier_cloture';
        updates.date_cloture = req.body.date_cloture || new Date().toISOString().split('T')[0];
      }

      if (!newStatut) {
        return res.status(400).json({
          success: false,
          message: `Transition non autorisée: statut actuel "${row.statut}", étape "${etape}"`
        });
      }

      updates.statut = newStatut;
      if (Object.keys(docs).length) updates.documents = docs;
      await row.update(updates);

      const withAssoc = await SanctionPro.findByPk(row.id, {
        include: [
          { model: Employe, as: 'employe' },
          { model: User, as: 'demandeur' },
          { model: User, as: 'validateur' }
        ]
      });
      res.json({ success: true, message: 'Étape enregistrée', data: withAssoc });
    } catch (err) {
      console.error('Erreur étape sanctions-pro:', err);
      res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
    }
  }
);

// DELETE /api/sanctions-pro/:id — uniquement si en_attente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const row = await SanctionPro.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (row.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Suppression autorisée uniquement pour une demande en attente' });
    }
    const canDelete = row.demandeur_id === req.user.id || ['Patron', 'Administrateur'].includes(req.user.role);
    if (!canDelete) return res.status(403).json({ success: false, message: 'Accès refusé' });
    await row.destroy();
    res.json({ success: true, message: 'Demande supprimée' });
  } catch (err) {
    console.error('Erreur DELETE sanctions-pro:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
