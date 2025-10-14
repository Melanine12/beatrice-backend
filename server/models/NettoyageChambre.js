const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NettoyageChambre = sequelize.define('NettoyageChambre', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Informations générales
    nom_agent: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    date_nettoyage: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: '2020-01-01'
      }
    },
    numero_chambre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    type_chambre: {
      type: DataTypes.ENUM('Standard', 'Twis', 'Suite Junior', 'Suite diplomatique'),
      allowNull: false,
      validate: {
        isIn: [['Standard', 'Twis', 'Suite Junior', 'Suite diplomatique']]
      }
    },
    heure_entree: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    heure_sortie: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    signature: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    // État de la chambre avant nettoyage (JSON)
    etat_avant_nettoyage: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isObject(value) {
          if (typeof value !== 'object' || value === null) {
            throw new Error('État avant nettoyage doit être un objet');
          }
        }
      }
    },
    
    // Tâches de nettoyage effectuées (JSON)
    taches_nettoyage: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isObject(value) {
          if (typeof value !== 'object' || value === null) {
            throw new Error('Tâches de nettoyage doivent être un objet');
          }
        }
      }
    },
    
    // Statut et métadonnées
    statut: {
      type: DataTypes.ENUM('En cours', 'Terminé', 'Validé', 'Rejeté'),
      defaultValue: 'En cours',
      validate: {
        isIn: [['En cours', 'Terminé', 'Validé', 'Rejeté']]
      }
    },
    observations_generales: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Relations
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    chambre_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_chambres',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_utilisateurs',
        key: 'id'
      }
    }
  }, {
    tableName: 'tbl_nettoyage_chambres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Hooks
    hooks: {
      beforeValidate: (nettoyage) => {
        // Validation des heures
        if (nettoyage.heure_entree && nettoyage.heure_sortie) {
          const entree = new Date(`2000-01-01T${nettoyage.heure_entree}`);
          const sortie = new Date(`2000-01-01T${nettoyage.heure_sortie}`);
          
          if (entree >= sortie) {
            throw new Error('L\'heure de sortie doit être après l\'heure d\'entrée');
          }
        }
      }
    }
  });

  // Méthodes d'instance
  NettoyageChambre.prototype.getDureeNettoyage = function() {
    if (this.heure_entree && this.heure_sortie) {
      const entree = new Date(`2000-01-01T${this.heure_entree}`);
      const sortie = new Date(`2000-01-01T${this.heure_sortie}`);
      const diffMs = sortie - entree;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const heures = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${heures}h${minutes.toString().padStart(2, '0')}`;
    }
    return null;
  };

  NettoyageChambre.prototype.isCompleted = function() {
    return this.statut === 'Terminé' || this.statut === 'Validé';
  };

  NettoyageChambre.prototype.getStatutColor = function() {
    const colors = {
      'En cours': 'yellow',
      'Terminé': 'blue',
      'Validé': 'green',
      'Rejeté': 'red'
    };
    return colors[this.statut] || 'gray';
  };

  // Méthodes de classe
  NettoyageChambre.getStatsByAgent = async function(agentId, dateDebut, dateFin) {
    const whereClause = { agent_id: agentId };
    if (dateDebut) whereClause.date_nettoyage = { [sequelize.Sequelize.Op.gte]: dateDebut };
    if (dateFin) whereClause.date_nettoyage = { ...whereClause.date_nettoyage, [sequelize.Sequelize.Op.lte]: dateFin };

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut']
    });

    return stats.reduce((acc, stat) => {
      acc[stat.statut] = parseInt(stat.dataValues.count);
      return acc;
    }, {});
  };

  NettoyageChambre.getStatsByChambre = async function(chambreId, dateDebut, dateFin) {
    const whereClause = { chambre_id: chambreId };
    if (dateDebut) whereClause.date_nettoyage = { [sequelize.Sequelize.Op.gte]: dateDebut };
    if (dateFin) whereClause.date_nettoyage = { ...whereClause.date_nettoyage, [sequelize.Sequelize.Op.lte]: dateFin };

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut']
    });

    return stats.reduce((acc, stat) => {
      acc[stat.statut] = parseInt(stat.dataValues.count);
      return acc;
    }, {});
  };

  return NettoyageChambre;
};
