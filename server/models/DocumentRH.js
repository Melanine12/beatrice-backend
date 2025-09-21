const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DocumentRH = sequelize.define('DocumentRH', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    contrat_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Contrats',
        key: 'id'
      }
    },
    type_document: {
      type: DataTypes.ENUM(
        'Contrat',
        'Avenant',
        'Attestation_travail',
        'Bulletin_salaire',
        'Certificat_medical',
        'Justificatif_absence',
        'Demande_conge',
        'Evaluation_performance',
        'Formation',
        'Autre'
      ),
      allowNull: false
    },
    nom_fichier: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nom_fichier_original: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    chemin_fichier: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    url_cloudinary: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    public_id_cloudinary: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    taille_fichier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Taille en bytes'
    },
    type_mime: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_emission: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    date_expiration: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('Actif', 'Expiré', 'Archivé', 'Supprimé'),
      defaultValue: 'Actif'
    },
    confidentialite: {
      type: DataTypes.ENUM('Public', 'Interne', 'Confidentiel', 'Secret'),
      defaultValue: 'Interne'
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    cree_par: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    }
  }, {
    tableName: 'documents_rh',
    timestamps: false,
    indexes: [
      {
        fields: ['employe_id']
      },
      {
        fields: ['contrat_id']
      },
      {
        fields: ['type_document']
      },
      {
        fields: ['statut']
      },
      {
        fields: ['confidentialite']
      }
    ]
  });

  return DocumentRH;
};
