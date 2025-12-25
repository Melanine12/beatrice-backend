'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer la table tbl_dispatch_housekeeping
    await queryInterface.createTable('tbl_dispatch_housekeeping', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      agent_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_utilisateurs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      chambre_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_chambres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      statut: {
        type: Sequelize.ENUM('en_attente', 'en_cours', 'complete', 'annule'),
        allowNull: false,
        defaultValue: 'en_attente'
      },
      date_prevue: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_utilisateurs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Créer les index pour tbl_dispatch_housekeeping
    await queryInterface.addIndex('tbl_dispatch_housekeeping', ['agent_id'], {
      name: 'idx_dispatch_agent_id'
    });
    await queryInterface.addIndex('tbl_dispatch_housekeeping', ['chambre_id'], {
      name: 'idx_dispatch_chambre_id'
    });
    await queryInterface.addIndex('tbl_dispatch_housekeeping', ['statut'], {
      name: 'idx_dispatch_statut'
    });
    await queryInterface.addIndex('tbl_dispatch_housekeeping', ['date_prevue'], {
      name: 'idx_dispatch_date_prevue'
    });
    await queryInterface.addIndex('tbl_dispatch_housekeeping', ['created_by'], {
      name: 'idx_dispatch_created_by'
    });

    // Créer la table tbl_dispatch_housekeeping_articles
    await queryInterface.createTable('tbl_dispatch_housekeeping_articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dispatch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_dispatch_housekeeping',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      inventaire_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_inventaire',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantite: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Créer les index pour tbl_dispatch_housekeeping_articles
    await queryInterface.addIndex('tbl_dispatch_housekeeping_articles', ['dispatch_id'], {
      name: 'idx_dispatch_article_dispatch_id'
    });
    await queryInterface.addIndex('tbl_dispatch_housekeeping_articles', ['inventaire_id'], {
      name: 'idx_dispatch_article_inventaire_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les tables dans l'ordre inverse (d'abord les articles, puis le dispatch)
    await queryInterface.dropTable('tbl_dispatch_housekeeping_articles');
    await queryInterface.dropTable('tbl_dispatch_housekeeping');
  }
};

