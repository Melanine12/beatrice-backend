const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Entrepot = sequelize.define('Entrepot', {
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
  type: {
    type: DataTypes.ENUM('entrepôt', 'dépôt', 'magasin', 'zone_stockage'),
    allowNull: false,
    defaultValue: 'entrepôt'
  },
  description: {
    type: DataTypes.TEXT,
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
  capacite: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Capacité en m³'
  },
  utilisation: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Pourcentage d\'utilisation (0-100)',
    validate: {
      min: 0,
      max: 100
    }
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'maintenance', 'construction'),
    allowNull: false,
    defaultValue: 'actif'
  },
  responsable: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_entrepots',
  indexes: [
    {
      fields: ['nom']
    },
    {
      fields: ['type']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['ville']
    }
  ]
});

// Instance method to check if entrepot is active
Entrepot.prototype.isActive = function() {
  return this.statut === 'actif';
};

// Instance method to check if entrepot has available capacity
Entrepot.prototype.hasAvailableCapacity = function() {
  if (!this.capacite || !this.utilisation) return true;
  return this.utilisation < 100;
};

// Instance method to get capacity usage percentage
Entrepot.prototype.getCapacityUsage = function() {
  if (!this.capacite || !this.utilisation) return 0;
  return this.utilisation;
};

// Instance method to get status color
Entrepot.prototype.getStatusColor = function() {
  const statusColors = {
    'actif': 'green',
    'inactif': 'red',
    'maintenance': 'yellow',
    'construction': 'orange'
  };
  return statusColors[this.statut] || 'gray';
};

module.exports = Entrepot; 