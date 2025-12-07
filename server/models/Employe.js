const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employe = sequelize.define('Employe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique de l\'employé'
  },
  civilite: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Civilité de l\'employé'
  },
  nom_famille: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom de famille'
  },
  nom_usage: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom d\'usage'
  },
  prenoms: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Prénoms'
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de naissance'
  },
  lieu_naissance: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Lieu de naissance'
  },
  nationalite: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nationalité'
  },
  numero_securite_sociale: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Numéro de sécurité sociale'
  },
  situation_famille: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Situation familiale'
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Adresse'
  },
  code_postal: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Code postal'
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Ville'
  },
  pays: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Pays'
  },
  telephone_personnel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Téléphone personnel'
  },
  telephone_domicile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Téléphone domicile'
  },
  email_personnel: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Email personnel'
  },
  contact_urgence_nom: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom du contact d\'urgence'
  },
  contact_urgence_prenom: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Prénom du contact d\'urgence'
  },
  contact_urgence_lien: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Lien avec le contact d\'urgence'
  },
  contact_urgence_telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Téléphone du contact d\'urgence'
  },
  matricule: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Matricule'
  },
  poste: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Poste occupé'
  },
  departement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID du département',
    references: {
      model: 'tbl_departements',
      key: 'id'
    }
  },
  sous_departement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID du sous-département',
    references: {
      model: 'tbl_sous_departements',
      key: 'id'
    }
  },
  date_embauche: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date d\'embauche'
  },
  type_contrat: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type de contrat'
  },
  date_fin_contrat: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de fin de contrat'
  },
  temps_travail: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Temps de travail'
  },
  statut: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Actif',
    comment: 'Statut de l\'employé'
  },
  niveau_classification: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Niveau de classification'
  },
  salaire_journalier: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Salaire journalier de l\'employé'
  },
  transport: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Indemnité de transport'
  },
  indemnites_diverse: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Indemnités diverses'
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de la photo'
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
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'utilisateur qui a créé l\'employé'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'utilisateur qui a modifié l\'employé'
  }
}, {
  tableName: 'tbl_employes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Table des employés',
  indexes: [
    {
      fields: ['matricule']
    },
    {
      fields: ['email_personnel']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['departement_id']
    },
    {
      fields: ['sous_departement_id']
    }
  ]
});

module.exports = Employe;
