const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventaire = sequelize.define('Inventaire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code_produit: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Code produit unique pour identification'
  },
  nature: {
    type: DataTypes.ENUM('Consommable', 'Durable', 'Équipement', 'Mobilier', 'Linge', 'Produit d\'entretien', 'Autre'),
    allowNull: true,
    defaultValue: 'Autre'
  },
  categorie: {
    type: DataTypes.ENUM('Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Autre'),
    allowNull: false,
    defaultValue: 'Autre'
  },
  sous_categorie: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Sous-catégorie de l\'article'
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  quantite_min: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pièce'
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  fournisseur: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  numero_reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emplacement: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  emplacement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_entrepots',
      key: 'id'
    },
    comment: 'Référence vers l\'entrepôt/dépôt'
  },
  qr_code_article: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'Code QR unique pour l\'article'
  },
  statut: {
    type: DataTypes.ENUM('Disponible', 'En rupture', 'En commande', 'Hors service'),
    allowNull: false,
    defaultValue: 'Disponible'
  },
  date_achat: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_expiration: {
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
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_inventaire',
  indexes: [
    {
      fields: ['categorie']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['responsable_id']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['nom']
    },
    {
      fields: ['code_produit']
    },
    {
      fields: ['qr_code_article']
    },
    {
      fields: ['emplacement_id']
    },
    {
      fields: ['nature']
    },
    {
      fields: ['sous_categorie']
    }
  ]
});

// Instance method to check if item is low in stock
Inventaire.prototype.isLowStock = function() {
  return this.quantite <= this.quantite_min;
};

// Instance method to check if item is out of stock
Inventaire.prototype.isOutOfStock = function() {
  return this.quantite === 0;
};

// Instance method to get stock status color
Inventaire.prototype.getStockStatusColor = function() {
  if (this.quantite === 0) return 'red';
  if (this.quantite <= this.quantite_min) return 'orange';
  return 'green';
};

// Instance method to get category color
Inventaire.prototype.getCategoryColor = function() {
  const categoryColors = {
    'Mobilier': 'purple',
    'Équipement': 'blue',
    'Linge': 'green',
    'Produits': 'yellow',
    'Électronique': 'indigo',
    'Décoration': 'pink',
    'Autre': 'gray'
  };
  return categoryColors[this.categorie] || 'gray';
};

// Instance method to generate QR code
Inventaire.prototype.generateQRCode = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `QR-${this.id || 'NEW'}-${timestamp}-${random}`;
};

// Instance method to generate product code
Inventaire.prototype.generateProductCode = function() {
  const prefix = this.categorie ? this.categorie.substring(0, 3).toUpperCase() : 'ART';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = Inventaire; 