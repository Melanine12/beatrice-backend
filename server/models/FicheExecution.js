const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FicheExecution = sequelize.define('FicheExecution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Numéro unique de la fiche d\'exécution'
  },
  tache_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_taches',
      key: 'id'
    },
    comment: 'ID de la tâche à exécuter'
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Titre de la fiche d\'exécution'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de l\'exécution'
  },
  statut: {
    type: DataTypes.ENUM('en_preparation', 'en_cours', 'terminee', 'annulee'),
    allowNull: false,
    defaultValue: 'en_preparation',
    comment: 'Statut de la fiche d\'exécution'
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'normale', 'haute', 'urgente'),
    allowNull: false,
    defaultValue: 'normale',
    comment: 'Priorité de l\'exécution'
  },
  date_debut_prevue: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de début prévue'
  },
  date_fin_prevue: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin prévue'
  },
  date_debut_reelle: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de début réelle'
  },
  date_fin_reelle: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin réelle'
  },
  duree_prevue: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Durée prévue en minutes'
  },
  duree_reelle: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Durée réelle en minutes'
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur responsable de l\'exécution'
  },
  superviseur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID du superviseur'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Commentaires additionnels'
  },
  resultat: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Résultat de l\'exécution'
  },
  satisfaction: {
    type: DataTypes.ENUM('insuffisante', 'satisfaisante', 'excellente'),
    allowNull: true,
    comment: 'Niveau de satisfaction'
  }
}, {
  tableName: 'tbl_fiches_execution',
  indexes: [
    {
      fields: ['numero']
    },
    {
      fields: ['tache_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['responsable_id']
    },
    {
      fields: ['date_debut_prevue']
    },
    {
      fields: ['priorite']
    }
  ]
});

// Instance methods
FicheExecution.prototype.isEnCours = function() {
  return this.statut === 'en_cours';
};

FicheExecution.prototype.isTerminee = function() {
  return this.statut === 'terminee';
};

FicheExecution.prototype.isUrgente = function() {
  return this.priorite === 'urgente';
};

FicheExecution.prototype.getDureeRestante = function() {
  if (this.date_fin_prevue && this.date_debut_reelle) {
    const fin = new Date(this.date_fin_prevue);
    const maintenant = new Date();
    return Math.max(0, fin - maintenant);
  }
  return null;
};

module.exports = FicheExecution;
