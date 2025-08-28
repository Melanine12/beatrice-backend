const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RappelPaiement = sequelize.define('RappelPaiement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  depense_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_depenses',
      key: 'id'
    },
    comment: 'ID de la dépense'
  },
  date_rappel: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date du rappel'
  },
  type_rappel: {
    type: DataTypes.ENUM('Email', 'SMS', 'Notification interne', 'Rappel manuel'),
    allowNull: false,
    comment: 'Type de rappel'
  },
  statut: {
    type: DataTypes.ENUM('Programmé', 'Envoyé', 'Lu', 'Traité'),
    allowNull: false,
    defaultValue: 'Programmé',
    comment: 'Statut du rappel'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message du rappel'
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'Utilisateur qui a programmé le rappel'
  }
}, {
  tableName: 'tbl_rappels_paiement',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['depense_id']
    },
    {
      fields: ['date_rappel']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['type_rappel']
    },
    {
      fields: ['utilisateur_id']
    }
  ]
});

// Instance method to get reminder type color
RappelPaiement.prototype.getReminderTypeColor = function() {
  const typeColors = {
    'Email': 'blue',
    'SMS': 'green',
    'Notification interne': 'purple',
    'Rappel manuel': 'orange'
  };
  return typeColors[this.type_rappel] || 'gray';
};

// Instance method to get status color
RappelPaiement.prototype.getStatusColor = function() {
  const statusColors = {
    'Programmé': 'yellow',
    'Envoyé': 'blue',
    'Lu': 'green',
    'Traité': 'gray'
  };
  return statusColors[this.statut] || 'gray';
};

// Instance method to check if reminder is overdue
RappelPaiement.prototype.isOverdue = function() {
  return new Date(this.date_rappel) < new Date() && this.statut === 'Programmé';
};

// Instance method to get days until reminder
RappelPaiement.prototype.getDaysUntilReminder = function() {
  const today = new Date();
  const reminderDate = new Date(this.date_rappel);
  const diffTime = reminderDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Instance method to get formatted reminder date
RappelPaiement.prototype.getFormattedReminderDate = function() {
  return new Date(this.date_rappel).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Instance method to mark as sent
RappelPaiement.prototype.markAsSent = function() {
  this.statut = 'Envoyé';
  return this.save();
};

// Instance method to mark as read
RappelPaiement.prototype.markAsRead = function() {
  this.statut = 'Lu';
  return this.save();
};

// Instance method to mark as processed
RappelPaiement.prototype.markAsProcessed = function() {
  this.statut = 'Traité';
  return this.save();
};

module.exports = RappelPaiement;
