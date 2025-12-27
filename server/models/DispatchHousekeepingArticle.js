const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DispatchHousekeepingArticle = sequelize.define('DispatchHousekeepingArticle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dispatch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_dispatch_housekeeping',
      key: 'id'
    }
  },
  inventaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_inventaire',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'tbl_dispatch_housekeeping_articles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    afterCreate: async (dispatchArticle, options) => {
      // Vérifier le stock après création d'un dispatch article
      try {
        const stockMonitoringService = require('../services/stockMonitoringService');
        const DispatchHousekeeping = require('./DispatchHousekeeping');
        const dispatch = await DispatchHousekeeping.findByPk(dispatchArticle.dispatch_id);
        if (dispatch && dispatch.chambre_id) {
          // Vérifier l'article après un court délai pour éviter les appels multiples
          setTimeout(() => {
            stockMonitoringService.checkArticleAfterChange(dispatchArticle.inventaire_id, dispatch.chambre_id)
              .catch(err => console.error('Error checking article after dispatch creation:', err));
          }, 1000);
        }
      } catch (error) {
        console.error('Error in DispatchHousekeepingArticle afterCreate hook:', error);
      }
    },
    afterUpdate: async (dispatchArticle, options) => {
      // Vérifier le stock après mise à jour d'un dispatch article
      try {
        const stockMonitoringService = require('../services/stockMonitoringService');
        const DispatchHousekeeping = require('./DispatchHousekeeping');
        const dispatch = await DispatchHousekeeping.findByPk(dispatchArticle.dispatch_id);
        if (dispatch && dispatch.chambre_id) {
          setTimeout(() => {
            stockMonitoringService.checkArticleAfterChange(dispatchArticle.inventaire_id, dispatch.chambre_id)
              .catch(err => console.error('Error checking article after dispatch update:', err));
          }, 1000);
        }
      } catch (error) {
        console.error('Error in DispatchHousekeepingArticle afterUpdate hook:', error);
      }
    },
    afterDestroy: async (dispatchArticle, options) => {
      // Vérifier le stock après suppression d'un dispatch article
      try {
        const stockMonitoringService = require('../services/stockMonitoringService');
        const DispatchHousekeeping = require('./DispatchHousekeeping');
        const dispatch = await DispatchHousekeeping.findByPk(dispatchArticle.dispatch_id);
        if (dispatch && dispatch.chambre_id) {
          setTimeout(() => {
            stockMonitoringService.checkArticleAfterChange(dispatchArticle.inventaire_id, dispatch.chambre_id)
              .catch(err => console.error('Error checking article after dispatch deletion:', err));
          }, 1000);
        }
      } catch (error) {
        console.error('Error in DispatchHousekeepingArticle afterDestroy hook:', error);
      }
    }
  }
});

module.exports = DispatchHousekeepingArticle;
