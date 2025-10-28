const { DataTypes, Sequelize, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Caisse = sequelize.define('Caisse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom de la caisse (ex: Caisse 1, Caisse principale)'
  },
  code_caisse: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Code unique de la caisse (ex: CAISSE-001)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de la caisse'
  },
  emplacement: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Emplacement physique de la caisse'
  },
  solde_initial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Solde initial de la caisse'
  },
  solde_actuel: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Solde actuel de la caisse (calculé automatiquement)'
  },
  devise: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
    comment: 'Devise de la caisse (EUR, USD, etc.)'
  },
  statut: {
    type: DataTypes.ENUM('Active', 'Inactive', 'En maintenance', 'Fermée'),
    allowNull: false,
    defaultValue: 'Active',
    comment: 'Statut de la caisse'
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'utilisateur responsable de la caisse'
  },
  date_ouverture: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'ouverture de la caisse'
  },
  date_fermeture: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fermeture de la caisse'
  },
  limite_retrait: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Limite de retrait quotidien'
  },
  limite_depot: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Limite de dépôt quotidien'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes additionnelles'
  }
}, {
  tableName: 'tbl_caisses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['code_caisse']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['responsable_id']
    }
  ]
});

// Méthode pour calculer le solde actuel basé sur le solde initial, paiements et dépenses
Caisse.prototype.calculerSoldeActuel = async function() {
  try {
    console.log('🔄 Début du calcul du solde pour la caisse:', this.id);
    const Depense = require('./Depense');
    const PaiementPartiel = require('./PaiementPartiel');
    const Encaissement = require('./Encaissement');
    
    // Récupérer la somme des encaissements liés à cette caisse (ENTRÉES)
    console.log('🔍 Recherche des encaissements pour la caisse:', this.id);
    const resultatEncaissements = await Encaissement.findAll({
      where: { 
        caisse_id: this.id,
        statut: 'Validé' // Seulement les encaissements validés
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('montant')), 'total_encaissements']
      ],
      raw: true
    });
    
    const totalEncaissements = parseFloat(resultatEncaissements[0]?.total_encaissements || 0);

    // Récupérer la somme des paiements partiels liés à cette caisse (DÉPENSES pour la caisse)
    console.log('🔍 Recherche des paiements partiels (dépenses) pour la caisse:', this.id);
    const resultatPaiementsPartiels = await PaiementPartiel.findOne({
      where: { 
        caisse_id: this.id
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('montant')), 'total_paiements_partiels']
      ],
      raw: true
    });

    // Récupérer la somme des dépenses liées à cette caisse
    console.log('🔍 Recherche des dépenses pour la caisse:', this.id);
    const resultatDepenses = await Depense.findOne({
      where: { 
        caisse_id: this.id,
        statut: {
          [Op.in]: ['Approuvée', 'Payée'] // Seulement les dépenses approuvées ou payées
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('montant')), 'total_depenses']
      ],
      raw: true
    });

    console.log('📊 Résultat des encaissements:', totalEncaissements);
    console.log('📊 Résultat des paiements partiels:', resultatPaiementsPartiels);
    console.log('📊 Résultat des dépenses:', resultatDepenses);
    
    const totalPaiementsPartiels = parseFloat(resultatPaiementsPartiels?.total_paiements_partiels || 0);
    const totalDepenses = parseFloat(resultatDepenses?.total_depenses || 0);
    const soldeInitial = parseFloat(this.solde_initial || 0);
    // Les paiements partiels sont des DÉPENSES pour la caisse (argent qui sort)
    const soldeActuel = soldeInitial + totalEncaissements - totalPaiementsPartiels - totalDepenses;

    console.log('💰 Calcul du solde:', {
      soldeInitial,
      totalEncaissements: `+${totalEncaissements} (entrées)`,
      totalPaiementsPartiels: `-${totalPaiementsPartiels} (dépenses partiels)`,
      totalDepenses: `-${totalDepenses} (dépenses)`,
      soldeActuel: `${soldeInitial} + ${totalEncaissements} - ${totalPaiementsPartiels} - ${totalDepenses} = ${soldeActuel}`
    });

    // Mettre à jour le solde actuel dans la base de données
    console.log('💾 Mise à jour du solde dans la base...');
    await this.update({ solde_actuel: soldeActuel });
    console.log('✅ Solde mis à jour avec succès');
    
    return soldeActuel;
  } catch (error) {
    console.error('❌ Erreur lors du calcul du solde actuel:', error);
    throw error;
  }
};

// Méthode statique pour calculer le solde d'une caisse par ID
Caisse.calculerSoldeParId = async function(caisseId) {
  try {
    const caisse = await Caisse.findByPk(caisseId);
    if (!caisse) {
      throw new Error('Caisse non trouvée');
    }
    return await caisse.calculerSoldeActuel();
  } catch (error) {
    console.error('Erreur lors du calcul du solde:', error);
    throw error;
  }
};

// Hook avant la création pour initialiser le solde actuel
Caisse.beforeCreate(async (caisse, options) => {
  if (caisse.solde_initial && !caisse.solde_actuel) {
    caisse.solde_actuel = caisse.solde_initial;
  }
});

// Hook après la création pour calculer le solde actuel
Caisse.afterCreate(async (caisse, options) => {
  try {
    await caisse.calculerSoldeActuel();
  } catch (error) {
    console.error('Erreur lors du calcul initial du solde:', error);
  }
});

module.exports = Caisse; 