const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Dependant = sequelize.define('Dependant', {
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
    comment: 'Référence vers l\'employé parent'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('conjoint', 'enfant'),
    allowNull: false,
    defaultValue: 'enfant',
    comment: 'Type de dépendant'
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  lien_parente: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Ex: "Fils", "Fille", "Époux", "Épouse"'
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
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
  statut: {
    type: DataTypes.ENUM('actif', 'inactif'),
    allowNull: false,
    defaultValue: 'actif'
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
  tableName: 'tbl_dependants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Table des dépendants (conjoints et enfants) des employés',
  indexes: [
    {
      fields: ['employe_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['nom', 'prenom']
    }
  ]
});

module.exports = Dependant;
