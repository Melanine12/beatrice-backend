const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DispatchHousekeeping = sequelize.define('DispatchHousekeeping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'complete', 'annule'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  date_prevue: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  }
}, {
  tableName: 'tbl_dispatch_housekeeping',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DispatchHousekeeping;
