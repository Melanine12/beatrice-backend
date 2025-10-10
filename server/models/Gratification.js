const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Gratification = sequelize.define('Gratification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique de la gratification'
  },
  employe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'employé concerné',
    references: {
      model: 'tbl_employes',
      key: 'id'
    }
  },
  type_gratification: {
    type: DataTypes.ENUM('prime', 'bonus', 'commission', 'gratification_exceptionnelle', 'prime_performance', 'prime_anciennete'),
    allowNull: false,
    comment: 'Type de gratification'
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant de la gratification',
    validate: {
      min: 0
    }
  },
  motif: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Motif de la gratification'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de la gratification'
  },
  date_gratification: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de la gratification'
  },
  periode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Période concernée (ex: Janvier 2024)'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'annule', 'suspendu'),
    defaultValue: 'actif',
    comment: 'Statut de la gratification'
  },
  gratification_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'employé qui a accordé la gratification',
    references: {
      model: 'tbl_employes',
      key: 'id'
    }
  }
}, {
  tableName: 'tbl_gratifications',
  timestamps: true,
  createdAt: 'date_creation',
  updatedAt: 'date_modification',
  comment: 'Table des gratifications des employés'
});

// Hooks pour validation et logique métier
Gratification.beforeValidate((gratification) => {
  // Validation de la date de gratification
  if (gratification.date_gratification && new Date(gratification.date_gratification) > new Date()) {
    throw new Error('La date de gratification ne peut pas être dans le futur');
  }
  
  // Validation du montant
  if (gratification.montant && gratification.montant <= 0) {
    throw new Error('Le montant de la gratification doit être positif');
  }
});

// Méthodes d'instance
Gratification.prototype.getFormattedMontant = function() {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(this.montant);
};

Gratification.prototype.getTypeLabel = function() {
  const labels = {
    'prime': 'Prime',
    'bonus': 'Bonus',
    'commission': 'Commission',
    'gratification_exceptionnelle': 'Gratification Exceptionnelle',
    'prime_performance': 'Prime de Performance',
    'prime_anciennete': 'Prime d\'Ancienneté'
  };
  return labels[this.type_gratification] || this.type_gratification;
};

Gratification.prototype.getStatutLabel = function() {
  const labels = {
    'actif': 'Actif',
    'annule': 'Annulé',
    'suspendu': 'Suspendu'
  };
  return labels[this.statut] || this.statut;
};

module.exports = Gratification;
