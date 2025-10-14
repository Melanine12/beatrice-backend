const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckLinge = sequelize.define('CheckLinge', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date_check: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date du check linge'
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'agent qui effectue le check'
    },
    nom_agent: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nom de l\'agent'
    },
    chambre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de la chambre'
    },
    numero_chambre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Numéro de la chambre'
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'article (linge)'
    },
    nom_article: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nom de l\'article'
    },
    code_produit: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Code produit de l\'article'
    },
    categorie: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Catégorie de l\'article'
    },
    quantite_affectee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Quantité affectée à la chambre'
    },
    quantite_propre: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Quantité de linge propre'
    },
    quantite_sale: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Quantité de linge sale'
    },
    quantite_totale: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.quantite_propre + this.quantite_sale;
      },
      comment: 'Quantité totale (propre + sale)'
    },
    quantite_manquante: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.quantite_affectee - (this.quantite_propre + this.quantite_sale);
      },
      comment: 'Quantité manquante'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes sur l\'état du linge'
    },
    statut: {
      type: DataTypes.ENUM('En cours', 'Terminé', 'Validé', 'Rejeté'),
      allowNull: false,
      defaultValue: 'En cours',
      comment: 'Statut du check'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Utilisateur qui a créé l\'enregistrement'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Utilisateur qui a modifié l\'enregistrement'
    }
  }, {
    tableName: 'tbl_check_linge',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['date_check']
      },
      {
        fields: ['agent_id']
      },
      {
        fields: ['chambre_id']
      },
      {
        fields: ['article_id']
      },
      {
        fields: ['statut']
      },
      {
        fields: ['date_check', 'agent_id']
      },
      {
        fields: ['date_check', 'chambre_id']
      }
    ],
    hooks: {
      beforeValidate: (checkLinge) => {
        // Validation des quantités
        if (checkLinge.quantite_propre + checkLinge.quantite_sale > checkLinge.quantite_affectee) {
          throw new Error('La quantité totale ne peut pas dépasser la quantité affectée');
        }
      },
      beforeCreate: (checkLinge) => {
        // Calculer les quantités virtuelles
        checkLinge.quantite_totale = checkLinge.quantite_propre + checkLinge.quantite_sale;
        checkLinge.quantite_manquante = checkLinge.quantite_affectee - checkLinge.quantite_totale;
      },
      beforeUpdate: (checkLinge) => {
        // Recalculer les quantités virtuelles
        checkLinge.quantite_totale = checkLinge.quantite_propre + checkLinge.quantite_sale;
        checkLinge.quantite_manquante = checkLinge.quantite_affectee - checkLinge.quantite_totale;
      }
    }
  });

  // Méthodes d'instance
  CheckLinge.prototype.isCompleted = function() {
    return this.statut === 'Terminé' || this.statut === 'Validé';
  };

  CheckLinge.prototype.hasMissingItems = function() {
    return this.quantite_manquante > 0;
  };

  CheckLinge.prototype.getCompletionPercentage = function() {
    if (this.quantite_affectee === 0) return 0;
    return Math.round((this.quantite_totale / this.quantite_affectee) * 100);
  };

  CheckLinge.prototype.getStatusColor = function() {
    const colors = {
      'En cours': 'yellow',
      'Terminé': 'blue',
      'Validé': 'green',
      'Rejeté': 'red'
    };
    return colors[this.statut] || 'gray';
  };

  // Méthodes de classe
  CheckLinge.getStatsByDate = async function(date) {
    const { QueryTypes } = require('sequelize');
    
    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(quantite_affectee) as total_quantite_affectee,
        SUM(quantite_propre) as total_quantite_propre,
        SUM(quantite_sale) as total_quantite_sale,
        SUM(quantite_totale) as total_quantite_totale,
        SUM(quantite_manquante) as total_quantite_manquante,
        COUNT(CASE WHEN statut = 'Terminé' THEN 1 END) as checks_termines,
        COUNT(CASE WHEN statut = 'Validé' THEN 1 END) as checks_valides,
        COUNT(CASE WHEN quantite_manquante > 0 THEN 1 END) as checks_avec_manquants
      FROM tbl_check_linge 
      WHERE date_check = :date
    `, {
      replacements: { date },
      type: QueryTypes.SELECT
    });

    return stats[0] || {};
  };

  CheckLinge.getStatsByAgent = async function(agentId, startDate, endDate) {
    const { QueryTypes } = require('sequelize');
    
    const stats = await sequelize.query(`
      SELECT 
        agent_id,
        nom_agent,
        COUNT(DISTINCT date_check) as jours_travailles,
        COUNT(DISTINCT chambre_id) as chambres_verifiees,
        COUNT(*) as total_checks,
        SUM(quantite_affectee) as total_quantite_affectee,
        SUM(quantite_propre) as total_quantite_propre,
        SUM(quantite_sale) as total_quantite_sale,
        SUM(quantite_totale) as total_quantite_totale,
        SUM(quantite_manquante) as total_quantite_manquante,
        AVG(quantite_manquante) as moyenne_manquants
      FROM tbl_check_linge 
      WHERE agent_id = :agentId
      AND date_check BETWEEN :startDate AND :endDate
      GROUP BY agent_id, nom_agent
    `, {
      replacements: { agentId, startDate, endDate },
      type: QueryTypes.SELECT
    });

    return stats[0] || {};
  };

  CheckLinge.getStatsByChambre = async function(chambreId, startDate, endDate) {
    const { QueryTypes } = require('sequelize');
    
    const stats = await sequelize.query(`
      SELECT 
        chambre_id,
        numero_chambre,
        COUNT(DISTINCT date_check) as jours_verifies,
        COUNT(*) as total_checks,
        SUM(quantite_affectee) as total_quantite_affectee,
        SUM(quantite_propre) as total_quantite_propre,
        SUM(quantite_sale) as total_quantite_sale,
        SUM(quantite_totale) as total_quantite_totale,
        SUM(quantite_manquante) as total_quantite_manquante,
        AVG(quantite_manquante) as moyenne_manquants,
        MAX(date_check) as derniere_verification
      FROM tbl_check_linge 
      WHERE chambre_id = :chambreId
      AND date_check BETWEEN :startDate AND :endDate
      GROUP BY chambre_id, numero_chambre
    `, {
      replacements: { chambreId, startDate, endDate },
      type: QueryTypes.SELECT
    });

    return stats[0] || {};
  };

  return CheckLinge;
};
