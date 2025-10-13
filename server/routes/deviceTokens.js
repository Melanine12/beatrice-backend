const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');
const DeviceToken = require('../models/DeviceToken');

const router = express.Router();

// POST /api/device-tokens - Enregistrer un token d'appareil
router.post('/', [
  body('device_token').isString().isLength({ min: 10, max: 255 }).withMessage('Token d\'appareil invalide'),
  body('platform').isIn(['android', 'ios']).withMessage('Plateforme doit être android ou ios'),
  body('app_version').optional().isString().isLength({ max: 50 }).withMessage('Version d\'app invalide')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array() 
      });
    }

    const { device_token, platform, app_version } = req.body;
    
    const device = await pushNotificationService.registerDeviceToken(
      req.user.id,
      device_token,
      platform,
      app_version
    );

    res.status(201).json({
      success: true,
      message: 'Token d\'appareil enregistré avec succès',
      data: {
        id: device.id,
        platform: device.platform,
        app_version: device.app_version,
        is_active: device.is_active,
        created_at: device.created_at
      }
    });
  } catch (error) {
    console.error('❌ Erreur enregistrement token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register device token',
      message: 'Erreur lors de l\'enregistrement du token'
    });
  }
});

// GET /api/device-tokens - Récupérer les tokens de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const devices = await DeviceToken.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'platform', 'app_version', 'is_active', 'last_used_at', 'created_at'],
      order: [['last_used_at', 'DESC']]
    });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('❌ Erreur récupération tokens:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch device tokens',
      message: 'Erreur lors de la récupération des tokens'
    });
  }
});

// PUT /api/device-tokens/:id - Mettre à jour un token
router.put('/:id', [
  body('platform').optional().isIn(['android', 'ios']).withMessage('Plateforme doit être android ou ios'),
  body('app_version').optional().isString().isLength({ max: 50 }).withMessage('Version d\'app invalide'),
  body('is_active').optional().isBoolean().withMessage('is_active doit être un booléen')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le token appartient à l'utilisateur
    const device = await DeviceToken.findOne({
      where: { id: id, user_id: req.user.id }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device token not found',
        message: 'Token d\'appareil non trouvé'
      });
    }

    // Mettre à jour le token
    await device.update({
      ...updateData,
      last_used_at: new Date()
    });

    res.json({
      success: true,
      message: 'Token mis à jour avec succès',
      data: {
        id: device.id,
        platform: device.platform,
        app_version: device.app_version,
        is_active: device.is_active,
        last_used_at: device.last_used_at
      }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update device token',
      message: 'Erreur lors de la mise à jour du token'
    });
  }
});

// DELETE /api/device-tokens/:id - Supprimer un token
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le token appartient à l'utilisateur
    const device = await DeviceToken.findOne({
      where: { id: id, user_id: req.user.id }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device token not found',
        message: 'Token d\'appareil non trouvé'
      });
    }

    // Désactiver le token au lieu de le supprimer
    await device.update({ is_active: false });

    res.json({
      success: true,
      message: 'Token supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete token',
      message: 'Erreur lors de la suppression du token'
    });
  }
});

// DELETE /api/device-tokens/token/:token - Supprimer un token par sa valeur
router.delete('/token/:token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;
    
    const device = await DeviceToken.findOne({
      where: { device_token: token, user_id: req.user.id }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device token not found',
        message: 'Token d\'appareil non trouvé'
      });
    }

    await device.update({ is_active: false });

    res.json({
      success: true,
      message: 'Token supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete token',
      message: 'Erreur lors de la suppression du token'
    });
  }
});

// POST /api/device-tokens/test - Tester l'envoi de notification
router.post('/test', [
  body('title').isString().isLength({ min: 1, max: 255 }).withMessage('Titre requis'),
  body('body').isString().isLength({ min: 1, max: 1000 }).withMessage('Corps requis'),
  body('type').optional().isString().withMessage('Type invalide')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        message: 'Données de validation invalides',
        errors: errors.array() 
      });
    }

    const { title, body, type } = req.body;

    const notification = {
      title: title,
      body: body,
      type: type || 'test',
      data: {
        action: 'test',
        timestamp: new Date().toISOString()
      }
    };

    const result = await pushNotificationService.sendNotificationToUser(
      req.user.id,
      notification
    );

    res.json({
      success: true,
      message: 'Notification de test envoyée',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur test notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send test notification',
      message: 'Erreur lors de l\'envoi de la notification de test'
    });
  }
});

// GET /api/device-tokens/stats - Statistiques des tokens
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await DeviceToken.findAll({
      where: { user_id: req.user.id },
      attributes: [
        'platform',
        'is_active',
        [DeviceToken.sequelize.fn('COUNT', DeviceToken.sequelize.col('id')), 'count']
      ],
      group: ['platform', 'is_active'],
      raw: true
    });

    const totalTokens = await DeviceToken.count({
      where: { user_id: req.user.id }
    });

    const activeTokens = await DeviceToken.count({
      where: { user_id: req.user.id, is_active: true }
    });

    res.json({
      success: true,
      data: {
        total_tokens: totalTokens,
        active_tokens: activeTokens,
        inactive_tokens: totalTokens - activeTokens,
        platform_stats: stats
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats tokens:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch token stats',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
