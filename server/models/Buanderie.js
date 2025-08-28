const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Buanderie = sequelize.define('Buanderie', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_inventaire',
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
  type_operation: {
    type: DataTypes.ENUM('Envoi', 'Retour', 'Transfert', 'Perte', 'Endommagement'),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  etat_linge: {
    type: DataTypes.ENUM('Propre', 'Sale', 'En cours', 'Perdu', 'Endommagé'),
    allowNull: false,
    defaultValue: 'Propre'
  },
  priorite: {
    type: DataTypes.ENUM('Urgente', 'Normale', 'Basse'),
    allowNull: false,
    defaultValue: 'Normale'
  },
  date_operation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_retour_prevue: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    }
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('En cours', 'Terminé', 'Annulé'),
    allowNull: false,
    defaultValue: 'En cours'
  },
  cout_operation: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, {
  tableName: 'tbl_buanderie',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['inventaire_id']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['type_operation']
    },
    {
      fields: ['etat_linge']
    },
    {
      fields: ['priorite']
    },
    {
      fields: ['date_operation']
    },
    {
      fields: ['responsable_id']
    },
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['statut']
    }
  ]
});

module.exports = Buanderie;
