const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Encaissement = sequelize.define('Encaissement', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    encaissement_caisse_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_caisses',
        key: 'id',
      },
      comment: 'ID de la caisse associée à cet encaissement',
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    },
    devise: {
      type: DataTypes.STRING(3),
      defaultValue: 'FC',
    },
    type_paiement: {
      type: DataTypes.ENUM('Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre'),
      allowNull: false,
    },
    date_paiement: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    beneficiaire: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email_beneficiaire: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    telephone_beneficiaire: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM('En attente', 'Validé', 'Rejeté', 'Annulé'),
      defaultValue: 'En attente',
    },
    methode_paiement: {
      type: DataTypes.ENUM('Espèces', 'Carte bancaire', 'Chèque', 'Virement', 'Mobile Money', 'Autre'),
      defaultValue: 'Espèces',
    },
    numero_transaction: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nom_banque: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    numero_compte: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    valide_par: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id',
      },
    },
    date_validation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    commentaires_validation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id',
      },
    },
  }, {
    tableName: 'tbl_encaissements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Encaissement.associate = (models) => {
    Encaissement.belongsTo(models.User, { foreignKey: 'valide_par', as: 'Validateur' });
    Encaissement.belongsTo(models.User, { foreignKey: 'created_by', as: 'Createur' });
    Encaissement.belongsTo(models.User, { foreignKey: 'updated_by', as: 'Modificateur' });
  };

  return Encaissement;
};
