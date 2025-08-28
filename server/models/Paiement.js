const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Paiement = sequelize.define('Paiement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reference: {
    type: DataTypes.STRING(255), // Corrigé pour correspondre à la DB
    allowNull: false,
    unique: true,
    comment: 'Référence unique du paiement (ex: PAY-001)'
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  devise: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'FC'
  },
  type_paiement: {
    type: DataTypes.ENUM('Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Autre'),
    allowNull: false,
    defaultValue: 'Espèces'
  },
  statut: {
    type: DataTypes.ENUM('En attente', 'Validé', 'Rejeté', 'Annulé'),
    allowNull: false,
    defaultValue: 'En attente'
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  beneficiaire: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nom du bénéficiaire du paiement'
  },
  caisse_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_caisses',
      key: 'id'
    },
    comment: 'Référence vers la caisse utilisée'
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'Utilisateur qui effectue le paiement'
  },
  user_guichet_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID du guichetier (alias de utilisateur_id)'
  },

  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    },
    comment: 'Chambre associée au paiement (optionnel)'
  },
  depense_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_depenses',
      key: 'id'
    }
  },
  numero_cheque: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Numéro de chèque si applicable'
  },
  // Supprimé les champs notes et pieces_justificatives qui n'existent pas dans la DB
}, {
  tableName: 'tbl_paiements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['reference']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['type_paiement']
    },
    {
      fields: ['date_paiement']
    },
    {
      fields: ['caisse_id']
    },
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['depense_id']
    }
  ]
});

// Instance method to check if payment is valid
Paiement.prototype.isValid = function() {
  return this.statut === 'Validé';
};

// Instance method to check if payment is pending
Paiement.prototype.isPending = function() {
  return this.statut === 'En attente';
};

// Instance method to get status color
Paiement.prototype.getStatusColor = function() {
  const statusColors = {
    'En attente': 'yellow',
    'Validé': 'green',
    'Rejeté': 'red',
    'Annulé': 'gray'
  };
  return statusColors[this.statut] || 'gray';
};

// Instance method to get payment type color
Paiement.prototype.getPaymentTypeColor = function() {
  const typeColors = {
    'Espèces': 'green',
    'Carte bancaire': 'blue',
    'Chèque': 'purple',
    'Virement': 'orange',
    'Autre': 'gray'
  };
  return typeColors[this.type_paiement] || 'gray';
};

// Instance method to approve payment
Paiement.prototype.approve = function() {
  this.statut = 'Validé';
  return this.save();
};

// Instance method to reject payment
Paiement.prototype.reject = function() {
  this.statut = 'Rejeté';
  return this.save();
};

// Instance method to cancel payment
Paiement.prototype.cancel = function() {
  this.statut = 'Annulé';
  return this.save();
};

module.exports = Paiement; 