#!/usr/bin/env node

/**
 * Script de mise à jour des URLs Cloudinary dans la base de données
 * Met à jour le champ chemin_fichier avec les URLs Cloudinary
 */

require('dotenv').config();
const { sequelize } = require('../server/config/database');
const ProblematiqueImage = require('../server/models/ProblematiqueImage');

class CloudinaryUrlUpdateService {
  constructor() {
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    try {
      console.log('🚀 Initialisation du service de mise à jour des URLs Cloudinary...');
      
      // Tester la connexion à la base de données
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie');
      
      console.log('🎯 Service de mise à jour initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  async updateCloudinaryUrls() {
    try {
      console.log('🔄 Début de la mise à jour des URLs Cloudinary...');
      
      // Récupérer toutes les images avec public_id mais chemin_fichier local
      const imagesToUpdate = await ProblematiqueImage.findAll({
        where: {
          public_id: { [sequelize.Sequelize.Op.ne]: null },
          chemin_fichier: { [sequelize.Sequelize.Op.like]: '/uploads/%' },
          statut: 'actif'
        }
      });
      
      console.log(`📊 ${imagesToUpdate.length} images à mettre à jour trouvées`);
      
      if (imagesToUpdate.length === 0) {
        console.log('✅ Aucune image à mettre à jour');
        return;
      }
      
      // Mettre à jour chaque image
      for (const image of imagesToUpdate) {
        try {
          console.log(`🔄 Mise à jour de l'image ${image.id}: ${image.nom_fichier}`);
          
          // Construire l'URL Cloudinary
          const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${image.public_id}`;
          
          // Mettre à jour le chemin_fichier
          await image.update({
            chemin_fichier: cloudinaryUrl
          });
          
          console.log(`   ✅ URL mise à jour: ${cloudinaryUrl}`);
          this.updatedCount++;
          
        } catch (error) {
          console.error(`❌ Erreur lors de la mise à jour de l'image ${image.id}:`, error.message);
          this.errorCount++;
        }
      }
      
      console.log('\n🎉 Mise à jour terminée !');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  async verifyUpdates() {
    try {
      console.log('\n🔍 Vérification des mises à jour...');
      
      // Compter les images avec URLs Cloudinary
      const cloudinaryUrls = await ProblematiqueImage.count({
        where: {
          chemin_fichier: { [sequelize.Sequelize.Op.like]: 'https://res.cloudinary.com/%' },
          statut: 'actif'
        }
      });
      
      // Compter les images avec chemins locaux
      const localPaths = await ProblematiqueImage.count({
        where: {
          chemin_fichier: { [sequelize.Sequelize.Op.like]: '/uploads/%' },
          statut: 'actif'
        }
      });
      
      // Compter les images avec public_id
      const withPublicId = await ProblematiqueImage.count({
        where: {
          public_id: { [sequelize.Sequelize.Op.ne]: null },
          statut: 'actif'
        }
      });
      
      console.log(`📊 Images avec URLs Cloudinary: ${cloudinaryUrls}`);
      console.log(`📊 Images avec chemins locaux: ${localPaths}`);
      console.log(`📊 Images avec public_id: ${withPublicId}`);
      
      if (localPaths === 0) {
        console.log('✅ Toutes les images utilisent maintenant des URLs Cloudinary !');
      } else {
        console.log('⚠️ Il reste des images avec des chemins locaux');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
    }
  }

  printSummary() {
    console.log('\n📊 RÉSUMÉ DE LA MISE À JOUR');
    console.log('==============================');
    console.log(`✅ Images mises à jour: ${this.updatedCount}`);
    console.log(`❌ Erreurs: ${this.errorCount}`);
    console.log(`☁️ URLs Cloudinary: ${this.updatedCount}`);
  }
}

// Fonction principale
async function main() {
  const updateService = new CloudinaryUrlUpdateService();
  
  try {
    await updateService.initialize();
    await updateService.updateCloudinaryUrls();
    await updateService.verifyUpdates();
    
    console.log('\n🎉 Mise à jour des URLs Cloudinary terminée avec succès !');
    
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

module.exports = CloudinaryUrlUpdateService;
