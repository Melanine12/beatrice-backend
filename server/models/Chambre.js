const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chambre = sequelize.define('Chambre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: true, // Changed from false to true to match DB
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Chambre',
    validate: {
      isIn: [['Chambre', 'Bureau administratif', 'Salle de fête', 'Salle de réunion', 'Restaurant', 'Bar', 'Spa', 'Gym', 'Parking', 'Piscine', 'Jardin', 'Terrasse', 'Cuisine', 'Entrepôt', 'Autre']]
    }
  },
  categorie: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Standard',
    validate: {
      isIn: [['Standard', 'Confort', 'Premium', 'Suite', 'Familiale', 'Accessible']]
    }
  },
  statut: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Libre',
    validate: {
      isIn: [['Libre', 'Occupé', 'En nettoyage', 'En maintenance', 'Réservé', 'Fermé', 'Service en cours', 'En cours d\'utilisation', 'Plein', 'Fermeture saisonnière', 'En entretien', 'En inventaire']]
    }
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed from false to true to match DB
    defaultValue: 1,
    validate: {
      min: 1,
      max: 100
    }
  },
  surface: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  acoustique: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  cuisine_equipee: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  terrasse: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  douches: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  vestiaires: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  places: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  couvert: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  profondeur_max: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  chauffage: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  superficie: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  arrosage_automatique: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  hauteur_plafond: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  quai_chargement: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  prix_nuit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  etage: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed from false to true to match DB
    validate: {
      min: 0,
      max: 50
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_chambres',
  indexes: [
    {
      fields: ['numero']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['type']
    },
    {
      fields: ['categorie']
    }
  ]
});

// Instance method to check if space is available
Chambre.prototype.isAvailable = function() {
  return this.statut === 'Libre';
};

// Instance method to get space status color
Chambre.prototype.getStatusColor = function() {
  const statusColors = {
    'Libre': 'green',
    'Occupé': 'red',
    'En nettoyage': 'yellow',
    'En maintenance': 'orange',
    'Réservé': 'blue',
    'Fermé': 'gray',
    'Service en cours': 'purple',
    'En cours d\'utilisation': 'indigo',
    'Plein': 'red',
    'Fermeture saisonnière': 'orange',
    'En entretien': 'yellow',
    'En inventaire': 'blue'
  };
  return statusColors[this.statut] || 'gray';
};

module.exports = Chambre; 