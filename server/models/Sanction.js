const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sanction = sequelize.define('Sanction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_employes',
      key: 'id'
    },
    comment: 'Référence vers l\'employé sanctionné'
  },
  type_sanction: {
    type: DataTypes.ENUM('Avertissement', 'Réprimande', 'Suspension', 'Mise à pied', 'Blâme', 'Autre'),
    allowNull: false,
    defaultValue: 'Avertissement',
    comment: 'Type de sanction appliquée'
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 1000]
    },
    comment: 'Motif de la sanction'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de la sanction'
  },
  date_sanction: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0] // Ne peut pas être dans le futur
    },
    comment: 'Date d\'application de la sanction'
  },
  duree_suspension: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 365
    },
    comment: 'Durée de suspension en jours'
  },
  statut: {
    type: DataTypes.ENUM('Actif', 'Annulé', 'Expiré'),
    allowNull: false,
    defaultValue: 'Actif',
    comment: 'Statut de la sanction'
  },
  sanction_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'Utilisateur qui a appliqué la sanction'
  },
  date_fin_suspension: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    },
    comment: 'Date de fin de suspension'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tbl_sanctions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Table des sanctions appliquées aux employés',
  indexes: [
    {
      fields: ['employe_id']
    },
    {
      fields: ['type_sanction']
    },
    {
      fields: ['date_sanction']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['sanction_par']
    }
  ],
  hooks: {
    beforeValidate: (sanction) => {
      // Calculer automatiquement la date de fin de suspension
      if (sanction.type_sanction === 'Suspension' && sanction.duree_suspension && sanction.date_sanction) {
        const dateDebut = new Date(sanction.date_sanction);
        const dateFin = new Date(dateDebut);
        dateFin.setDate(dateFin.getDate() + sanction.duree_suspension);
        sanction.date_fin_suspension = dateFin.toISOString().split('T')[0];
      }
    }
  }
});

module.exports = Sanction;
