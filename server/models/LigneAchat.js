const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LigneAchat = sequelize.define('LigneAchat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  achat_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_achats',
      key: 'id'
    }
  },
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_inventaire',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  quantite_recue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  taux_tva: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.00
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
  montant_ttc: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pièce'
  },
  reference_fournisseur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_livraison_souhaitee: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('En attente', 'Commandée', 'Partiellement livrée', 'Livrée', 'Annulée'),
    allowNull: false,
    defaultValue: 'En attente'
  }
}, {
  tableName: 'tbl_lignes_achat',
  timestamps: false, // Désactive createdAt et updatedAt automatiques
  indexes: [
    {
      fields: ['achat_id']
    },
    {
      fields: ['inventaire_id']
    },
    {
      fields: ['statut']
    }
  ]
});

// Instance method to calculate line totals
LigneAchat.prototype.calculateTotals = function() {
  const qte = parseInt(this.quantite) || 0;
  const prix = parseFloat(this.prix_unitaire) || 0;
  const taux = parseFloat(this.taux_tva) || 20;
  
  this.montant_ht = qte * prix;
  this.montant_tva = this.montant_ht * (taux / 100);
  this.montant_ttc = this.montant_ht + this.montant_tva;
  
  return {
    ht: this.montant_ht,
    tva: this.montant_tva,
    ttc: this.montant_ttc
  };
};

// Instance method to check if line is fully received
LigneAchat.prototype.isFullyReceived = function() {
  return this.quantite_recue >= this.quantite;
};

// Instance method to check if line is partially received
LigneAchat.prototype.isPartiallyReceived = function() {
  return this.quantite_recue > 0 && this.quantite_recue < this.quantite;
};

// Instance method to get remaining quantity
LigneAchat.prototype.getRemainingQuantity = function() {
  return Math.max(0, this.quantite - this.quantite_recue);
};

// Instance method to get line status color
LigneAchat.prototype.getStatusColor = function() {
  const colors = {
    'En attente': 'gray',
    'Commandée': 'blue',
    'Partiellement livrée': 'orange',
    'Livrée': 'green',
    'Annulée': 'red'
  };
  return colors[this.statut] || 'gray';
};

module.exports = LigneAchat; 