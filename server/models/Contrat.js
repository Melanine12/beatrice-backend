const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contrat = sequelize.define('Contrat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    type_contrat: {
      type: DataTypes.ENUM('CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant'),
      allowNull: false
    },
    numero_contrat: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    salaire_brut: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    salaire_net: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    duree_hebdomadaire: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Durée en heures par semaine'
    },
    statut: {
      type: DataTypes.ENUM('Actif', 'Expiré', 'Résilié', 'Suspendu'),
      defaultValue: 'Actif'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    conditions_particulieres: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_signature: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    cree_par: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    }
  }, {
    tableName: 'contrats',
    timestamps: false,
    indexes: [
      {
        fields: ['employe_id']
      },
      {
        fields: ['numero_contrat']
      },
      {
        fields: ['type_contrat']
      },
      {
        fields: ['statut']
      }
    ]
  });

  return Contrat;
};
