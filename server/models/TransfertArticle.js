const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TransfertArticle = sequelize.define('TransfertArticle', {
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
    entrepot_origine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_entrepots',
            key: 'id'
        }
    },
    entrepot_destination_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_entrepots',
            key: 'id'
        }
    },
    moyen_transport: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    numero_transport: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    date_expedition: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date_reception: {
        type: DataTypes.DATE,
        allowNull: true
    },
    responsable_expedition_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_utilisateurs',
            key: 'id'
        }
    },
    responsable_reception_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_utilisateurs',
            key: 'id'
        }
    },
    etat_reception: {
        type: DataTypes.ENUM('Bon', 'Endommage', 'Incomplet', 'Perdu'),
        defaultValue: 'Bon'
    },
    observations_reception: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'tbl_transferts_articles',
    timestamps: false
});

module.exports = TransfertArticle;
