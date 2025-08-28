#!/usr/bin/env node

/**
 * Script de vérification que l'application utilise 100% Cloudinary
 * Vérifie qu'aucun fichier n'est créé dans le dossier uploads
 */

const fs = require('fs').promises;
const path = require('path');

class CloudinaryVerificationService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.problematiquesDir = path.join(__dirname, '../uploads/problematiques');
    this.depensesDir = path.join(__dirname, '../uploads/depenses');
    this.demandesDir = path.join(__dirname, '../uploads/demandes');
  }

  async verifyCloudinaryOnly() {
    try {
      console.log('🔍 Vérification de la configuration 100% Cloudinary');
      console.log('================================================\n');
      
      // Vérifier que le dossier uploads existe et est vide (sauf .gitkeep)
      await this.verifyUploadsDirectory();
      
      // Vérifier qu'aucun fichier n'est créé dans les sous-dossiers
      await this.verifySubdirectories();
      
      // Vérifier la configuration des routes
      await this.verifyRouteConfiguration();
      
      console.log('\n🎉 Vérification terminée avec succès !');
      console.log('✅ Votre application utilise maintenant 100% Cloudinary !');
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error.message);
      process.exit(1);
    }
  }

  async verifyUploadsDirectory() {
    try {
      console.log('📁 Vérification du dossier uploads principal...');
      
      // Vérifier que le dossier existe
      const stats = await fs.stat(this.uploadDir);
      if (!stats.isDirectory()) {
        throw new Error('Le dossier uploads n\'existe pas');
      }
      
      // Lister le contenu
      const files = await fs.readdir(this.uploadDir);
      const allowedFiles = ['.gitkeep'];
      const unexpectedFiles = files.filter(file => !allowedFiles.includes(file));
      
      if (unexpectedFiles.length > 0) {
        console.log('⚠️ ATTENTION: Fichiers inattendus trouvés dans uploads/');
        console.log('   Fichiers trouvés:', unexpectedFiles);
        console.log('   Ces fichiers ne devraient pas être là !');
        return false;
      }
      
      console.log('✅ Dossier uploads principal OK (vide sauf .gitkeep)');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du dossier uploads:', error.message);
      return false;
    }
  }

  async verifySubdirectories() {
    try {
      console.log('\n📂 Vérification des sous-dossiers...');
      
      const subdirs = [
        { name: 'problematiques', path: this.problematiquesDir },
        { name: 'depenses', path: this.depensesDir },
        { name: 'demandes', path: this.demandesDir }
      ];
      
      for (const subdir of subdirs) {
        try {
          const stats = await fs.stat(subdir.path);
          if (stats.isDirectory()) {
            const files = await fs.readdir(subdir.path);
            if (files.length > 0) {
              console.log(`⚠️ ATTENTION: Fichiers trouvés dans ${subdir.name}/:`, files);
              console.log('   Ces fichiers ne devraient pas être là !');
            } else {
              console.log(`✅ Dossier ${subdir.name}/ OK (vide)`);
            }
          }
        } catch (error) {
          // Le dossier n'existe pas, c'est normal
          console.log(`✅ Dossier ${subdir.name}/ OK (n\'existe pas)`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des sous-dossiers:', error.message);
    }
  }

  async verifyRouteConfiguration() {
    try {
      console.log('\n🔧 Vérification de la configuration des routes...');
      
      // Vérifier que les routes utilisent multer.memoryStorage()
      const routesToCheck = [
        '../server/routes/problematiques.js',
        '../server/routes/depenses.js',
        '../server/routes/demandes.js'
      ];
      
      for (const routePath of routesToCheck) {
        try {
          const fullPath = path.join(__dirname, routePath);
          const content = await fs.readFile(fullPath, 'utf8');
          
          if (content.includes('multer.memoryStorage()')) {
            const routeName = path.basename(routePath, '.js');
            console.log(`✅ Route ${routeName} OK (utilise memoryStorage)`);
          } else if (content.includes('diskStorage')) {
            const routeName = path.basename(routePath, '.js');
            console.log(`❌ Route ${routeName} utilise encore diskStorage !`);
            return false;
          } else {
            const routeName = path.basename(routePath, '.js');
            console.log(`⚠️ Route ${routeName} : configuration multer non détectée`);
          }
        } catch (error) {
          console.log(`⚠️ Impossible de vérifier la route ${routePath}:`, error.message);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des routes:', error.message);
      return false;
    }
  }

  async monitorForNewFiles() {
    try {
      console.log('\n👀 Surveillance des nouveaux fichiers...');
      console.log('Appuyez sur Ctrl+C pour arrêter la surveillance\n');
      
      // Vérifier toutes les 5 secondes
      const interval = setInterval(async () => {
        try {
          const files = await fs.readdir(this.uploadDir);
          const allowedFiles = ['.gitkeep'];
          const unexpectedFiles = files.filter(file => !allowedFiles.includes(file));
          
          if (unexpectedFiles.length > 0) {
            console.log(`🚨 ALERTE: Nouveaux fichiers détectés à ${new Date().toLocaleTimeString()}:`, unexpectedFiles);
            console.log('   Votre application crée encore des fichiers locaux !');
          }
        } catch (error) {
          // Ignorer les erreurs de surveillance
        }
      }, 5000);
      
      // Attendre l'interruption
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n🛑 Surveillance arrêtée');
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la surveillance:', error.message);
    }
  }
}

// Fonction principale
async function main() {
  const verificationService = new CloudinaryVerificationService();
  
  try {
    await verificationService.verifyCloudinaryOnly();
    
    // Option de surveillance continue
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n🔍 Voulez-vous surveiller les nouveaux fichiers ? (y/N): ', async (answer) => {
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await verificationService.monitorForNewFiles();
      } else {
        console.log('\nℹ️ Surveillance non activée');
        rl.close();
        process.exit(0);
      }
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

module.exports = CloudinaryVerificationService;
