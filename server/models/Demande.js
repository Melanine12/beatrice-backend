const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Demande = sequelize.define('Demande', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  motif: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Motif de la demande de décaissement'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de la demande'
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant demandé en FCFA',
    validate: {
      min: 0.01
    }
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'approuvee', 'rejetee', 'annulee'),
    allowNull: false,
    defaultValue: 'en_attente',
    comment: 'Statut de la demande'
  },
  date_demande: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de création de la demande'
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de validation/rejet par le superviseur'
  },
  guichetier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'utilisateur guichetier qui fait la demande'
  },
  superviseur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'utilisateur superviseur qui valide/rejette'
  },
  commentaire_superviseur: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Commentaire du superviseur sur sa décision'
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'normale', 'haute', 'urgente'),
    allowNull: false,
    defaultValue: 'normale',
    comment: 'Niveau de priorité de la demande'
  },
  categorie: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Catégorie de la dépense'
  },
  piece_justificative: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Chemin vers la pièce justificative'
  }
}, {
  tableName: 'tbl_demandes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Table des demandes de décaissement des guichetiers pour validation par les superviseurs'
});

// Les associations sont définies dans server/models/index.js

// Méthodes d'instance
Demande.prototype.approuver = function(superviseurId, commentaire) {
  this.statut = 'approuvee';
  this.superviseur_id = superviseurId;
  this.commentaire_superviseur = commentaire;
  this.date_validation = new Date();
  return this.save();
};

Demande.prototype.rejeter = function(superviseurId, commentaire) {
  this.statut = 'rejetee';
  this.superviseur_id = superviseurId;
  this.commentaire_superviseur = commentaire;
  this.date_validation = new Date();
  return this.save();
};

Demande.prototype.annuler = function() {
  this.statut = 'annulee';
  return this.save();
};

// Méthodes de classe (statiques)
Demande.getDemandesEnAttente = function() {
  return this.findAll({
    where: { statut: 'en_attente' },
    include: [
      { model: User, as: 'guichetier', attributes: ['id', 'nom', 'prenom', 'email'] }
    ],
    order: [
      ['priorite', 'ASC'],
      ['date_demande', 'ASC']
    ]
  });
};

Demande.getDemandesParGuichetier = function(guichetierId) {
  return this.findAll({
    where: { guichetier_id: guichetierId },
    include: [
      { model: User, as: 'guichetier', attributes: ['id', 'nom', 'prenom', 'email'] },
      { model: User, as: 'superviseur', attributes: ['id', 'nom', 'prenom', 'email'] }
    ],
    order: [['date_demande', 'DESC']]
  });
};

Demande.getDemandesParStatut = function(statut) {
  return this.findAll({
    where: { statut },
    include: [
      { model: User, as: 'guichetier', attributes: ['id', 'nom', 'prenom', 'email'] },
      { model: User, as: 'superviseur', attributes: ['id', 'nom', 'prenom', 'email'] }
    ],
    order: [['date_demande', 'DESC']]
  });
};

module.exports = Demande;
