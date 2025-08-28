const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { CycleVieArticle, MaintenanceArticle, TransfertArticle, Inventaire, User, Entrepot } = require('../models');
const { Op } = require('sequelize');

// =====================================================
// ROUTES PRINCIPALES DU CYCLE DE VIE
// =====================================================

// GET /api/cycle-vie-articles - Récupérer toutes les opérations de cycle de vie
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, article_id, type_operation, statut, date_debut, date_fin } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (article_id) whereClause.article_id = article_id;
        if (type_operation) whereClause.type_operation = type_operation;
        if (statut) whereClause.statut = statut;
        if (date_debut && date_fin) {
            whereClause.date_operation = {
                [Op.between]: [new Date(date_debut), new Date(date_fin)]
            };
        }

        const { count, rows } = await CycleVieArticle.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Inventaire,
                    as: 'article',
                    attributes: ['id', 'nom', 'numero_reference', 'categorie']
                },
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['id', 'nom', 'prenom', 'role']
                },
                {
                    model: MaintenanceArticle,
                    as: 'maintenance',
                    include: [{
                        model: User,
                        as: 'technicien',
                        attributes: ['id', 'nom', 'prenom']
                    }]
                },
                {
                    model: TransfertArticle,
                    as: 'transfert',
                    include: [
                        {
                            model: Entrepot,
                            as: 'entrepotOrigine',
                            attributes: ['id', 'nom']
                        },
                        {
                            model: Entrepot,
                            as: 'entrepotDestination',
                            attributes: ['id', 'nom']
                        }
                    ]
                }
            ],
            order: [['date_operation', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du cycle de vie:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du cycle de vie',
            error: error.message
        });
    }
});

// GET /api/cycle-vie-articles/:id - Récupérer une opération spécifique
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const operation = await CycleVieArticle.findByPk(req.params.id, {
            include: [
                {
                    model: Inventaire,
                    as: 'article',
                    attributes: ['id', 'nom', 'numero_reference', 'categorie', 'quantite_stock']
                },
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['id', 'nom', 'prenom', 'role']
                },
                {
                    model: MaintenanceArticle,
                    as: 'maintenance',
                    include: [{
                        model: User,
                        as: 'technicien',
                        attributes: ['id', 'nom', 'prenom']
                    }]
                },
                {
                    model: TransfertArticle,
                    as: 'transfert',
                    include: [
                        {
                            model: Entrepot,
                            as: 'entrepotOrigine',
                            attributes: ['id', 'nom']
                        },
                        {
                            model: Entrepot,
                            as: 'entrepotDestination',
                            attributes: ['id', 'nom']
                        },
                        {
                            model: User,
                            as: 'responsableExpedition',
                            attributes: ['id', 'nom', 'prenom']
                        },
                        {
                            model: User,
                            as: 'responsableReception',
                            attributes: ['id', 'nom', 'prenom']
                        }
                    ]
                }
            ]
        });

        if (!operation) {
            return res.status(404).json({
                success: false,
                message: 'Opération de cycle de vie non trouvée'
            });
        }

        res.json({
            success: true,
            data: operation
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'opération:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'opération',
            error: error.message
        });
    }
});

// POST /api/cycle-vie-articles - Créer une nouvelle opération
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            article_id,
            type_operation,
            quantite,
            unite,
            lieu_origine,
            lieu_destination,
            reference_document,
            cout_unitaire,
            observations,
            maintenance,
            transfert
        } = req.body;

        // Validation des données
        if (!article_id || !type_operation || !quantite) {
            return res.status(400).json({
                success: false,
                message: 'article_id, type_operation et quantite sont requis'
            });
        }

        // Vérifier que l'article existe
        const article = await Inventaire.findByPk(article_id);
        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé'
            });
        }

        // Vérifier la disponibilité du stock pour les opérations de sortie
        if (['Utilisation', 'Vente', 'Perte', 'Vol'].includes(type_operation)) {
            if (quantite > article.quantite_stock) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantité insuffisante en stock pour cette opération'
                });
            }
        }

        // Calculer le coût total
        const cout_total = cout_unitaire ? quantite * cout_unitaire : null;

        // Créer l'opération de cycle de vie
        const operation = await CycleVieArticle.create({
            article_id,
            type_operation,
            utilisateur_id: req.user.userId,
            quantite,
            unite: unite || 'unité',
            lieu_origine,
            lieu_destination,
            reference_document,
            cout_unitaire,
            cout_total,
            observations
        });

        // Mettre à jour le stock de l'article
        if (['Creation', 'Reception'].includes(type_operation)) {
            await article.increment('quantite_stock', { by: quantite });
        } else if (['Utilisation', 'Vente', 'Perte', 'Vol'].includes(type_operation)) {
            await article.decrement('quantite_stock', { by: quantite });
        }

        // Créer les détails de maintenance si fournis
        if (maintenance && type_operation === 'Maintenance') {
            await MaintenanceArticle.create({
                cycle_vie_id: operation.id,
                ...maintenance
            });
        }

        // Créer les détails de transfert si fournis
        if (transfert && type_operation === 'Transfert') {
            await TransfertArticle.create({
                cycle_vie_id: operation.id,
                ...transfert
            });
        }

        // Récupérer l'opération avec toutes les associations
        const operationComplete = await CycleVieArticle.findByPk(operation.id, {
            include: [
                {
                    model: Inventaire,
                    as: 'article',
                    attributes: ['id', 'nom', 'numero_reference', 'categorie', 'quantite_stock']
                },
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['id', 'nom', 'prenom', 'role']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Opération de cycle de vie créée avec succès',
            data: operationComplete
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'opération:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'opération',
            error: error.message
        });
    }
});

