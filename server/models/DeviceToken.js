const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique du token'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur propriétaire de l\'appareil'
  },
  device_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [10, 255]
    },
    comment: 'Token FCM unique de l\'appareil'
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios'),
    allowNull: false,
    comment: 'Plateforme de l\'appareil'
  },
  app_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Version de l\'application mobile'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Token actif ou désactivé'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Dernière utilisation du token'
  }
}, {
  tableName: 'tbl_device_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['device_token']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['is_active']
    },
    {
      unique: true,
      fields: ['user_id', 'device_token']
    }
  ]
});

module.exports = DeviceToken;
