'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents_rh', {
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
      contrat_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'contrats',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type_document: {
        type: Sequelize.ENUM(
          'Contrat', 'Avenant', 'Attestation_travail', 'Bulletin_salaire',
          'Certificat_medical', 'Justificatif_absence', 'Demande_conge',
          'Evaluation_performance', 'Formation', 'Autre'
        ),
        allowNull: false
      },
      nom_fichier: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nom_fichier_original: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      chemin_fichier: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      url_cloudinary: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      public_id_cloudinary: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      taille_fichier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Taille en bytes'
      },
      type_mime: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_emission: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_expiration: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      statut: {
        type: Sequelize.ENUM('Actif', 'Expiré', 'Archivé', 'Supprimé'),
        defaultValue: 'Actif'
      },
      confidentialite: {
        type: Sequelize.ENUM('Public', 'Interne', 'Confidentiel', 'Secret'),
        defaultValue: 'Interne'
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
    await queryInterface.addIndex('documents_rh', ['employe_id']);
    await queryInterface.addIndex('documents_rh', ['contrat_id']);
    await queryInterface.addIndex('documents_rh', ['type_document']);
    await queryInterface.addIndex('documents_rh', ['statut']);
    await queryInterface.addIndex('documents_rh', ['confidentialite']);
    await queryInterface.addIndex('documents_rh', ['cree_par']);
    await queryInterface.addIndex('documents_rh', ['date_creation']);
    await queryInterface.addIndex('documents_rh', ['date_emission']);
    await queryInterface.addIndex('documents_rh', ['date_expiration']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents_rh');
  }
};
