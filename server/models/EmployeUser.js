const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeUser = sequelize.define('EmployeUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'tbl_employes', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'ID de l\'employé'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'tbl_utilisateurs', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'ID du compte utilisateur'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tbl_employe_utilisateur',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: 'Liaison employé - utilisateur (compte de connexion)',
  indexes: [
    { fields: ['employe_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = EmployeUser;
