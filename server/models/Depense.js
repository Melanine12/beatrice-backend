const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Depense = sequelize.define('Depense', {
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
    allowNull: true
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  devise: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR'
  },
  categorie: {
    type: DataTypes.ENUM('Maintenance', 'Nettoyage', 'Équipement', 'Services', 'Marketing', 'Administration', 'Autre'),
    allowNull: false,
    defaultValue: 'Autre'
  },
  statut: {
    type: DataTypes.ENUM('En attente', 'Approuvée', 'Payée', 'Rejetée'),
    allowNull: false,
    defaultValue: 'En attente'
  },
  date_depense: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Nouveaux champs pour la gestion des paiements
  date_paiement_prevue: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date prévue pour le paiement'
  },
  montant_paye: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Montant déjà payé'
  },
  montant_restant: {
    type: DataTypes.VIRTUAL,
    get() {
      return parseFloat(this.montant) - parseFloat(this.montant_paye || 0);
    },
    comment: 'Montant restant à payer'
  },
  urgence: {
    type: DataTypes.ENUM('Faible', 'Normale', 'Urgente', 'Critique'),
    allowNull: false,
    defaultValue: 'Normale',
    comment: 'Niveau d\'urgence du paiement'
  },
  priorite_paiement: {
    type: DataTypes.ENUM('Basse', 'Normale', 'Haute', 'Urgente'),
    allowNull: false,
    defaultValue: 'Normale',
    comment: 'Priorité de paiement'
  },
  notes_paiement: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes sur le paiement'
  },
  responsable_paiement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur responsable du paiement'
  },
  statut_paiement: {
    type: DataTypes.ENUM('En attente', 'Partiellement payé', 'Payé', 'En retard', 'Annulé'),
    allowNull: false,
    defaultValue: 'En attente',
    comment: 'Statut du paiement'
  },
  fournisseur: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  numero_facture: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  demandeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  approbateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    }
  },
  caisse_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_caisses',
      key: 'id'
    }
  },
  fichiers: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_depenses',
  indexes: [
    {
      fields: ['statut']
    },
    {
      fields: ['categorie']
    },
    {
      fields: ['demandeur_id']
    },
    {
      fields: ['approbateur_id']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['caisse_id']
    },
    {
      fields: ['date_depense']
    },
    // Nouveaux index pour la gestion des paiements
    {
      fields: ['date_paiement_prevue']
    },
    {
      fields: ['urgence']
    },
    {
      fields: ['priorite_paiement']
    },
    {
      fields: ['statut_paiement']
    },
    {
      fields: ['montant_paye']
    }
  ]
});

// Instance method to check if expense is approved
Depense.prototype.isApproved = function() {
  return this.statut === 'Approuvée' || this.statut === 'Payée';
};

// Instance method to check if expense is paid
Depense.prototype.isPaid = function() {
  return this.statut === 'Payée';
};

// Instance method to get status color
Depense.prototype.getStatusColor = function() {
  const statusColors = {
    'En attente': 'yellow',
    'Approuvée': 'blue',
    'Payée': 'green',
    'Rejetée': 'red'
  };
  return statusColors[this.statut] || 'gray';
};

// Instance method to get category color
Depense.prototype.getCategoryColor = function() {
  const categoryColors = {
    'Maintenance': 'orange',
    'Nettoyage': 'blue',
    'Équipement': 'purple',
    'Services': 'green',
    'Marketing': 'pink',
    'Administration': 'gray',
    'Autre': 'gray'
  };
  return categoryColors[this.categorie] || 'gray';
};

// Instance method to approve expense
Depense.prototype.approve = function(approbateurId) {
  this.statut = 'Approuvée';
  this.approbateur_id = approbateurId;
  return this.save();
};

// Instance method to pay expense
Depense.prototype.pay = function() {
  this.statut = 'Payée';
  this.date_paiement = new Date();
  return this.save();
};

// Instance method to reject expense
Depense.prototype.reject = function(approbateurId) {
  this.statut = 'Rejetée';
  this.approbateur_id = approbateurId;
  return this.save();
};

// Instance method to add partial payment
Depense.prototype.addPartialPayment = function(montant) {
  this.montant_paye = parseFloat(this.montant_paye || 0) + parseFloat(montant);
  
  if (this.montant_paye >= this.montant) {
    this.statut_paiement = 'Payé';
    this.statut = 'Payée';
  } else {
    this.statut_paiement = 'Partiellement payé';
  }
  
  return this.save();
};

// Instance method to get urgency color
Depense.prototype.getUrgencyColor = function() {
  const urgencyColors = {
    'Faible': 'gray',
    'Normale': 'blue',
    'Urgente': 'orange',
    'Critique': 'red'
  };
  return urgencyColors[this.urgence] || 'gray';
};

// Instance method to get payment priority color
Depense.prototype.getPaymentPriorityColor = function() {
  const priorityColors = {
    'Basse': 'gray',
    'Normale': 'blue',
    'Haute': 'orange',
    'Urgente': 'red'
  };
  return priorityColors[this.priorite_paiement] || 'gray';
};

// Instance method to get payment status color
Depense.prototype.getPaymentStatusColor = function() {
  const paymentStatusColors = {
    'En attente': 'yellow',
    'Partiellement payé': 'blue',
    'Payé': 'green',
    'En retard': 'red',
    'Annulé': 'gray'
  };
  return paymentStatusColors[this.statut_paiement] || 'gray';
};

// Instance method to check if payment is overdue
Depense.prototype.isPaymentOverdue = function() {
  if (!this.date_paiement_prevue) return false;
  return new Date(this.date_paiement_prevue) < new Date() && this.statut_paiement !== 'Payé';
};

// Instance method to get days until payment due
Depense.prototype.getDaysUntilPaymentDue = function() {
  if (!this.date_paiement_prevue) return null;
  const today = new Date();
  const dueDate = new Date(this.date_paiement_prevue);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

module.exports = Depense; 