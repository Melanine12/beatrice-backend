const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BonMenage = sequelize.define('BonMenage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: true,
      isInt: true
    }
  },
  nom_utilisateur: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  numero_chambre_espace: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  chambre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_chambres',
      key: 'id'
    },
    validate: {
      isInt: true
    }
  },
  etat_matin: {
    type: DataTypes.ENUM('Propre', 'Sale', 'Très sale', 'En désordre', 'Rien à signaler'),
    allowNull: false,
    defaultValue: 'Rien à signaler',
    validate: {
      isIn: [['Propre', 'Sale', 'Très sale', 'En désordre', 'Rien à signaler']]
    }
  },
  designation: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  heure_entree: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  heure_sortie: {
    type: DataTypes.TIME,
    allowNull: true,
    validate: {
      isAfterHeureEntree(value) {
        if (value && this.heure_entree) {
          const entree = new Date(`2000-01-01T${this.heure_entree}`);
          const sortie = new Date(`2000-01-01T${value}`);
          if (sortie <= entree) {
            throw new Error('L\'heure de sortie doit être après l\'heure d\'entrée');
          }
        }
      }
    }
  },
  etat_chambre_apres_entretien: {
    type: DataTypes.ENUM('Parfait', 'Bon', 'Moyen', 'Problème signalé'),
    allowNull: false,
    defaultValue: 'Bon',
    validate: {
      isIn: [['Parfait', 'Bon', 'Moyen', 'Problème signalé']]
    }
  },
  observation: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  shift: {
    type: DataTypes.ENUM('Matin', 'Après-midi', 'Soir', 'Nuit'),
    allowNull: false,
    defaultValue: 'Matin',
    validate: {
      isIn: [['Matin', 'Après-midi', 'Soir', 'Nuit']]
    }
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  heure_creation: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'bons_de_menage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['nom_utilisateur']
    },
    {
      fields: ['numero_chambre_espace']
    },
    {
      fields: ['chambre_id']
    },
    {
      fields: ['etat_matin']
    },
    {
      fields: ['etat_chambre_apres_entretien']
    },
    {
      fields: ['shift']
    },
    {
      fields: ['date_creation']
    },
    {
      fields: ['heure_entree']
    },
    {
      fields: ['heure_sortie']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['updated_by']
    }
  ],
  hooks: {
    beforeValidate: (bonMenage) => {
      // Auto-generate nom_utilisateur if not provided
      if (!bonMenage.nom_utilisateur && bonMenage.utilisateur_id) {
        // This will be handled in the controller by fetching user data
      }
      
      // Set date_creation and heure_creation if not provided
      if (!bonMenage.date_creation) {
        bonMenage.date_creation = new Date();
      }
      if (!bonMenage.heure_creation) {
        bonMenage.heure_creation = new Date().toTimeString().split(' ')[0];
      }
    }
  }
});

// Instance methods
BonMenage.prototype.getDuration = function() {
  if (this.heure_entree && this.heure_sortie) {
    const entree = new Date(`2000-01-01T${this.heure_entree}`);
    const sortie = new Date(`2000-01-01T${this.heure_sortie}`);
    const diffMs = sortie - entree;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  return null;
};

BonMenage.prototype.isCompleted = function() {
  return this.heure_sortie !== null;
};

BonMenage.prototype.getEtatMatinColor = function() {
  const colors = {
    'Propre': 'green',
    'Sale': 'yellow',
    'Très sale': 'red',
    'En désordre': 'orange',
    'Rien à signaler': 'blue'
  };
  return colors[this.etat_matin] || 'gray';
};

BonMenage.prototype.getEtatApresEntretienColor = function() {
  const colors = {
    'Parfait': 'green',
    'Bon': 'blue',
    'Moyen': 'yellow',
    'Problème signalé': 'red'
  };
  return colors[this.etat_chambre_apres_entretien] || 'gray';
};

BonMenage.prototype.getShiftColor = function() {
  const colors = {
    'Matin': 'yellow',
    'Après-midi': 'blue',
    'Soir': 'purple',
    'Nuit': 'indigo'
  };
  return colors[this.shift] || 'gray';
};

// Class methods
BonMenage.getStatsByUser = async function(utilisateurId, dateDebut, dateFin) {
  const whereClause = {
    utilisateur_id: utilisateurId
  };
  
  if (dateDebut && dateFin) {
    whereClause.date_creation = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_bons'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Parfait" THEN 1 END')), 'bons_parfaits'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Bon" THEN 1 END')), 'bons_bons'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Moyen" THEN 1 END')), 'bons_moyens'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Problème signalé" THEN 1 END')), 'bons_problemes'],
      [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(MINUTE, heure_entree, heure_sortie)')), 'duree_moyenne_minutes']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_bons: 0,
    bons_parfaits: 0,
    bons_bons: 0,
    bons_moyens: 0,
    bons_problemes: 0,
    duree_moyenne_minutes: 0
  };
};

BonMenage.getStatsByEspace = async function(numeroEspace, dateDebut, dateFin) {
  const whereClause = {
    numero_chambre_espace: numeroEspace
  };
  
  if (dateDebut && dateFin) {
    whereClause.date_creation = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_bons'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_matin = "Propre" THEN 1 END')), 'etat_propre'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_matin = "Sale" THEN 1 END')), 'etat_sale'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_matin = "Très sale" THEN 1 END')), 'etat_tres_sale'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_matin = "En désordre" THEN 1 END')), 'etat_desordre'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_matin = "Rien à signaler" THEN 1 END')), 'etat_rien_signal'],
      [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(MINUTE, heure_entree, heure_sortie)')), 'duree_moyenne_minutes']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_bons: 0,
    etat_propre: 0,
    etat_sale: 0,
    etat_tres_sale: 0,
    etat_desordre: 0,
    etat_rien_signal: 0,
    duree_moyenne_minutes: 0
  };
};

BonMenage.getStatsByShift = async function(shift, dateDebut, dateFin) {
  const whereClause = {
    shift: shift
  };
  
  if (dateDebut && dateFin) {
    whereClause.date_creation = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_bons'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Parfait" THEN 1 END')), 'bons_parfaits'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Bon" THEN 1 END')), 'bons_bons'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Moyen" THEN 1 END')), 'bons_moyens'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN etat_chambre_apres_entretien = "Problème signalé" THEN 1 END')), 'bons_problemes'],
      [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(MINUTE, heure_entree, heure_sortie)')), 'duree_moyenne_minutes']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_bons: 0,
    bons_parfaits: 0,
    bons_bons: 0,
    bons_moyens: 0,
    bons_problemes: 0,
    duree_moyenne_minutes: 0
  };
};

// Associations
BonMenage.associate = function(models) {
  // Association avec User (utilisateur qui effectue le ménage)
  BonMenage.belongsTo(models.User, {
    foreignKey: 'utilisateur_id',
    as: 'utilisateur'
  });
  
  // Association avec Chambre (espace concerné)
  BonMenage.belongsTo(models.Chambre, {
    foreignKey: 'chambre_id',
    as: 'chambre'
  });
  
  // Association avec User (créateur)
  BonMenage.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createur'
  });
  
  // Association avec User (modificateur)
  BonMenage.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'modificateur'
  });
};

module.exports = BonMenage;
