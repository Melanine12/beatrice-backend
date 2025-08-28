const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fournisseur = sequelize.define('Fournisseur', {
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
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code_postal: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  pays: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'France'
  },
  siret: {
    type: DataTypes.STRING(14),
    allowNull: true,
    unique: true
  },
  tva_intracom: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  contact_principal: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  telephone_contact: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email_contact: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  conditions_paiement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '30 jours'
  },
  statut: {
    type: DataTypes.ENUM('Actif', 'Inactif', 'En attente'),
    allowNull: false,
    defaultValue: 'Actif'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categorie_principale: {
    type: DataTypes.ENUM('Mobilier', 'Équipement', 'Linge', 'Produits', 'Électronique', 'Décoration', 'Services', 'Autre'),
    allowNull: true
  },
  evaluation: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
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
  tableName: 'tbl_fournisseurs',
  timestamps: false, // Désactive createdAt et updatedAt automatiques
  indexes: [
    {
      fields: ['nom']
    },
    {
      fields: ['email']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['categorie_principale']
    },
    {
      fields: ['siret'],
      unique: true
    }
  ]
});

// Instance method to get full address
Fournisseur.prototype.getFullAddress = function() {
  const parts = [this.adresse, this.code_postal, this.ville, this.pays];
  return parts.filter(part => part).join(', ');
};

// Instance method to get contact info
Fournisseur.prototype.getContactInfo = function() {
  return {
    principal: this.contact_principal,
    telephone: this.telephone_contact || this.telephone,
    email: this.email_contact || this.email
  };
};

// Instance method to check if supplier is active
Fournisseur.prototype.isActive = function() {
  return this.statut === 'Actif';
};

module.exports = Fournisseur; 