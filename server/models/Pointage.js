const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pointage = sequelize.define('Pointage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    employe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'employé'
    },
    date_pointage: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date du pointage (YYYY-MM-DD)'
    },
    present: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '1 si présent, 0 si absent'
    },
    heure_arrivee: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Heure d\'arrivée (optionnel)'
    },
    heure_depart: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Heure de départ (optionnel)'
    },
    commentaires: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Commentaires sur le pointage'
    },
    type_pointage: {
      type: DataTypes.ENUM('Manuel', 'Automatique', 'Correction'),
      allowNull: false,
      defaultValue: 'Manuel',
      comment: 'Type de pointage'
    },
    valide_par: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID du superviseur qui a validé'
    },
    date_validation: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de validation'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'utilisateur qui a créé l\'enregistrement'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de l\'utilisateur qui a modifié l\'enregistrement'
    }
  }, {
    tableName: 'tbl_pointages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['employe_id', 'date_pointage'],
        name: 'unique_employe_date'
      },
      {
        fields: ['employe_id'],
        name: 'idx_employe_id'
      },
      {
        fields: ['date_pointage'],
        name: 'idx_date_pointage'
      },
      {
        fields: ['present'],
        name: 'idx_present'
      },
      {
        fields: ['type_pointage'],
        name: 'idx_type_pointage'
      },
      {
        fields: ['valide_par'],
        name: 'idx_valide_par'
      },
      {
        fields: ['created_by'],
        name: 'idx_created_by'
      },
      {
        fields: ['updated_by'],
        name: 'idx_updated_by'
      }
    ],
    hooks: {
      beforeCreate: (pointage, options) => {
        if (options.user) {
          pointage.created_by = options.user.id;
        }
      },
      beforeUpdate: (pointage, options) => {
        if (options.user) {
          pointage.updated_by = options.user.id;
        }
      }
    }
  });

  // Définir les associations
  Pointage.associate = (models) => {
    // Association avec l'employé
    Pointage.belongsTo(models.Employe, {
      foreignKey: 'employe_id',
      as: 'Employe',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Association avec le validateur
    Pointage.belongsTo(models.User, {
      foreignKey: 'valide_par',
      as: 'Validateur',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Association avec le créateur
    Pointage.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'Createur',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // Association avec le modificateur
    Pointage.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'Modificateur',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  // Méthodes d'instance
  Pointage.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Formater les heures si elles existent
    if (values.heure_arrivee) {
      values.heure_arrivee = values.heure_arrivee.substring(0, 5); // HH:MM
    }
    if (values.heure_depart) {
      values.heure_depart = values.heure_depart.substring(0, 5); // HH:MM
    }
    
    return values;
  };

  // Méthodes statiques
  Pointage.getPointagesByMonth = async function(year, month, employeId = null) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const whereClause = {
      date_pointage: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (employeId) {
      whereClause.employe_id = employeId;
    }
    
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Employe,
          as: 'Employe',
          attributes: ['id', 'nom_famille', 'prenoms', 'email_personnel', 'poste']
        },
        {
          model: sequelize.models.User,
          as: 'Validateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: sequelize.models.User,
          as: 'Createur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['date_pointage', 'DESC'], ['created_at', 'DESC']]
    });
  };

  Pointage.getStatsByMonth = async function(year, month, employeId = null) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();
    
    const whereClause = {
      date_pointage: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (employeId) {
      whereClause.employe_id = employeId;
    }
    
    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'employe_id',
        [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'total_pointages'],
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('present')), 'total_presences'],
        [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('present')), 'taux_presence']
      ],
      include: [
        {
          model: sequelize.models.Employe,
          as: 'Employe',
          attributes: ['id', 'nom_famille', 'prenoms', 'email_personnel']
        }
      ],
      group: ['employe_id'],
      raw: false
    });
    
    return {
      totalDays: daysInMonth,
      stats: stats.map(stat => ({
        employe: stat.Employe,
        totalPointages: parseInt(stat.dataValues.total_pointages),
        totalPresences: parseInt(stat.dataValues.total_presences),
        tauxPresence: Math.round(parseFloat(stat.dataValues.taux_presence) * 100)
      }))
    };
  };

  return Pointage;
};

