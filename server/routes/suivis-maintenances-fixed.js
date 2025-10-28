const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { SuiviMaintenance, User, Chambre, Alerte } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Middleware pour créer des alertes automatiques
const createMaintenanceAlert = async (type, maintenance, user, extraData = {}) => {
  try {
    const alertConfigs = {
      'maintenance_created': {
        titre: 'Nouvelle maintenance créée',
        message: `Une nouvelle maintenance "${maintenance.titre}" a été créée`,
        priorite: maintenance.priorite === 'Urgente' ? 'Urgente' : 'Normale'
      },
      'maintenance_updated': {
        titre: 'Maintenance modifiée',
        message: `La maintenance "${maintenance.titre}" a été modifiée`,
        priorite: 'Normale'
      },
      'maintenance_completed': {
        titre: 'Maintenance terminée',
        message: `La maintenance "${maintenance.titre}" a été terminée`,
        priorite: 'Normale'
      },
      'maintenance_cancelled': {
        titre: 'Maintenance annulée',
        message: `La maintenance "${maintenance.titre}" a été annulée`,
        priorite: 'Haute'
      },
      'maintenance_due_soon': {
        titre: 'Maintenance prévue bientôt',
        message: `La maintenance "${maintenance.titre}" est prévue pour le ${new Date(maintenance.date_planifiee).toLocaleDateString()}`,
        priorite: 'Haute'
      },
      'maintenance_overdue': {
        titre: 'Maintenance en retard',
        message: `La maintenance "${maintenance.titre}" est en retard depuis le ${new Date(maintenance.date_planifiee).toLocaleDateString()}`,
        priorite: 'Urgente'
      }
    };

    const config = alertConfigs[type];
    if (!config) return;

    // Créer l'alerte pour le responsable si différent du créateur
    if (maintenance.responsable_id && maintenance.responsable_id !== user.id) {
      await Alerte.create({
        type,
        titre: config.titre,
        message: config.message,
        priorite: config.priorite,
        destinataire_id: maintenance.responsable_id,
        maintenance_id: maintenance.id,
        donnees_extra: extraData
      });
    }

    // Créer l'alerte pour les superviseurs techniques
    const superviseursTechniques = await User.findAll({
      where: { role: 'Superviseur Technique' }
    });

    for (const superviseur of superviseursTechniques) {
      if (superviseur.id !== user.id && superviseur.id !== maintenance.responsable_id) {
        await Alerte.create({
          type,
          titre: config.titre,
          message: config.message,
          priorite: config.priorite,
          destinataire_id: superviseur.id,
          maintenance_id: maintenance.id,
          donnees_extra: extraData
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
  }
};

// GET /api/suivis-maintenances - Lister les maintenances
router.get('/', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('statut').optional().isIn(['Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée']),
  query('priorite').optional().isIn(['Basse', 'Normale', 'Haute', 'Urgente']),
  query('type').optional().isIn(['Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective']),
  query('responsable_id').optional().isInt(),
  query('chambre_id').optional().isInt(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Filtres
    if (req.query.statut) whereClause.statut = req.query.statut;
    if (req.query.priorite) whereClause.priorite = req.query.priorite;
    if (req.query.type) whereClause.type = req.query.type;
    if (req.query.responsable_id) whereClause.responsable_id = req.query.responsable_id;
    if (req.query.chambre_id) whereClause.chambre_id = req.query.chambre_id;

    // Recherche textuelle
    if (req.query.search) {
      whereClause[Op.or] = [
        { titre: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const { count, rows: maintenances } = await SuiviMaintenance.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'responsable', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: User, as: 'createur', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
      ],
      order: [['date_creation', 'DESC']],
      limit,
      offset
    });

    res.json({
      maintenances,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/suivis-maintenances/:id - Récupérer une maintenance
router.get('/:id', requireAuth, [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenance = await SuiviMaintenance.findByPk(req.params.id, {
      include: [
        { model: User, as: 'responsable', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: User, as: 'createur', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] },
        { model: Alerte, as: 'alertes', limit: 5, order: [['date_creation', 'DESC']] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erreur lors de la récupération de la maintenance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/suivis-maintenances - Créer une maintenance
router.post('/', requireAuth, requireRole(['Superviseur Technique', 'Superviseur', 'Administrateur', 'Patron']), [
  body('titre').notEmpty().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('type').isIn(['Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective']),
  body('priorite').isIn(['Basse', 'Normale', 'Haute', 'Urgente']),
  body('statut').isIn(['Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée']),
  body('responsable_id').optional().isInt(),
  body('chambre_id').optional().isInt(),
  body('date_planifiee').optional().isISO8601().toDate(),
  body('date_debut').optional().isISO8601().toDate(),
  body('date_fin').optional().isISO8601().toDate(),
  body('cout_estime').optional().isDecimal(),
  body('materiel_utilise').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenanceData = {
      ...req.body,
      createur_id: req.user.id
    };

    const maintenance = await SuiviMaintenance.create(maintenanceData);

    // Charger les relations pour l'alerte
    await maintenance.reload({
      include: [
        { model: User, as: 'responsable' },
        { model: User, as: 'createur' },
        { model: Chambre, as: 'chambre' }
      ]
    });

    // Créer une alerte
    await createMaintenanceAlert('maintenance_created', maintenance, req.user);

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Erreur lors de la création de la maintenance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/suivis-maintenances/:id - Modifier une maintenance
router.put('/:id', requireAuth, [
  param('id').isInt(),
  body('titre').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('type').optional().isIn(['Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective']),
  body('priorite').optional().isIn(['Basse', 'Normale', 'Haute', 'Urgente']),
  body('statut').optional().isIn(['Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée']),
  body('responsable_id').optional().isInt(),
  body('chambre_id').optional().isInt(),
  body('date_planifiee').optional().isISO8601().toDate(),
  body('date_debut').optional().isISO8601().toDate(),
  body('date_fin').optional().isISO8601().toDate(),
  body('cout_estime').optional().isDecimal(),
  body('cout_reel').optional().isDecimal(),
  body('materiel_utilise').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenance = await SuiviMaintenance.findByPk(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée' });
    }

    // Vérifier les permissions
    const canEdit = req.user.role === 'Administrateur' || 
                   req.user.role === 'Patron' ||
                   req.user.role === 'Superviseur Technique' ||
                   maintenance.createur_id === req.user.id ||
                   maintenance.responsable_id === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    const oldStatus = maintenance.statut;
    const oldResponsable = maintenance.responsable_id;

    await maintenance.update(req.body);

    // Charger les relations pour l'alerte
    await maintenance.reload({
      include: [
        { model: User, as: 'responsable' },
        { model: User, as: 'createur' },
        { model: Chambre, as: 'chambre' }
      ]
    });

    // Créer des alertes selon les changements
    if (oldStatus !== maintenance.statut) {
      if (maintenance.statut === 'Terminée') {
        await createMaintenanceAlert('maintenance_completed', maintenance, req.user);
      } else if (maintenance.statut === 'Annulée') {
        await createMaintenanceAlert('maintenance_cancelled', maintenance, req.user);
      }
    }

    if (oldResponsable !== maintenance.responsable_id) {
      await createMaintenanceAlert('maintenance_updated', maintenance, req.user, {
        changement: 'responsable_modifie',
        ancien_responsable: oldResponsable,
        nouveau_responsable: maintenance.responsable_id
      });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erreur lors de la modification de la maintenance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/suivis-maintenances/:id - Supprimer une maintenance
router.delete('/:id', requireAuth, requireRole(['Superviseur Technique', 'Superviseur', 'Administrateur', 'Patron']), [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenance = await SuiviMaintenance.findByPk(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée' });
    }

    await maintenance.destroy();
    res.json({ message: 'Maintenance supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la maintenance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/suivis-maintenances/overdue - Maintenances en retard
router.get('/overdue', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdueMaintenances = await SuiviMaintenance.findAll({
      where: {
        date_planifiee: { [Op.lt]: today },
        statut: { [Op.notIn]: ['Terminée', 'Annulée'] }
      },
      include: [
        { model: User, as: 'responsable', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: User, as: 'createur', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
      ],
      order: [['date_planifiee', 'ASC']]
    });

    res.json(overdueMaintenances);
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances en retard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/suivis-maintenances/due-soon - Maintenances prévues bientôt
router.get('/due-soon', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const dueSoonMaintenances = await SuiviMaintenance.findAll({
      where: {
        date_planifiee: {
          [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]
        },
        statut: { [Op.notIn]: ['Terminée', 'Annulée'] }
      },
      include: [
        { model: User, as: 'responsable', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: User, as: 'createur', attributes: ['id', 'prenom', 'nom', 'email'] },
        { model: Chambre, as: 'chambre', attributes: ['id', 'numero', 'type'] }
      ],
      order: [['date_planifiee', 'ASC']]
    });

    res.json(dueSoonMaintenances);
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances prévues:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
