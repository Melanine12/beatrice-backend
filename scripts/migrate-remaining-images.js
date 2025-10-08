#!/usr/bin/env node

/**
 * Script de migration des images restantes vers Cloudinary
 * Migre les images qui n'ont pas encore de public_id
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../server/config/database');
const ProblematiqueImage = require('../server/models/ProblematiqueImage');
const { CloudinaryService } = require('../server/services/cloudinaryService');

class RemainingImagesMigrationService {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.uploadDir = path.join(__dirname, '../uploads/problematiques');
  }

  async initialize() {
    try {
      console.log('🚀 Initialisation du service de migration des images restantes...');
      
      // Tester la connexion à la base de données
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie');
      
      // Tester la connexion Cloudinary
      const testResult = await CloudinaryService.uploadImage(Buffer.from('test'), 'test', {
        public_id: 'test_migration'
      });
      
      if (testResult.success) {
        console.log('✅ Connexion Cloudinary établie');
        // Supprimer l'image de test
        await CloudinaryService.deleteImage('test_migration');
      } else {
        throw new Error('Impossible de se connecter à Cloudinary');
      }
      
      console.log('🎯 Service de migration initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  async migrateRemainingImages() {
    try {
      console.log('🔄 Début de la migration des images restantes...');
      
      // Récupérer les images sans public_id
      const imagesToMigrate = await ProblematiqueImage.findAll({
        where: {
          public_id: null,
          statut: 'actif'
        }
      });
      
      console.log(`📊 ${imagesToMigrate.length} images à migrer trouvées`);
      
      if (imagesToMigrate.length === 0) {
        console.log('✅ Aucune image à migrer');
        return;
      }
      
      // Migrer chaque image
      for (const image of imagesToMigrate) {
        try {
          console.log(`🔄 Migration de l'image ${image.id}: ${image.nom_fichier}`);
          
          // Construire le chemin du fichier local
          const localFilePath = path.join(this.uploadDir, image.nom_fichier);
          
          // Vérifier si le fichier existe
          try {
            await fs.access(localFilePath);
          } catch (error) {
            console.log(`   ⚠️ Fichier local non trouvé: ${localFilePath}`);
            console.log(`   🗑️ Suppression de l'entrée de base de données...`);
            
            // Supprimer l'entrée de base de données
            await image.destroy();
            console.log(`   ✅ Entrée supprimée de la base de données`);
            continue;
          }
          
          // Lire le fichier
          const imageBuffer = await fs.readFile(localFilePath);
          console.log(`   📁 Fichier lu: ${imageBuffer.length} bytes`);
          
          // Upload vers Cloudinary
          const uploadResult = await CloudinaryService.uploadImage(imageBuffer, 'problematiques', {
            public_id: `problematiques/${image.problematique_id}/${image.nom_fichier.replace(/\.[^/.]+$/, '')}`,
            folder: 'problematiques'
          });
          
          if (uploadResult.success) {
            console.log(`   ☁️ Upload Cloudinary réussi: ${uploadResult.public_id}`);
            
            // Mettre à jour la base de données
            await image.update({
              public_id: uploadResult.public_id,
              chemin_fichier: uploadResult.secure_url,
              cloudinary_data: {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url,
                url: uploadResult.url,
                created_at: uploadResult.created_at,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
                bytes: uploadResult.bytes
              }
            });
            
            console.log(`   ✅ Base de données mise à jour`);
            this.migratedCount++;
            
            // Supprimer le fichier local
            await fs.unlink(localFilePath);
            console.log(`   🗑️ Fichier local supprimé`);
            
          } else {
            throw new Error(uploadResult.error);
          }
          
        } catch (error) {
          console.error(`❌ Erreur lors de la migration de l'image ${image.id}:`, error.message);
          this.errorCount++;
        }
      }
      
      console.log('\n🎉 Migration terminée !');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  }

  async verifyMigration() {
    try {
      console.log('\n🔍 Vérification de la migration...');
      
      // Compter les images migrées
      const migratedImages = await ProblematiqueImage.count({
        where: {
          public_id: { [sequelize.Sequelize.Op.ne]: null },
          statut: 'actif'
        }
      });
      
      // Compter les images non migrées
      const nonMigratedImages = await ProblematiqueImage.count({
        where: {
          public_id: null,
          statut: 'actif'
        }
      });
      
      // Compter les images avec URLs Cloudinary
      const cloudinaryUrls = await ProblematiqueImage.count({
        where: {
          chemin_fichier: { [sequelize.Sequelize.Op.like]: 'https://res.cloudinary.com/%' },
          statut: 'actif'
        }
      });
      
      console.log(`📊 Images migrées vers Cloudinary: ${migratedImages}`);
      console.log(`📊 Images non migrées: ${nonMigratedImages}`);
      console.log(`📊 Images avec URLs Cloudinary: ${cloudinaryUrls}`);
      
      if (nonMigratedImages === 0) {
        console.log('✅ Toutes les images sont migrées vers Cloudinary !');
      } else {
        console.log('⚠️ Il reste des images non migrées');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
    }
  }

  printSummary() {
    console.log('\n📊 RÉSUMÉ DE LA MIGRATION');
    console.log('============================');
    console.log(`✅ Images migrées: ${this.migratedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    console.log(`☁️ Total sur Cloudinary: ${this.migratedCount}`);
  }
}

// Fonction principale
async function main() {
  const migrationService = new RemainingImagesMigrationService();
  
  try {
    await migrationService.initialize();
    await migrationService.migrateRemainingImages();
    await migrationService.verifyMigration();
    
    console.log('\n🎉 Migration des images restantes terminée avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = RemainingImagesMigrationService;
