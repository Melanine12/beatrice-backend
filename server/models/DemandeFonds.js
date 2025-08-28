const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DemandeFonds = sequelize.define('DemandeFonds', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('demande_fonds', 'bon_achat'),
    allowNull: false,
    defaultValue: 'demande_fonds'
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'approuvee', 'rejetee', 'annulee'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  montant_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  devise: {
    type: DataTypes.ENUM('EUR', 'USD', 'FC'),
    allowNull: false,
    defaultValue: 'EUR'
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  commentaire_superviseur: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  demandeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  superviseur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  }
}, {
  tableName: 'tbl_demandes_fonds',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DemandeFonds;
