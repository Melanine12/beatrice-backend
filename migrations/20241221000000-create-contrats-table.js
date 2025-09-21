'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contrats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type_contrat: {
        type: Sequelize.ENUM('CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant'),
        allowNull: false
      },
      numero_contrat: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      date_debut: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      date_fin: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      salaire_brut: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      salaire_net: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      duree_hebdomadaire: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Durée en heures par semaine'
      },
      statut: {
        type: Sequelize.ENUM('Actif', 'Expiré', 'Résilié', 'Suspendu'),
        defaultValue: 'Actif'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      conditions_particulieres: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_signature: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_creation: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      cree_par: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });

    // Créer les index
    await queryInterface.addIndex('contrats', ['employe_id']);
    await queryInterface.addIndex('contrats', ['type_contrat']);
    await queryInterface.addIndex('contrats', ['statut']);
    await queryInterface.addIndex('contrats', ['cree_par']);
    await queryInterface.addIndex('contrats', ['date_debut']);
    await queryInterface.addIndex('contrats', ['date_fin']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contrats');
  }
};
