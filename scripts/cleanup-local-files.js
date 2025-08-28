#!/usr/bin/env node

/**
 * Script de nettoyage définitif des fichiers locaux
 * Supprime tous les fichiers du dossier uploads après migration vers Cloudinary
 */

require('dotenv').config({ path: '../.env' });
const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../server/config/database');
const ProblematiqueImage = require('../server/models/ProblematiqueImage');

class LocalFilesCleanupService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/problematiques');
    this.thumbnailsDir = path.join(__dirname, '../uploads/problematiques/thumbnails');
    this.deletedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    try {
      console.log('🧹 Service de nettoyage des fichiers locaux initialisé...');
      
      // Tester la connexion à la base de données
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie');
      
      console.log('🎯 Service de nettoyage initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  async cleanupLocalFiles() {
    try {
      console.log('🧹 Début du nettoyage des fichiers locaux...');
      
      // Vérifier que le dossier uploads existe
      try {
        await fs.access(this.uploadDir);
      } catch (error) {
        console.log('⚠️ Dossier uploads non trouvé, rien à nettoyer');
        return;
      }
      
      // Lister tous les fichiers dans le dossier uploads
      const files = await fs.readdir(this.uploadDir);
      console.log(`📁 ${files.length} éléments trouvés dans le dossier uploads`);
      
      // Supprimer les fichiers (sauf .DS_Store et dossiers)
      for (const file of files) {
        try {
          const filePath = path.join(this.uploadDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && file !== '.DS_Store') {
            await fs.unlink(filePath);
            this.deletedCount++;
            console.log(`🗑️ Fichier supprimé: ${file}`);
          } else if (stats.isDirectory()) {
            // Supprimer le dossier et son contenu
            await this.removeDirectoryRecursively(filePath);
            console.log(`🗑️ Dossier supprimé: ${file}`);
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la suppression de ${file}:`, error.message);
          this.errorCount++;
        }
      }
      
      // Supprimer le dossier uploads principal
      try {
        await fs.rmdir(this.uploadDir);
        console.log('🗑️ Dossier uploads supprimé');
      } catch (error) {
        console.log('⚠️ Impossible de supprimer le dossier uploads (peut-être déjà supprimé)');
      }
      
      console.log('🎉 Nettoyage terminé !');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  async removeDirectoryRecursively(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await this.removeDirectoryRecursively(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
      
      await fs.rmdir(dirPath);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression récursive de ${dirPath}:`, error.message);
    }
  }

  async verifyCloudinaryMigration() {
    try {
      console.log('\n🔍 Vérification de la migration Cloudinary...');
      
      // Compter les images migrées
      const migratedImages = await ProblematiqueImage.count({
        where: {
          public_id: { [sequelize.Op.ne]: null }
        }
      });
      
      // Compter les images non migrées
      const nonMigratedImages = await ProblematiqueImage.count({
        where: {
          public_id: { [sequelize.Sequelize.Op.ne]: null }
        }
      });
      
      console.log(`📊 Images migrées vers Cloudinary: ${migratedImages}`);
      console.log(`📊 Images non migrées: ${nonMigratedImages}`);
      
      if (nonMigratedImages > 0) {
        console.log('⚠️ ATTENTION: Il reste des images non migrées !');
        console.log('   Exécutez d\'abord le script de migration avant le nettoyage.');
        return false;
      }
      
      console.log('✅ Toutes les images sont migrées vers Cloudinary');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return false;
    }
  }

  printSummary() {
    console.log('\n📊 RÉSUMÉ DU NETTOYAGE');
    console.log('========================');
    console.log(`🗑️ Fichiers supprimés: ${this.deletedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    console.log(`📁 Dossier uploads: Supprimé`);
    console.log(`☁️ Stockage: 100% Cloudinary`);
  }
}

// Fonction principale
async function main() {
  const cleanupService = new LocalFilesCleanupService();
  
  try {
    await cleanupService.initialize();
    
    // Vérifier que toutes les images sont migrées
    const canProceed = await cleanupService.verifyCloudinaryMigration();
    
    if (!canProceed) {
      console.log('\n❌ Nettoyage annulé. Migrez d\'abord toutes les images vers Cloudinary.');
      process.exit(1);
    }
    
    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n⚠️ ATTENTION: Cette action est IRREVERSIBLE !\n' +
                'Tous les fichiers locaux seront supprimés définitivement.\n' +
                'Voulez-vous continuer ? (y/N): ', async (answer) => {
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🧹 Début du nettoyage...');
        await cleanupService.cleanupLocalFiles();
        console.log('\n🎉 Nettoyage terminé avec succès !');
        console.log('Votre application utilise maintenant 100% Cloudinary !');
      } else {
        console.log('\nℹ️ Nettoyage annulé par l\'utilisateur');
      }
      
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = LocalFilesCleanupService;
