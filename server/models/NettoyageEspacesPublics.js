const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NettoyageEspacesPublics = sequelize.define('NettoyageEspacesPublics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date_nettoyage: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
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
  agent_id: {
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
  nom_agent: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  superviseur_id: {
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
  nom_superviseur: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  espaces_nettoyes: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notNull: true,
      isValidEspaces(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Les espaces nettoyés doivent être un objet JSON valide');
        }
      }
    }
  },
  taches_effectuees: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notNull: true,
      isValidTaches(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Les tâches effectuées doivent être un objet JSON valide');
        }
      }
    }
  },
  verification_finale: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notNull: true,
      isValidVerification(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('La vérification finale doit être un objet JSON valide');
        }
      }
    }
  },
  observations_generales: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  statut: {
    type: DataTypes.ENUM('En cours', 'Terminé', 'Validé', 'Rejeté'),
    allowNull: false,
    defaultValue: 'En cours',
    validate: {
      isIn: [['En cours', 'Terminé', 'Validé', 'Rejeté']]
    }
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
  tableName: 'nettoyage_espaces_publics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['date_nettoyage']
    },
    {
      fields: ['shift']
    },
    {
      fields: ['agent_id']
    },
    {
      fields: ['superviseur_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeValidate: (nettoyage) => {
      // Auto-generate nom_agent and nom_superviseur if not provided
      if (!nettoyage.nom_agent && nettoyage.agent_id) {
        // This will be handled in the controller by fetching user data
      }
      if (!nettoyage.nom_superviseur && nettoyage.superviseur_id) {
        // This will be handled in the controller by fetching user data
      }
    }
  }
});

// Instance methods
NettoyageEspacesPublics.prototype.getEspacesNettoyesCount = function() {
  if (!this.espaces_nettoyes) return 0;
  return Object.values(this.espaces_nettoyes).filter(espace => espace.nettoye === true).length;
};

NettoyageEspacesPublics.prototype.getTachesTermineesCount = function() {
  if (!this.taches_effectuees) return 0;
  return Object.values(this.taches_effectuees).filter(tache => tache.terminee === true).length;
};

NettoyageEspacesPublics.prototype.getVerificationComplete = function() {
  if (!this.verification_finale) return false;
  return Object.values(this.verification_finale).every(verif => verif.oui === true);
};

NettoyageEspacesPublics.prototype.getStatutColor = function() {
  const colors = {
    'En cours': 'yellow',
    'Terminé': 'blue',
    'Validé': 'green',
    'Rejeté': 'red'
  };
  return colors[this.statut] || 'gray';
};

NettoyageEspacesPublics.prototype.getShiftColor = function() {
  const colors = {
    'Matin': 'yellow',
    'Après-midi': 'blue',
    'Soir': 'purple',
    'Nuit': 'indigo'
  };
  return colors[this.shift] || 'gray';
};

// Class methods
NettoyageEspacesPublics.getStatsByDate = async function(dateDebut, dateFin) {
  const whereClause = {};
  
  if (dateDebut && dateFin) {
    whereClause.date_nettoyage = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_nettoyages'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Terminé" THEN 1 END')), 'nettoyages_termines'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Validé" THEN 1 END')), 'nettoyages_valides'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Rejeté" THEN 1 END')), 'nettoyages_rejetes'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "En cours" THEN 1 END')), 'nettoyages_en_cours']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_nettoyages: 0,
    nettoyages_termines: 0,
    nettoyages_valides: 0,
    nettoyages_rejetes: 0,
    nettoyages_en_cours: 0
  };
};

NettoyageEspacesPublics.getStatsByAgent = async function(agentId, dateDebut, dateFin) {
  const whereClause = {
    agent_id: agentId
  };
  
  if (dateDebut && dateFin) {
    whereClause.date_nettoyage = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_nettoyages'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Terminé" THEN 1 END')), 'nettoyages_termines'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Validé" THEN 1 END')), 'nettoyages_valides'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Rejeté" THEN 1 END')), 'nettoyages_rejetes']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_nettoyages: 0,
    nettoyages_termines: 0,
    nettoyages_valides: 0,
    nettoyages_rejetes: 0
  };
};

NettoyageEspacesPublics.getStatsByShift = async function(shift, dateDebut, dateFin) {
  const whereClause = {
    shift: shift
  };
  
  if (dateDebut && dateFin) {
    whereClause.date_nettoyage = {
      [sequelize.Sequelize.Op.between]: [dateDebut, dateFin]
    };
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_nettoyages'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Terminé" THEN 1 END')), 'nettoyages_termines'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Validé" THEN 1 END')), 'nettoyages_valides'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN statut = "Rejeté" THEN 1 END')), 'nettoyages_rejetes']
    ],
    raw: true
  });
  
  return stats[0] || {
    total_nettoyages: 0,
    nettoyages_termines: 0,
    nettoyages_valides: 0,
    nettoyages_rejetes: 0
  };
};

// Associations
NettoyageEspacesPublics.associate = function(models) {
  // Association avec User (agent)
  NettoyageEspacesPublics.belongsTo(models.User, {
    foreignKey: 'agent_id',
    as: 'agent'
  });
  
  // Association avec User (superviseur)
  NettoyageEspacesPublics.belongsTo(models.User, {
    foreignKey: 'superviseur_id',
    as: 'superviseur'
  });
  
  // Association avec User (créateur)
  NettoyageEspacesPublics.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createur'
  });
  
  // Association avec User (modificateur)
  NettoyageEspacesPublics.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'modificateur'
  });
};

module.exports = NettoyageEspacesPublics;
