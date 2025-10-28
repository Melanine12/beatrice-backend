const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alerte = sequelize.define('Alerte', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('maintenance_overdue', 'maintenance_due_soon', 'maintenance_completed', 'maintenance_cancelled', 'maintenance_created', 'maintenance_updated'),
      allowNull: false
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priorite: {
      type: DataTypes.ENUM('Basse', 'Normale', 'Haute', 'Urgente'),
      allowNull: false,
      defaultValue: 'Normale'
    },
    statut: {
      type: DataTypes.ENUM('Non lue', 'Lue', 'Archivée'),
      allowNull: false,
      defaultValue: 'Non lue'
    },
    destinataire_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = tous les utilisateurs
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    maintenance_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_suivi_maintenances',
        key: 'id'
      }
    },
    donnees_extra: {
      type: DataTypes.JSON,
      allowNull: true // Pour stocker des données supplémentaires spécifiques au type d'alerte
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    date_lecture: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_archivage: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tbl_alertes',
    timestamps: false,
    hooks: {
      beforeUpdate: (instance) => {
        if (instance.changed('statut')) {
          if (instance.statut === 'Lue' && !instance.date_lecture) {
            instance.date_lecture = new Date();
          }
          if (instance.statut === 'Archivée' && !instance.date_archivage) {
            instance.date_archivage = new Date();
          }
        }
      }
    }
  });

  // Associations
  Alerte.associate = (models) => {
    // Destinataire
    Alerte.belongsTo(models.User, {
      foreignKey: 'destinataire_id',
      as: 'destinataire'
    });

    // Maintenance liée
    Alerte.belongsTo(models.SuiviMaintenance, {
      foreignKey: 'maintenance_id',
      as: 'maintenance'
    });
  };

  return Alerte;
};
