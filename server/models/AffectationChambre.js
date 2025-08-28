const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Chambre = require('./Chambre');

const AffectationChambre = sequelize.define('AffectationChambre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  date_affectation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  remarque: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_affectations_chambres',
  timestamps: false
});

// Définir les associations
AffectationChambre.belongsTo(User, {
  foreignKey: 'utilisateur_id',
  as: 'utilisateur'
});

AffectationChambre.belongsTo(Chambre, {
  foreignKey: 'chambre_id',
  as: 'chambre'
});

module.exports = AffectationChambre; 