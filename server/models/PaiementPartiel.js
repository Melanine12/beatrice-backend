const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaiementPartiel = sequelize.define('PaiementPartiel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  depense_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_depenses',
      key: 'id'
    },
    comment: 'ID de la dépense'
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Montant du paiement partiel'
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date du paiement'
  },
  mode_paiement: {
    type: DataTypes.ENUM('Espèces', 'Chèque', 'Virement', 'Carte bancaire', 'Mobile Money'),
    allowNull: false,
    comment: 'Mode de paiement'
  },
  reference_paiement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Référence du paiement (numéro de chèque, etc.)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes sur le paiement'
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'Utilisateur qui a effectué le paiement'
  },
  caisse_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_caisses',
      key: 'id'
    },
    comment: 'ID de la caisse utilisée pour le paiement (null pour décaissement différé)'
  }
}, {
  tableName: 'tbl_paiements_partiels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['depense_id']
    },
    {
      fields: ['date_paiement']
    },
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['mode_paiement']
    },
    {
      fields: ['caisse_id']
    }
  ]
});

// Instance method to get payment method color
PaiementPartiel.prototype.getPaymentMethodColor = function() {
  const methodColors = {
    'Espèces': 'green',
    'Chèque': 'blue',
    'Virement': 'purple',
    'Carte bancaire': 'orange',
    'Mobile Money': 'pink'
  };
  return methodColors[this.mode_paiement] || 'gray';
};

// Instance method to format amount
PaiementPartiel.prototype.getFormattedAmount = function() {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CDF'
  }).format(this.montant);
};

// Instance method to get payment date formatted
PaiementPartiel.prototype.getFormattedPaymentDate = function() {
  return new Date(this.date_paiement).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

module.exports = PaiementPartiel;
