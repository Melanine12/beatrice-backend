'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer la table offres_emploi
    await queryInterface.createTable('offres_emploi', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      titre_poste: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      departement_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_departements',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      type_contrat: {
        type: Sequelize.ENUM('CDI', 'CDD', 'Stage', 'Interim', 'Freelance', 'Consultant'),
        allowNull: false,
        defaultValue: 'CDI'
      },
      salaire_min: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      salaire_max: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      devise: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      lieu_travail: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      duree_hebdomadaire: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      date_debut_poste: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_limite_candidature: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      statut: {
        type: Sequelize.ENUM('Ouverte', 'Fermée', 'Suspendue', 'Pourvue'),
        allowNull: false,
        defaultValue: 'Ouverte'
      },
      niveau_experience: {
        type: Sequelize.ENUM('Débutant', 'Intermédiaire', 'Expérimenté', 'Expert'),
        allowNull: false,
        defaultValue: 'Intermédiaire'
      },
      competences_requises: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      avantages: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processus_candidature: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nombre_poste: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      cree_par: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_utilisateurs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      date_creation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_publication: {
        type: Sequelize.DATE,
        allowNull: true
      },
      vues: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      candidatures: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });

    // Créer la table candidatures_offres
    await queryInterface.createTable('candidatures_offres', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      offre_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'offres_emploi',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      candidat_nom: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      candidat_prenom: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      candidat_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      candidat_telephone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      cv_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      lettre_motivation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      experience_annees: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      statut: {
        type: Sequelize.ENUM('En_attente', 'En_cours', 'Acceptée', 'Refusée', 'Annulée'),
        allowNull: false,
        defaultValue: 'En_attente'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_candidature: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      traite_par: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_utilisateurs',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      date_traitement: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Créer la table offres_competences
    await queryInterface.createTable('offres_competences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      offre_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'offres_emploi',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      competence: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      niveau_requis: {
        type: Sequelize.ENUM('Débutant', 'Intermédiaire', 'Avancé', 'Expert'),
        allowNull: false,
        defaultValue: 'Intermédiaire'
      },
      obligatoire: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    // Créer les index
    await queryInterface.addIndex('offres_emploi', ['departement_id']);
    await queryInterface.addIndex('offres_emploi', ['statut']);
    await queryInterface.addIndex('offres_emploi', ['type_contrat']);
    await queryInterface.addIndex('offres_emploi', ['date_creation']);
    await queryInterface.addIndex('offres_emploi', ['date_limite_candidature']);
    await queryInterface.addIndex('offres_emploi', ['cree_par']);

    await queryInterface.addIndex('candidatures_offres', ['offre_id']);
    await queryInterface.addIndex('candidatures_offres', ['statut']);
    await queryInterface.addIndex('candidatures_offres', ['date_candidature']);
    await queryInterface.addIndex('candidatures_offres', ['traite_par']);

    await queryInterface.addIndex('offres_competences', ['offre_id']);
    await queryInterface.addIndex('offres_competences', ['competence']);

    // Créer la contrainte d'unicité pour offres_competences
    await queryInterface.addConstraint('offres_competences', {
      fields: ['offre_id', 'competence'],
      type: 'unique',
      name: 'unique_offre_competence'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('offres_competences');
    await queryInterface.dropTable('candidatures_offres');
    await queryInterface.dropTable('offres_emploi');
  }
};
