const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SuiviMaintenance = sequelize.define('SuiviMaintenance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('Maintenance', 'Réparation', 'Inspection', 'Préventive', 'Corrective'),
      allowNull: false,
      defaultValue: 'Maintenance'
    },
    priorite: {
      type: DataTypes.ENUM('Basse', 'Normale', 'Haute', 'Urgente'),
      allowNull: false,
      defaultValue: 'Normale'
    },
    statut: {
      type: DataTypes.ENUM('Planifiée', 'En cours', 'En attente', 'Terminée', 'Annulée'),
      allowNull: false,
      defaultValue: 'Planifiée'
    },
    responsable_id: {
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
    createur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    date_planifiee: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cout_estime: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cout_reel: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    materiel_utilise: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tbl_suivi_maintenances',
    timestamps: false,
    hooks: {
      beforeUpdate: (instance) => {
        instance.date_modification = new Date();
      }
    }
  });

  // Associations
  SuiviMaintenance.associate = (models) => {
    // Responsable (utilisateur assigné)
    SuiviMaintenance.belongsTo(models.User, {
      foreignKey: 'responsable_id',
      as: 'responsable'
    });

    // Créateur
    SuiviMaintenance.belongsTo(models.User, {
      foreignKey: 'createur_id',
      as: 'createur'
    });

    // Chambre
    SuiviMaintenance.belongsTo(models.Chambre, {
      foreignKey: 'chambre_id',
      as: 'chambre'
    });

    // Alertes liées
    SuiviMaintenance.hasMany(models.Alerte, {
      foreignKey: 'maintenance_id',
      as: 'alertes'
    });
  };

  return SuiviMaintenance;
};
