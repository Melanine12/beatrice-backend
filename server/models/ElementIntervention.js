const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ElementIntervention = sequelize.define('ElementIntervention', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fiche_execution_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_fiches_execution',
      key: 'id'
    },
    comment: 'ID de la fiche d\'exécution'
  },
  type: {
    type: DataTypes.ENUM('materiel', 'outil', 'piece', 'document', 'formation', 'autre'),
    allowNull: false,
    comment: 'Type d\'élément d\'intervention'
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom de l\'élément'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de l\'élément'
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Quantité nécessaire'
  },
  unite: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Unité de mesure (pièces, mètres, etc.)'
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si l\'élément est disponible'
  },
  fournisseur: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nom du fournisseur'
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Référence du fournisseur'
  },
  cout_estime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Coût estimé de l\'élément'
  },
  devise: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'EUR',
    comment: 'Devise du coût'
  },
  date_commande: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de commande'
  },
  date_reception: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de réception'
  },
  statut: {
    type: DataTypes.ENUM('a_commander', 'commande', 'receptionne', 'utilise', 'retourne'),
    allowNull: false,
    defaultValue: 'a_commander',
    comment: 'Statut de l\'élément'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Commentaires additionnels'
  }
}, {
  tableName: 'tbl_elements_intervention',
  indexes: [
    {
      fields: ['fiche_execution_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['disponible']
    }
  ]
});

// Instance methods
ElementIntervention.prototype.isDisponible = function() {
  return this.disponible;
};

ElementIntervention.prototype.isCommande = function() {
  return this.statut === 'commande';
};

ElementIntervention.prototype.isReceptionne = function() {
  return this.statut === 'receptionne';
};

ElementIntervention.prototype.getCoutTotal = function() {
  if (this.cout_estime && this.quantite) {
    return this.cout_estime * this.quantite;
  }
  return this.cout_estime || 0;
};

module.exports = ElementIntervention;