// PUT /api/cycle-vie-articles/:id - Mettre à jour une opération
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const operation = await CycleVieArticle.findByPk(req.params.id);
        if (!operation) {
            return res.status(404).json({
                success: false,
                message: 'Opération de cycle de vie non trouvée'
            });
        }

        // Vérifier les permissions (seul l'utilisateur qui a créé l'opération peut la modifier)
        if (operation.utilisateur_id !== req.user.userId && req.user.role !== 'Administrateur') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à modifier cette opération'
            });
        }

        // Mettre à jour l'opération
        await operation.update(req.body);

        res.json({
            success: true,
            message: 'Opération mise à jour avec succès',
            data: operation
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'opération:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'opération',
            error: error.message
        });
    }
});

// DELETE /api/cycle-vie-articles/:id - Supprimer une opération
router.delete('/:id', authenticateToken, requireRole(['Administrateur', 'Superviseur']), async (req, res) => {
    try {
        const operation = await CycleVieArticle.findByPk(req.params.id);
        if (!operation) {
            return res.status(404).json({
                success: false,
                message: 'Opération de cycle de vie non trouvée'
            });
        }

        // Supprimer l'opération (les détails associés seront supprimés automatiquement grâce aux contraintes CASCADE)
        await operation.destroy();

        res.json({
            success: true,
            message: 'Opération supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'opération:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'opération',
            error: error.message
        });
    }
});

// =====================================================
// ROUTES SPÉCIALISÉES
// =====================================================

// GET /api/cycle-vie-articles/article/:article_id - Historique complet d'un article
router.get('/article/:article_id', authenticateToken, async (req, res) => {
    try {
        const { article_id } = req.params;
        const { date_debut, date_fin } = req.query;

        const whereClause = { article_id };
        if (date_debut && date_fin) {
            whereClause.date_operation = {
                [Op.between]: [new Date(date_debut), new Date(date_fin)]
            };
        }

        const operations = await CycleVieArticle.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'utilisateur',
                    attributes: ['id', 'nom', 'prenom', 'role']
                },
                {
                    model: MaintenanceArticle,
                    as: 'maintenance'
                },
                {
                    model: TransfertArticle,
                    as: 'transfert'
                }
            ],
            order: [['date_operation', 'DESC']]
        });

        res.json({
            success: true,
            data: operations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique',
            error: error.message
        });
    }
});

// GET /api/cycle-vie-articles/rapport/cout - Rapport des coûts par article
router.get('/rapport/cout', authenticateToken, async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        const whereClause = {};
        if (date_debut && date_fin) {
            whereClause.date_operation = {
                [Op.between]: [new Date(date_debut), new Date(date_fin)]
            };
        }

        const rapport = await CycleVieArticle.findAll({
            where: whereClause,
            include: [
                {
                    model: Inventaire,
                    as: 'article',
                    attributes: ['id', 'nom', 'numero_reference', 'categorie']
                }
            ],
            attributes: [
                'article_id',
                'type_operation',
                [sequelize.fn('SUM', sequelize.col('cout_total')), 'total_cout'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'nombre_operations']
            ],
            group: ['article_id', 'type_operation'],
            order: [['article_id', 'ASC']]
        });

        res.json({
            success: true,
            data: rapport
        });
    } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport',
            error: error.message
        });
    }
});

// GET /api/cycle-vie-articles/statistiques - Statistiques générales
router.get('/statistiques', authenticateToken, async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        const whereClause = {};
        if (date_debut && date_fin) {
            whereClause.date_operation = {
                [Op.between]: [new Date(date_debut), new Date(date_fin)]
            };
        }

        const stats = await CycleVieArticle.findAll({
            where: whereClause,
            attributes: [
                'type_operation',
                [sequelize.fn('COUNT', sequelize.col('id')), 'nombre'],
                [sequelize.fn('SUM', sequelize.col('cout_total')), 'total_cout']
            ],
            group: ['type_operation']
        });

        const totalOperations = await CycleVieArticle.count({ where: whereClause });
        const totalCout = await CycleVieArticle.sum('cout_total', { where: whereClause });

        res.json({
            success: true,
            data: {
                statistiques: stats,
                total_operations: totalOperations,
                total_cout: totalCout
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

module.exports = router;
