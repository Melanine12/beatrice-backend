const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LigneDemandeFonds = sequelize.define('LigneDemandeFonds', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  demande_fonds_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_demandes_fonds',
      key: 'id'
    }
  },
  type_ligne: {
    type: DataTypes.ENUM('libelle', 'article'),
    allowNull: false,
    defaultValue: 'libelle'
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  montant: {
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
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_inventaire',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0.01
    }
  }
}, {
  tableName: 'tbl_lignes_demandes_fonds',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = LigneDemandeFonds;
