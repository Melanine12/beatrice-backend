const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MouvementStock = sequelize.define('MouvementStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_inventaire',
      key: 'id'
    }
  },
  type_mouvement: {
    type: DataTypes.ENUM('Entrée', 'Sortie', 'Ajustement', 'Transfert', 'Perte', 'Retour'),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  quantite_avant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quantite_apres: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  montant_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  motif: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reference_document: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  numero_document: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  achat_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_achats',
      key: 'id'
    }
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
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  emplacement_source: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emplacement_destination: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  date_mouvement: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('En attente', 'Validé', 'Annulé'),
    allowNull: false,
    defaultValue: 'Validé'
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  etat_linge: {
    type: DataTypes.ENUM('Propre', 'Sale', 'En cours', 'Perdu', 'Endommagé'),
    allowNull: true,
    defaultValue: 'Propre'
  },
  priorite: {
    type: DataTypes.ENUM('Urgente', 'Normale', 'Basse'),
    allowNull: true,
    defaultValue: 'Normale'
  },
  date_retour_prevue: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  categorie: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'general'
  }
}, {
  tableName: 'tbl_mouvements_stock',
  timestamps: false, // Désactive createdAt et updatedAt automatiques
  indexes: [
    {
      fields: ['inventaire_id']
    },
    {
      fields: ['type_mouvement']
    },
    {
      fields: ['date_mouvement']
    },
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['achat_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['categorie']
    },
    {
      fields: ['etat_linge']
    },
    {
      fields: ['priorite']
    },
    {
      fields: ['date_retour_prevue']
    }
  ]
});

// Instance method to calculate amounts
MouvementStock.prototype.calculateAmount = function() {
  if (this.prix_unitaire && this.quantite) {
    this.montant_total = parseFloat(this.prix_unitaire) * parseInt(this.quantite);
  }
  return this.montant_total;
};

// Instance method to get movement type color
MouvementStock.prototype.getTypeColor = function() {
  const colors = {
    'Entrée': 'green',
    'Sortie': 'red',
    'Ajustement': 'blue',
    'Transfert': 'purple',
    'Perte': 'orange',
    'Retour': 'yellow'
  };
  return colors[this.type_mouvement] || 'gray';
};

// Instance method to check if movement is positive
MouvementStock.prototype.isPositive = function() {
  return ['Entrée', 'Retour'].includes(this.type_mouvement);
};

// Instance method to check if movement is negative
MouvementStock.prototype.isNegative = function() {
  return ['Sortie', 'Perte'].includes(this.type_mouvement);
};

// Instance method to get movement description
MouvementStock.prototype.getDescription = function() {
  const descriptions = {
    'Entrée': 'Réception de stock',
    'Sortie': 'Sortie de stock',
    'Ajustement': 'Ajustement d\'inventaire',
    'Transfert': 'Transfert entre emplacements',
    'Perte': 'Perte de stock',
    'Retour': 'Retour de stock'
  };
  return descriptions[this.type_mouvement] || this.type_mouvement;
};

module.exports = MouvementStock; 