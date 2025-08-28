const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Departement = sequelize.define('Departement', {
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
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 10]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_users',
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
    type: DataTypes.ENUM('Actif', 'Inactif', 'En restructuration'),
    allowNull: false,
    defaultValue: 'Actif'
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
  }
}, {
  tableName: 'tbl_departements',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['responsable_id']
    }
  ]
});

// Instance method to check if department is active
Departement.prototype.isActive = function() {
  return this.statut === 'Actif';
};

// Instance method to get department status color
Departement.prototype.getStatusColor = function() {
  const statusColors = {
    'Actif': 'green',
    'Inactif': 'red',
    'En restructuration': 'orange'
  };
  return statusColors[this.statut] || 'gray';
};

module.exports = Departement;
