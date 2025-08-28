/**
 * Service de réinitialisation des tables
 * Permet de vider et réinitialiser les données des différentes tables
 */

const { sequelize } = require('../config/database');
const Problematique = require('../models/Problematique');
const ProblematiqueImage = require('../models/ProblematiqueImage');
const Depense = require('../models/Depense');
const User = require('../models/User');
const Chambre = require('../models/Chambre');
const Departement = require('../models/Departement');
const SousDepartement = require('../models/SousDepartement');
const Tache = require('../models/Tache');
const Demande = require('../models/Demande');
const Caisse = require('../models/Caisse');
const Paiement = require('../models/Paiement');
const Notification = require('../models/Notification');
const AffectationChambre = require('../models/AffectationChambre');
const Inventaire = require('../models/Inventaire');
const Fournisseur = require('../models/Fournisseur');
const Achat = require('../models/Achat');
const LigneAchat = require('../models/LigneAchat');
const MouvementStock = require('../models/MouvementStock');
const Entrepot = require('../models/Entrepot');
const DemandeAffectation = require('../models/DemandeAffectation');
const DemandeAffectationLigne = require('../models/DemandeAffectationLigne');
const DemandeFonds = require('../models/DemandeFonds');
const LigneDemandeFonds = require('../models/LigneDemandeFonds');
const FicheExecution = require('../models/FicheExecution');
const ElementIntervention = require('../models/ElementIntervention');
const CycleVieArticle = require('../models/CycleVieArticle');
const Buanderie = require('../models/Buanderie');
const PaiementPartiel = require('../models/PaiementPartiel');
const RappelPaiement = require('../models/RappelPaiement');

class ResetService {
  constructor() {
    this.resetFunctions = {
      problematiques: this.resetProblematiques.bind(this),
      depenses: this.resetDepenses.bind(this),
      users: this.resetUsers.bind(this),
      chambres: this.resetChambres.bind(this),
      departements: this.resetDepartements.bind(this),
      taches: this.resetTaches.bind(this),
      demandes: this.resetDemandes.bind(this),
      caisses: this.resetCaisses.bind(this),
      paiements: this.resetPaiements.bind(this),
      notifications: this.resetNotifications.bind(this),
      affectations_chambres: this.resetAffectationsChambres.bind(this),
      inventaire: this.resetInventaire.bind(this),
      fournisseurs: this.resetFournisseurs.bind(this),
      achats: this.resetAchats.bind(this),
      lignes_achat: this.resetLignesAchat.bind(this),
      mouvements_stock: this.resetMouvementsStock.bind(this),
      entrepots: this.resetEntrepots.bind(this),
      demandes_affectation: this.resetDemandesAffectation.bind(this),
      demandes_affectation_lignes: this.resetDemandesAffectationLignes.bind(this),
      demandes_fonds: this.resetDemandesFonds.bind(this),
      lignes_demandes_fonds: this.resetLignesDemandesFonds.bind(this),
      fiches_execution: this.resetFichesExecution.bind(this),
      elements_intervention: this.resetElementsIntervention.bind(this),
      cycle_vie_articles: this.resetCycleVieArticles.bind(this),
      buanderie: this.resetBuanderie.bind(this),
      paiements_partiels: this.resetPaiementsPartiels.bind(this),
      rappels_paiement: this.resetRappelsPaiement.bind(this)
    };
  }

  /**
   * Réinitialiser une table spécifique
   */
  async resetTable(tableName, options = {}) {
    try {
      console.log(`🔄 Début de la réinitialisation de la table: ${tableName}`);
      
      if (!this.resetFunctions[tableName]) {
        throw new Error(`Table '${tableName}' non supportée`);
      }

      const result = await this.resetFunctions[tableName](options);
      
      console.log(`✅ Réinitialisation de ${tableName} terminée avec succès`);
      return {
        success: true,
        table: tableName,
        message: `Table ${tableName} réinitialisée avec succès`,
        details: result
      };
      
    } catch (error) {
      console.error(`❌ Erreur lors de la réinitialisation de ${tableName}:`, error);
      return {
        success: false,
        table: tableName,
        error: error.message
      };
    }
  }

