const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Achat = sequelize.define('Achat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_commande: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  fournisseur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_fournisseurs',
      key: 'id'
    }
  },
  demandeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  approbateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  statut: {
    type: DataTypes.ENUM('Brouillon', 'En attente', 'Approuvée', 'Commandée', 'Réceptionnée', 'Annulée'),
    allowNull: false,
    defaultValue: 'Brouillon'
  },
  priorite: {
    type: DataTypes.ENUM('Basse', 'Normale', 'Haute', 'Urgente'),
    allowNull: false,
    defaultValue: 'Normale'
  },
  date_commande: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_livraison_souhaitee: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_livraison_reelle: {
    type: DataTypes.DATE,
    allowNull: true
  },
  montant_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  montant_ht: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  montant_tva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  taux_tva: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.00
  },
  conditions_paiement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '30 jours'
  },
  mode_livraison: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  frais_livraison: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  adresse_livraison: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pieces_justificatives: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URLs ou chemins vers les pièces justificatives (factures, devis, etc.)'
  },
  motif_annulation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_modification: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tbl_achats',
  timestamps: false, // Désactive createdAt et updatedAt automatiques
  indexes: [
    {
      fields: ['numero_commande']
    },
    {
      fields: ['fournisseur_id']
    },
    {
      fields: ['demandeur_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_commande']
    },
    {
      fields: ['date_creation']
    }
  ]
});

// Instance method to calculate totals
Achat.prototype.calculateTotals = function() {
  const ht = parseFloat(this.montant_ht) || 0;
  const tva = parseFloat(this.montant_tva) || 0;
  const livraison = parseFloat(this.frais_livraison) || 0;
  
  this.montant_total = ht + tva + livraison;
  return this.montant_total;
};

// Instance method to check if order can be approved
Achat.prototype.canBeApproved = function() {
  return this.statut === 'En attente';
};

// Instance method to check if order can be cancelled
Achat.prototype.canBeCancelled = function() {
  return ['Brouillon', 'En attente', 'Approuvée'].includes(this.statut);
};

// Instance method to get order status color
Achat.prototype.getStatusColor = function() {
  const colors = {
    'Brouillon': 'gray',
    'En attente': 'yellow',
    'Approuvée': 'blue',
    'Commandée': 'orange',
    'Réceptionnée': 'green',
    'Annulée': 'red'
  };
  return colors[this.statut] || 'gray';
};

// Instance method to get priority color
Achat.prototype.getPriorityColor = function() {
  const colors = {
    'Basse': 'green',
    'Normale': 'blue',
    'Haute': 'orange',
    'Urgente': 'red'
  };
  return colors[this.priorite] || 'gray';
};

module.exports = Achat; 