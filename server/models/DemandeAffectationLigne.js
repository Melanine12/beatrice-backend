const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DemandeAffectationLigne = sequelize.define('DemandeAffectationLigne', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  demande_affectation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_demandes_affectation',
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
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  quantite_demandee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  quantite_approvee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'tbl_demandes_affectation_lignes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DemandeAffectationLigne;


