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
  type: {
    type: DataTypes.ENUM('avertissement', 'blame', 'mise_a_pied', 'licenciement'),
    allowNull: false,
    defaultValue: 'avertissement',
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
      isBefore: () => new Date().toISOString().split('T')[0] // Ne peut pas être dans le futur
    },
    comment: 'Date d\'application de la sanction'
  },
  duree: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Durée de la sanction (ex: 3 jours, 1 semaine)'
  },
  montant_amende: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Montant de l\'amende en euros'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'annule', 'suspendu'),
    allowNull: false,
    defaultValue: 'actif',
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
      fields: ['type']
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
      // Calculer automatiquement la date de fin de suspension pour les mises à pied
      if (sanction.type === 'mise_a_pied' && sanction.duree && sanction.date_sanction) {
        // Extraire le nombre de jours de la durée (ex: "3 jours" -> 3)
        const joursMatch = sanction.duree.match(/(\d+)\s*jour/i);
        if (joursMatch) {
          const jours = parseInt(joursMatch[1]);
          const dateDebut = new Date(sanction.date_sanction);
          const dateFin = new Date(dateDebut);
          dateFin.setDate(dateFin.getDate() + jours);
          sanction.date_fin_suspension = dateFin.toISOString().split('T')[0];
        }
      }
    }
  }
});

module.exports = Sanction;
