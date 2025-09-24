const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OffreEmploi = sequelize.define('OffreEmploi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre_poste: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Titre du poste proposé'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Description détaillée du poste'
  },
  departement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_departements',
      key: 'id'
    },
    comment: 'ID du département concerné'
  },
  type_contrat: {
    type: DataTypes.ENUM('CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant'),
    allowNull: false,
    defaultValue: 'CDI',
    comment: 'Type de contrat proposé'
  },
  salaire_min: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Salaire minimum proposé'
  },
  salaire_max: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Salaire maximum proposé'
  },
  devise: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    comment: 'Devise du salaire'
  },
  lieu_travail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Lieu de travail'
  },
  duree_hebdomadaire: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 60
    },
    comment: 'Durée hebdomadaire en heures'
  },
  date_debut_poste: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de début prévue du poste'
  },
  date_limite_candidature: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date limite pour postuler'
  },
  statut: {
    type: DataTypes.ENUM('Ouverte', 'Fermée', 'Suspendue', 'Pourvue'),
    allowNull: false,
    defaultValue: 'Ouverte',
    comment: 'Statut de l\'offre'
  },
  niveau_experience: {
    type: DataTypes.ENUM('Débutant', 'Intermédiaire', 'Expérimenté', 'Expert'),
    allowNull: false,
    defaultValue: 'Intermédiaire',
    comment: 'Niveau d\'expérience requis'
  },
  competences_requises: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Compétences requises (JSON ou texte)'
  },
  avantages: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Avantages proposés'
  },
  processus_candidature: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Processus de candidature'
  },
  nombre_poste: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    },
    comment: 'Nombre de postes à pourvoir'
  },
  cree_par: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur qui a créé l\'offre'
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de création de l\'offre'
  },
  date_modification: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de dernière modification'
  },
  date_publication: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de publication de l\'offre'
  },
  vues: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de vues de l\'offre'
  },
  candidatures: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de candidatures reçues'
  }
}, {
  tableName: 'offres_emploi',
  timestamps: false,
  indexes: [
    {
      fields: ['departement_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['type_contrat']
    },
    {
      fields: ['date_creation']
    },
    {
      fields: ['date_limite_candidature']
    },
    {
      fields: ['cree_par']
    }
  ]
});

// Méthodes d'instance
OffreEmploi.prototype.getSalaireFormate = function() {
  if (!this.salaire_min && !this.salaire_max) return 'À négocier';
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.devise || 'USD'
    }).format(amount);
  };
  
  if (this.salaire_min && this.salaire_max) {
    return `${formatCurrency(this.salaire_min)} - ${formatCurrency(this.salaire_max)}`;
  } else if (this.salaire_min) {
    return `À partir de ${formatCurrency(this.salaire_min)}`;
  } else if (this.salaire_max) {
    return `Jusqu'à ${formatCurrency(this.salaire_max)}`;
  }
  
  return 'À négocier';
};

OffreEmploi.prototype.isExpiree = function() {
  if (!this.date_limite_candidature) return false;
  return new Date(this.date_limite_candidature) < new Date();
};

OffreEmploi.prototype.isOuverte = function() {
  return this.statut === 'Ouverte' && !this.isExpiree();
};

OffreEmploi.prototype.incrementerVues = async function() {
  this.vues += 1;
  await this.save();
};

module.exports = OffreEmploi;
