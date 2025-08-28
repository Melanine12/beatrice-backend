const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceArticle = sequelize.define('MaintenanceArticle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cycle_vie_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_cycle_vie_articles',
            key: 'id'
        }
    },
    type_maintenance: {
        type: DataTypes.ENUM('Preventive', 'Corrective', 'Predictive', 'Conditionnelle'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    technicien_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_utilisateurs',
            key: 'id'
        }
    },
    date_debut_maintenance: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date_fin_maintenance: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cout_maintenance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    pieces_remplacees: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resultat: {
        type: DataTypes.ENUM('Reussi', 'Partiel', 'Echec'),
        defaultValue: 'Reussi'
    },
    prochaine_maintenance: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'tbl_maintenance_articles',
    timestamps: false
});

module.exports = MaintenanceArticle;
