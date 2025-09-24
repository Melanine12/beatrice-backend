const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CandidatureOffre = sequelize.define('CandidatureOffre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  offre_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'offres_emploi',
      key: 'id'
    },
    comment: 'ID de l\'offre d\'emploi'
  },
  candidat_nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom du candidat'
  },
  candidat_prenom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Prénom du candidat'
  },
  candidat_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    },
    comment: 'Email du candidat'
  },
  candidat_telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Téléphone du candidat'
  },
  cv_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL du CV uploadé'
  },
  lettre_motivation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Lettre de motivation'
  },
  experience_annees: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Années d\'expérience'
  },
  statut: {
    type: DataTypes.ENUM('En_attente', 'En_cours', 'Acceptée', 'Refusée', 'Annulée'),
    allowNull: false,
    defaultValue: 'En_attente',
    comment: 'Statut de la candidature'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes internes sur la candidature'
  },
  date_candidature: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de candidature'
  },
  date_modification: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de dernière modification'
  },
  traite_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur qui traite la candidature'
  },
  date_traitement: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de traitement de la candidature'
  }
}, {
  tableName: 'candidatures_offres',
  timestamps: false,
  indexes: [
    {
      fields: ['offre_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_candidature']
    },
    {
      fields: ['traite_par']
    }
  ]
});

// Méthodes d'instance
CandidatureOffre.prototype.getNomComplet = function() {
  return `${this.candidat_prenom} ${this.candidat_nom}`;
};

CandidatureOffre.prototype.getStatutColor = function() {
  const colors = {
    'En_attente': 'bg-yellow-100 text-yellow-800',
    'En_cours': 'bg-blue-100 text-blue-800',
    'Acceptée': 'bg-green-100 text-green-800',
    'Refusée': 'bg-red-100 text-red-800',
    'Annulée': 'bg-gray-100 text-gray-800'
  };
  return colors[this.statut] || 'bg-gray-100 text-gray-800';
};

CandidatureOffre.prototype.marquerCommeTraitee = async function(utilisateurId) {
  this.statut = 'En_cours';
  this.traite_par = utilisateurId;
  this.date_traitement = new Date();
  await this.save();
};

module.exports = CandidatureOffre;
