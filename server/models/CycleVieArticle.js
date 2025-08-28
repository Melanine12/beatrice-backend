const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CycleVieArticle = sequelize.define('CycleVieArticle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_inventaire',
            key: 'id'
        }
    },
    type_operation: {
        type: DataTypes.ENUM('Creation', 'Reception', 'Transfert', 'Utilisation', 'Maintenance', 'Perte', 'Vol', 'Destruction', 'Vente', 'Don'),
        allowNull: false
    },
    date_operation: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_utilisateurs',
            key: 'id'
        }
    },
    quantite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1
    },
    unite: {
        type: DataTypes.STRING(20),
        defaultValue: 'unité'
    },
    lieu_origine: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    lieu_destination: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    reference_document: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    cout_unitaire: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    cout_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    statut: {
        type: DataTypes.ENUM('En cours', 'Termine', 'Annule', 'En attente'),
        defaultValue: 'Termine'
    },
    observations: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date_creation: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    date_modification: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_cycle_vie_articles',
    timestamps: false,
    hooks: {
        beforeUpdate: (instance) => {
            instance.date_modification = new Date();
        }
    }
});

module.exports = CycleVieArticle;
