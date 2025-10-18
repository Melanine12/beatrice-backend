const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaiementSalaire = sequelize.define('PaiementSalaire', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_employes',
        key: 'id',
      },
    },
    nom_employe: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prenom_employe: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email_employe: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    devise: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    type_paiement: {
      type: DataTypes.ENUM('Salaire', 'Prime', 'Bonus', 'Indemnité', 'Avance', 'Remboursement', 'Autre'),
      allowNull: false,
    },
    periode_paiement: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{2}$/,
      },
    },
    date_paiement: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM('En attente', 'Payé', 'Annulé', 'En cours'),
      defaultValue: 'En attente',
    },
    methode_paiement: {
      type: DataTypes.ENUM('Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money', 'Autre'),
      defaultValue: 'Virement bancaire',
    },
    numero_compte: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    nom_banque: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    code_banque: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    valide_par: {
      type: DataTypes.INTEGER,
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
      references: {
        model: 'tbl_utilisateurs',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id',
      },
    },
  }, {
    tableName: 'tbl_paiements_salaires',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  PaiementSalaire.associate = (models) => {
    PaiementSalaire.belongsTo(models.User, { foreignKey: 'employe_id', as: 'Employe' });
    PaiementSalaire.belongsTo(models.User, { foreignKey: 'valide_par', as: 'Validateur' });
    PaiementSalaire.belongsTo(models.User, { foreignKey: 'created_by', as: 'Createur' });
    PaiementSalaire.belongsTo(models.User, { foreignKey: 'updated_by', as: 'Modificateur' });
  };

  return PaiementSalaire;
};