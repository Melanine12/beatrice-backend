const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DispatchHousekeepingArticle = sequelize.define('DispatchHousekeepingArticle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dispatch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_dispatch_housekeeping',
      key: 'id'
    }
  },
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_inventaire',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'tbl_dispatch_housekeeping_articles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DispatchHousekeepingArticle;