  /**
   * Réinitialiser toutes les tables
   */
  async resetAllTables(options = {}) {
    try {
      console.log('🔄 Début de la réinitialisation de toutes les tables...');
      
      const results = {};
      const tableNames = Object.keys(this.resetFunctions);
      
      for (const tableName of tableNames) {
        console.log(`🔄 Réinitialisation de ${tableName}...`);
        results[tableName] = await this.resetTable(tableName, options);
      }
      
      console.log('✅ Réinitialisation de toutes les tables terminée');
      return {
        success: true,
        message: 'Toutes les tables ont été réinitialisées',
        results
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation globale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Réinitialiser la table des problématiques
   */
  async resetProblematiques(options = {}) {
    const { keepImages = false } = options;
    
    // Supprimer d'abord les images si demandé
    if (!keepImages) {
      const imageCount = await ProblematiqueImage.count();
      if (imageCount > 0) {
        console.log(`🗑️ Suppression de ${imageCount} images...`);
        await ProblematiqueImage.destroy({ where: {} });
        console.log('✅ Images supprimées');
      }
    }
    
    // Supprimer les problématiques
    const problematiqueCount = await Problematique.count();
    if (problematiqueCount > 0) {
      console.log(`🗑️ Suppression de ${problematiqueCount} problématiques...`);
      await Problematique.destroy({ where: {} });
      console.log('✅ Problématiques supprimées');
    }
    
    return {
      problematiquesDeleted: problematiqueCount,
      imagesDeleted: keepImages ? 0 : await ProblematiqueImage.count()
    };
  }

  /**
   * Réinitialiser la table des dépenses
   */
  async resetDepenses(options = {}) {
    const depenseCount = await Depense.count();
    if (depenseCount > 0) {
      console.log(`🗑️ Suppression de ${depenseCount} dépenses...`);
      await Depense.destroy({ where: {} });
      console.log('✅ Dépenses supprimées');
    }
    
    return { depensesDeleted: depenseCount };
  }

  /**
   * Réinitialiser la table des utilisateurs (garder l'admin)
   */
  async resetUsers(options = {}) {
    const { keepAdmin = true } = options;
    
    let whereClause = {};
    if (keepAdmin) {
      whereClause = { role: { [sequelize.Sequelize.Op.ne]: 'Admin' } };
    }
    
    const userCount = await User.count({ where: whereClause });
    if (userCount > 0) {
      console.log(`🗑️ Suppression de ${userCount} utilisateurs...`);
      await User.destroy({ where: whereClause });
      console.log('✅ Utilisateurs supprimés');
    }
    
    return { usersDeleted: userCount, adminKept: keepAdmin };
  }

  /**
   * Réinitialiser la table des chambres
   */
  async resetChambres(options = {}) {
    const chambreCount = await Chambre.count();
    if (chambreCount > 0) {
      console.log(`🗑️ Suppression de ${chambreCount} chambres...`);
      await Chambre.destroy({ where: {} });
      console.log('✅ Chambres supprimées');
    }
    
    return { chambresDeleted: chambreCount };
  }

  /**
   * Réinitialiser la table des départements
   */
  async resetDepartements(options = {}) {
    const departementCount = await Departement.count();
    if (departementCount > 0) {
      console.log(`🗑️ Suppression de ${departementCount} départements...`);
      await Departement.destroy({ where: {} });
      console.log('✅ Départements supprimés');
    }
    
    return { departementsDeleted: departementCount };
  }

  /**
   * Réinitialiser la table des tâches
   */
  async resetTaches(options = {}) {
    const tacheCount = await Tache.count();
    if (tacheCount > 0) {
      console.log(`🗑️ Suppression de ${tacheCount} tâches...`);
      await Tache.destroy({ where: {} });
      console.log('✅ Tâches supprimées');
    }
    
    return { tachesDeleted: tacheCount };
  }

  /**
   * Réinitialiser la table des demandes
   */
  async resetDemandes(options = {}) {
    const demandeCount = await Demande.count();
    if (demandeCount > 0) {
      console.log(`🗑️ Suppression de ${demandeCount} demandes...`);
      await Demande.destroy({ where: {} });
      console.log('✅ Demandes supprimées');
    }
    
    return { demandesDeleted: demandeCount };
  }

  /**
   * Réinitialiser la table des caisses
   */
  async resetCaisses(options = {}) {
    const caisseCount = await Caisse.count();
    if (caisseCount > 0) {
      console.log(`🗑️ Suppression de ${caisseCount} caisses...`);
      await Caisse.destroy({ where: {} });
      console.log('✅ Caisses supprimées');
    }
    
    return { caissesDeleted: caisseCount };
  }

  /**
   * Réinitialiser la table des paiements
   */
  async resetPaiements(options = {}) {
    const paiementCount = await Paiement.count();
    if (paiementCount > 0) {
      console.log(`🗑️ Suppression de ${paiementCount} paiements...`);
      await Paiement.destroy({ where: {} });
      console.log('✅ Paiements supprimés');
    }
    
    return { paiementsDeleted: paiementCount };
  }

  /**
   * Réinitialiser la table des notifications
   */
  async resetNotifications(options = {}) {
    const notificationCount = await Notification.count();
    if (notificationCount > 0) {
      console.log(`🗑️ Suppression de ${notificationCount} notifications...`);
      await Notification.destroy({ where: {} });
      console.log('✅ Notifications supprimées');
    }
    
    return { notificationsDeleted: notificationCount };
  }

  /**
   * Réinitialiser la table des affectations de chambres
   */
  async resetAffectationsChambres(options = {}) {
    try {
      const affectationCount = await AffectationChambre.count();
      if (affectationCount > 0) {
        console.log(`🗑️ Suppression de ${affectationCount} affectations de chambres...`);
        await AffectationChambre.destroy({ where: {} });
        console.log('✅ Affectations de chambres supprimées');
      }
      
      return { affectationsChambresDeleted: affectationCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des affectations de chambres:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table de l'inventaire
   */
  async resetInventaire(options = {}) {
    try {
      const inventaireCount = await Inventaire.count();
      if (inventaireCount > 0) {
        console.log(`🗑️ Suppression de ${inventaireCount} articles d'inventaire...`);
        await Inventaire.destroy({ where: {} });
        console.log('✅ Articles d\'inventaire supprimés');
      }
      
      return { inventaireDeleted: inventaireCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de l'inventaire:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des fournisseurs
   */
  async resetFournisseurs(options = {}) {
    try {
      const fournisseurCount = await Fournisseur.count();
      if (fournisseurCount > 0) {
        console.log(`🗑️ Suppression de ${fournisseurCount} fournisseurs...`);
        await Fournisseur.destroy({ where: {} });
        console.log('✅ Fournisseurs supprimés');
      }
      
      return { fournisseursDeleted: fournisseurCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des fournisseurs:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des achats
   */
  async resetAchats(options = {}) {
    try {
      const achatCount = await Achat.count();
      if (achatCount > 0) {
        console.log(`🗑️ Suppression de ${achatCount} achats...`);
        await Achat.destroy({ where: {} });
        console.log('✅ Achats supprimés');
      }
      
      return { achatsDeleted: achatCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des achats:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des lignes d'achat
   */
  async resetLignesAchat(options = {}) {
    try {
      const ligneAchatCount = await LigneAchat.count();
      if (ligneAchatCount > 0) {
        console.log(`🗑️ Suppression de ${ligneAchatCount} lignes d'achat...`);
        await LigneAchat.destroy({ where: {} });
        console.log('✅ Lignes d\'achat supprimées');
      }
      
      return { lignesAchatDeleted: ligneAchatCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des lignes d'achat:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des mouvements de stock
   */
  async resetMouvementsStock(options = {}) {
    try {
      const mouvementCount = await MouvementStock.count();
      if (mouvementCount > 0) {
        console.log(`🗑️ Suppression de ${mouvementCount} mouvements de stock...`);
        await MouvementStock.destroy({ where: {} });
        console.log('✅ Mouvements de stock supprimés');
      }
      
      return { mouvementsStockDeleted: mouvementCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des mouvements de stock:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des entrepôts
   */
  async resetEntrepots(options = {}) {
    try {
      const entrepotCount = await Entrepot.count();
      if (entrepotCount > 0) {
        console.log(`🗑️ Suppression de ${entrepotCount} entrepôts...`);
        await Entrepot.destroy({ where: {} });
        console.log('✅ Entrepôts supprimés');
      }
      
      return { entrepotsDeleted: entrepotCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des entrepôts:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des demandes d'affectation
   */
  async resetDemandesAffectation(options = {}) {
    try {
      const demandeCount = await DemandeAffectation.count();
      if (demandeCount > 0) {
        console.log(`🗑️ Suppression de ${demandeCount} demandes d'affectation...`);
        await DemandeAffectation.destroy({ where: {} });
        console.log('✅ Demandes d\'affectation supprimées');
      }
      
      return { demandesAffectationDeleted: demandeCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des demandes d'affectation:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des lignes de demandes d'affectation
   */
  async resetDemandesAffectationLignes(options = {}) {
    try {
      const ligneCount = await DemandeAffectationLigne.count();
      if (ligneCount > 0) {
        console.log(`🗑️ Suppression de ${ligneCount} lignes de demandes d'affectation...`);
        await DemandeAffectationLigne.destroy({ where: {} });
        console.log('✅ Lignes de demandes d\'affectation supprimées');
      }
      
      return { demandesAffectationLignesDeleted: ligneCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des lignes de demandes d'affectation:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des demandes de fonds
   */
  async resetDemandesFonds(options = {}) {
    try {
      const demandeCount = await DemandeFonds.count();
      if (demandeCount > 0) {
        console.log(`🗑️ Suppression de ${demandeCount} demandes de fonds...`);
        await DemandeFonds.destroy({ where: {} });
        console.log('✅ Demandes de fonds supprimées');
      }
      
      return { demandesFondsDeleted: demandeCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des demandes de fonds:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des lignes de demandes de fonds
   */
  async resetLignesDemandesFonds(options = {}) {
    try {
      const ligneCount = await LigneDemandeFonds.count();
      if (ligneCount > 0) {
        console.log(`🗑️ Suppression de ${ligneCount} lignes de demandes de fonds...`);
        await LigneDemandeFonds.destroy({ where: {} });
        console.log('✅ Lignes de demandes de fonds supprimées');
      }
      
      return { lignesDemandesFondsDeleted: ligneCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des lignes de demandes de fonds:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des fiches d'exécution
   */
  async resetFichesExecution(options = {}) {
    try {
      const ficheCount = await FicheExecution.count();
      if (ficheCount > 0) {
        console.log(`🗑️ Suppression de ${ficheCount} fiches d'exécution...`);
        await FicheExecution.destroy({ where: {} });
        console.log('✅ Fiches d\'exécution supprimées');
      }
      
      return { fichesExecutionDeleted: ficheCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des fiches d'exécution:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des éléments d'intervention
   */
  async resetElementsIntervention(options = {}) {
    try {
      const elementCount = await ElementIntervention.count();
      if (elementCount > 0) {
        console.log(`🗑️ Suppression de ${elementCount} éléments d'intervention...`);
        await ElementIntervention.destroy({ where: {} });
        console.log('✅ Éléments d\'intervention supprimés');
      }
      
      return { elementsInterventionDeleted: elementCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des éléments d'intervention:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table du cycle de vie des articles
   */
  async resetCycleVieArticles(options = {}) {
    try {
      const cycleCount = await CycleVieArticle.count();
      if (cycleCount > 0) {
        console.log(`🗑️ Suppression de ${cycleCount} cycles de vie d'articles...`);
        await CycleVieArticle.destroy({ where: {} });
        console.log('✅ Cycles de vie d\'articles supprimés');
      }
      
      return { cycleVieArticlesDeleted: cycleCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des cycles de vie d'articles:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table de la buanderie
   */
  async resetBuanderie(options = {}) {
    try {
      const buanderieCount = await Buanderie.count();
      if (buanderieCount > 0) {
        console.log(`🗑️ Suppression de ${buanderieCount} éléments de buanderie...`);
        await Buanderie.destroy({ where: {} });
        console.log('✅ Éléments de buanderie supprimés');
      }
      
      return { buanderieDeleted: buanderieCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des éléments de buanderie:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des paiements partiels
   */
  async resetPaiementsPartiels(options = {}) {
    try {
      const paiementCount = await PaiementPartiel.count();
      if (paiementCount > 0) {
        console.log(`🗑️ Suppression de ${paiementCount} paiements partiels...`);
        await PaiementPartiel.destroy({ where: {} });
        console.log('✅ Paiements partiels supprimés');
      }
      
      return { paiementsPartielsDeleted: paiementCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des paiements partiels:`, error.message);
      throw error;
    }
  }

  /**
   * Réinitialiser la table des rappels de paiement
   */
  async resetRappelsPaiement(options = {}) {
    try {
      const rappelCount = await RappelPaiement.count();
      if (rappelCount > 0) {
        console.log(`🗑️ Suppression de ${rappelCount} rappels de paiement...`);
        await RappelPaiement.destroy({ where: {} });
        console.log('✅ Rappels de paiement supprimés');
      }
      
      return { rappelsPaiementDeleted: rappelCount };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des rappels de paiement:`, error.message);
      throw error;
    }
  }

  /**
   * Obtenir la liste des tables disponibles
   */
  getAvailableTables() {
    return Object.keys(this.resetFunctions).map(table => ({
      name: table,
      displayName: this.getTableDisplayName(table),
      description: this.getTableDescription(table)
    }));
  }

  /**
   * Obtenir le nom d'affichage d'une table
   */
  getTableDisplayName(tableName) {
    const names = {
      problematiques: 'Problématiques',
      depenses: 'Dépenses',
      users: 'Utilisateurs',
      chambres: 'Chambres',
      departements: 'Départements',
      taches: 'Tâches',
      demandes: 'Demandes',
      caisses: 'Caisses',
      paiements: 'Paiements',
      notifications: 'Notifications',
      affectations_chambres: 'Affectations de Chambres',
      inventaire: 'Inventaire',
      fournisseurs: 'Fournisseurs',
      achats: 'Achats',
      lignes_achat: 'Lignes d\'Achat',
      mouvements_stock: 'Mouvements de Stock',
      entrepots: 'Entrepôts',
      demandes_affectation: 'Demandes d\'Affectation',
      demandes_affectation_lignes: 'Lignes de Demandes d\'Affectation',
      demandes_fonds: 'Demandes de Fonds',
      lignes_demandes_fonds: 'Lignes de Demandes de Fonds',
      fiches_execution: 'Fiches d\'Exécution',
      elements_intervention: 'Éléments d\'Intervention',
      cycle_vie_articles: 'Cycle de Vie des Articles',
      buanderie: 'Buanderie',
      paiements_partiels: 'Paiements Partiels',
      rappels_paiement: 'Rappels de Paiement'
    };
    return names[tableName] || tableName;
  }

  /**
   * Obtenir la description d'une table
   */
  getTableDescription(tableName) {
    const descriptions = {
      problematiques: 'Problèmes et incidents signalés',
      depenses: 'Dépenses et coûts enregistrés',
      users: 'Utilisateurs du système',
      chambres: 'Chambres et espaces de l\'hôtel',
      departements: 'Départements de l\'organisation',
      taches: 'Tâches et missions assignées',
      demandes: 'Demandes et requêtes',
      caisses: 'Caisses et comptes de trésorerie',
      paiements: 'Paiements et transactions',
      notifications: 'Notifications système',
      affectations_chambres: 'Affectations et réservations de chambres',
      inventaire: 'Articles et stocks d\'inventaire',
      fournisseurs: 'Fournisseurs et partenaires commerciaux',
      achats: 'Commandes et achats effectués',
      lignes_achat: 'Détails des lignes d\'achat',
      mouvements_stock: 'Mouvements et variations de stock',
      entrepots: 'Entrepôts et lieux de stockage',
      demandes_affectation: 'Demandes d\'affectation de ressources',
      demandes_affectation_lignes: 'Détails des demandes d\'affectation',
      demandes_fonds: 'Demandes de fonds et budgets',
      lignes_demandes_fonds: 'Détails des demandes de fonds',
      fiches_execution: 'Fiches d\'exécution des tâches',
      elements_intervention: 'Éléments et composants d\'intervention',
      cycle_vie_articles: 'Cycle de vie et maintenance des articles',
      buanderie: 'Gestion de la buanderie et du linge',
      paiements_partiels: 'Paiements partiels et échelonnés',
      rappels_paiement: 'Rappels et relances de paiement'
    };
    return descriptions[tableName] || 'Table de données';
  }
}

module.exports = new ResetService();
