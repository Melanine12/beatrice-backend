const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DemandeAffectation = sequelize.define('DemandeAffectation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  demandeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'approuvee', 'rejetee', 'annulee'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_demandes_affectation',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DemandeAffectation;


