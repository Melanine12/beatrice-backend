const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const STATUTS = [
  'en_attente',
  'approuve',
  'rejete',
  'annule',
  'en_analyse_rh',
  'classement_sans_suite',
  'convocation_envoyee',
  'demande_explication_recue',
  'entretien_realise',
  'sanction_validee',
  'sanction_notifiee',
  'dossier_cloture'
];

const TYPE_SANCTION = [
  'avertissement_verbal',
  'avertissement_ecrit',
  'blame',
  'mise_a_pied',
  'retrogradation',
  'licenciement_faute_grave'
];

const NIVEAU_GRAVITE = ['leger', 'moyen', 'grave', 'tres_grave'];

const SanctionPro = sequelize.define('SanctionPro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tbl_employes', key: 'id' },
    comment: 'Employé concerné'
  },
  type_sanction: {
    type: DataTypes.ENUM(...TYPE_SANCTION),
    allowNull: false,
    defaultValue: 'avertissement_verbal',
    comment: 'Type de sanction demandé'
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: [10, 2000] },
    comment: 'Motif obligatoire (10–2000 car.)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Détail des faits'
  },
  date_incident: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de l\'incident'
  },
  duree_suspension: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1 à 8 jours pour mise à pied'
  },
  date_debut_suspension: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_fin_suspension: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  montant_amende: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM(...STATUTS),
    allowNull: false,
    defaultValue: 'en_attente',
    comment: 'Étape du circuit'
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  commentaire_rh: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_convocation: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_demande_explication: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de dépôt de la demande d\'explication par l\'employé'
  },
  date_entretien: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_decision: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_notification: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_cloture: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  niveau_gravite: {
    type: DataTypes.ENUM(...NIVEAU_GRAVITE),
    allowNull: true
  },
  validation_direction_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tbl_utilisateurs', key: 'id' }
  },
  demandeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tbl_utilisateurs', key: 'id' }
  },
  validateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tbl_utilisateurs', key: 'id' }
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'piece_1, piece_2, piece_3, lettre_convocation, piece_explication_1..3, proces_verbal, lettre_notification, texte_explication : { url, nom } ou texte'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tbl_sanctions_pro',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Demandes de sanctions - circuit disciplinaire',
  indexes: [
    { fields: ['employe_id'] },
    { fields: ['type_sanction'] },
    { fields: ['statut'] },
    { fields: ['demandeur_id'] },
    { fields: ['validateur_id'] },
    { fields: ['date_incident'] },
    { fields: ['created_at'] }
  ],
  hooks: {
    beforeValidate: (row) => {
      if (row.type_sanction === 'mise_a_pied' && row.date_debut_suspension && row.duree_suspension) {
        const d = new Date(row.date_debut_suspension);
        d.setDate(d.getDate() + Math.min(8, Math.max(1, row.duree_suspension)));
        row.date_fin_suspension = d.toISOString().split('T')[0];
      }
    }
  }
});

SanctionPro.STATUTS = STATUTS;
SanctionPro.TYPE_SANCTION = TYPE_SANCTION;
SanctionPro.NIVEAU_GRAVITE = NIVEAU_GRAVITE;

// Transitions autorisées (§ 3 du prompt)
const TRANSITIONS = {
  en_attente: ['en_analyse_rh', 'classement_sans_suite', 'approuve', 'rejete'],
  en_analyse_rh: ['convocation_envoyee', 'classement_sans_suite'],
  convocation_envoyee: ['demande_explication_recue'],
  demande_explication_recue: ['entretien_realise'],
  entretien_realise: ['sanction_validee'],
  sanction_validee: ['sanction_notifiee'],
  sanction_notifiee: ['dossier_cloture']
};

SanctionPro.canTransition = (fromStatut, toStatut) => {
  const allowed = TRANSITIONS[fromStatut];
  return Array.isArray(allowed) && allowed.includes(toStatut);
};

module.exports = SanctionPro;
