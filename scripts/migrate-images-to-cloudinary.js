#!/usr/bin/env node

/**
 * Script de migration des images existantes vers Cloudinary
 * Ce script lit les images stockées localement et les upload vers Cloudinary
 */

require('dotenv').config({ path: '../../.env' });
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require('../server/config/database');
const ProblematiqueImage = require('../server/models/ProblematiqueImage');
const { CloudinaryService } = require('../server/services/cloudinaryService');

class ImageMigrationService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/problematiques');
    this.migratedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  async initialize() {
    try {
      console.log('🚀 Initialisation du service de migration...');
      
      // Tester la connexion à la base de données
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie');
      
      // Tester la connexion Cloudinary avec une vraie image
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const testResult = await CloudinaryService.uploadImage(
        testImageBuffer, 
        'test', 
        { public_id: 'migration_test' }
      );
      
      if (testResult.success) {
        console.log('✅ Connexion Cloudinary établie');
        // Supprimer l'image de test
        await CloudinaryService.deleteImage('migration_test');
      } else {
        throw new Error('Impossible de se connecter à Cloudinary');
      }
      
      console.log('🎯 Service de migration initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  async migrateImages() {
    try {
      console.log('📁 Début de la migration des images...');
      
      // Récupérer toutes les images non migrées
      const images = await ProblematiqueImage.findAll({
        where: {
          public_id: null,
          statut: 'actif'
        }
      });
      
      console.log(`📊 ${images.length} images à migrer trouvées`);
      
      if (images.length === 0) {
        console.log('✅ Aucune image à migrer');
        return;
      }
      
      // Traiter chaque image
      for (const image of images) {
        try {
          await this.migrateSingleImage(image);
          this.migratedCount++;
          
          // Pause pour éviter de surcharger Cloudinary
          await this.sleep(100);
          
        } catch (error) {
          console.error(`❌ Erreur lors de la migration de l'image ${image.id}:`, error);
          this.errorCount++;
        }
      }
      
      console.log('🎉 Migration terminée !');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  }

  async migrateSingleImage(image) {
    try {
      console.log(`🔄 Migration de l'image ${image.id}: ${image.nom_fichier}`);
      
      // Construire le chemin complet du fichier
      const filePath = path.join(this.uploadDir, image.nom_fichier);
      
      // Vérifier que le fichier existe
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log(`⚠️ Fichier non trouvé: ${filePath}`);
        this.skippedCount++;
        return;
      }
      
      // Lire le fichier
      const fileBuffer = await fs.readFile(filePath);
      console.log(`📖 Fichier lu: ${fileBuffer.length} bytes`);
      
      // Upload vers Cloudinary
      const folder = `problematiques/${image.problematique_id}`;
      const publicId = `problematique_${image.problematique_id}_${image.id}`;
      
      console.log(`☁️ Upload vers Cloudinary: ${folder}/${publicId}`);
      
      const uploadResult = await CloudinaryService.uploadImage(fileBuffer, folder, {
        public_id: publicId,
        overwrite: false
      });
      
      if (!uploadResult.success) {
        throw new Error(`Erreur upload: ${uploadResult.error}`);
      }
      
      // Mettre à jour la base de données
      await image.update({
        public_id: uploadResult.public_id,
        cloudinary_data: {
          migrated: true,
          migration_date: new Date(),
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          url: uploadResult.url,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          created_at: uploadResult.created_at
        }
      });
      
      console.log(`✅ Image ${image.id} migrée avec succès: ${uploadResult.public_id}`);
      
    } catch (error) {
      console.error(`❌ Erreur migration image ${image.id}:`, error);
      throw error;
    }
  }

  async cleanupLocalFiles() {
    try {
      console.log('🧹 Nettoyage des fichiers locaux...');
      
      // Récupérer toutes les images migrées
      const migratedImages = await ProblematiqueImage.findAll({
        where: {
          public_id: { [sequelize.Op.ne]: null },
          statut: 'actif'
        }
      });
      
      console.log(`📊 ${migratedImages.length} images migrées trouvées`);
      
      let deletedCount = 0;
      
      for (const image of migratedImages) {
        try {
          const filePath = path.join(this.uploadDir, image.nom_fichier);
          
          // Vérifier que le fichier existe
          try {
            await fs.access(filePath);
          } catch (error) {
            // Fichier déjà supprimé
            continue;
          }
          
          // Supprimer le fichier local
          await fs.unlink(filePath);
          deletedCount++;
          
          console.log(`🗑️ Fichier local supprimé: ${image.nom_fichier}`);
          
        } catch (error) {
          console.error(`❌ Erreur suppression fichier ${image.nom_fichier}:`, error);
        }
      }
      
      console.log(`✅ ${deletedCount} fichiers locaux supprimés`);
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  printSummary() {
    console.log('\n📊 RÉSUMÉ DE LA MIGRATION');
    console.log('========================');
    console.log(`✅ Images migrées: ${this.migratedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    console.log(`⚠️ Ignorées: ${this.skippedCount}`);
    console.log(`📁 Total traité: ${this.migratedCount + this.errorCount + this.skippedCount}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Fonction principale
async function main() {
  const migrationService = new ImageMigrationService();
  
  try {
    await migrationService.initialize();
    await migrationService.migrateImages();
    
    // Demander confirmation pour le nettoyage
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n🧹 Voulez-vous supprimer les fichiers locaux migrés ? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await migrationService.cleanupLocalFiles();
      } else {
        console.log('ℹ️ Fichiers locaux conservés');
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

module.exports = ImageMigrationService;
