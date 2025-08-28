const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SousDepartement = sequelize.define('SousDepartement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  code: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 15]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  departement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_departements',
      key: 'id'
    }
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  budget_annuel: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  statut: {
    type: DataTypes.ENUM('Actif', 'Inactif', 'En développement'),
    allowNull: false,
    defaultValue: 'Actif'
  },
  niveau_hierarchie: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
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
  couleur: {
    type: DataTypes.STRING(7), // Format hexadécimal #RRGGBB
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  capacite_equipe: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 100
    }
  },
  localisation: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'tbl_sous_departements',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['departement_id']
    },
    {
      fields: ['responsable_id']
    },
    {
      fields: ['niveau_hierarchie']
    }
  ]
});

// Instance method to check if sous-department is active
SousDepartement.prototype.isActive = function() {
  return this.statut === 'Actif';
};

// Instance method to get sous-department status color
SousDepartement.prototype.getStatusColor = function() {
  const statusColors = {
    'Actif': 'green',
    'Inactif': 'red',
    'En développement': 'orange'
  };
  return statusColors[this.statut] || 'gray';
};

module.exports = SousDepartement;
