const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Problematique = sequelize.define('Problematique', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('Maintenance', 'Nettoyage', 'Sécurité', 'Technique', 'Autre'),
    allowNull: false,
    defaultValue: 'Autre'
  },
  priorite: {
    type: DataTypes.ENUM('Basse', 'Normale', 'Haute', 'Urgente'),
    allowNull: false,
    defaultValue: 'Normale'
  },
  statut: {
    type: DataTypes.ENUM('Ouverte', 'En cours', 'En attente', 'Résolue', 'Fermée'),
    allowNull: false,
    defaultValue: 'Ouverte'
  },
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  departement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_departements',
      key: 'id'
    }
  },
  sous_departement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_sous_departements',
      key: 'id'
    }
  },
  rapporteur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  assigne_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_resolution: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_limite: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fichiers: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  commentaires: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_problematiques',
  indexes: [
    {
      fields: ['statut']
    },
    {
      fields: ['priorite']
    },
    {
      fields: ['type']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['rapporteur_id']
    },
    {
      fields: ['assigne_id']
    }
  ]
});

// Instance method to check if issue is urgent
Problematique.prototype.isUrgent = function() {
  return this.priorite === 'Urgente' || this.priorite === 'Haute';
};

// Instance method to get priority color
Problematique.prototype.getPriorityColor = function() {
  const priorityColors = {
    'Basse': 'green',
    'Normale': 'blue',
    'Haute': 'orange',
    'Urgente': 'red'
  };
  return priorityColors[this.priorite] || 'gray';
};

// Instance method to get status color
Problematique.prototype.getStatusColor = function() {
  const statusColors = {
    'Ouverte': 'red',
    'En cours': 'yellow',
    'En attente': 'orange',
    'Résolue': 'green',
    'Fermée': 'gray'
  };
  return statusColors[this.statut] || 'gray';
};

// Instance method to add comment
Problematique.prototype.addComment = function(userId, comment) {
  const comments = this.commentaires || [];
  comments.push({
    id: Date.now(),
    user_id: userId,
    comment: comment,
    timestamp: new Date().toISOString()
  });
  this.commentaires = comments;
  return this.save();
};

module.exports = Problematique; 