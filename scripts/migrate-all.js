// Script pour exécuter toutes les migrations en utilisant .env
require('dotenv').config();
const { sequelize } = require('../server/config/database');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  try {
    console.log('🔍 Connexion à la base de données...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'hotel_beatrice'}`);
    
    await sequelize.authenticate();
    console.log('✅ Connexion réussie\n');

    // Créer la table SequelizeMeta si elle n'existe pas
    const queryInterface = sequelize.getQueryInterface();
    try {
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true
        }
      });
      console.log('📋 Table SequelizeMeta créée\n');
    } catch (error) {
      // La table existe déjà, c'est normal
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Lire toutes les migrations
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'migrate-all.js')
      .sort();

    console.log(`📦 ${files.length} migration(s) trouvée(s)\n`);

    // Vérifier quelles migrations ont déjà été exécutées
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM SequelizeMeta',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const executedNames = executedMigrations.map(m => m.name);

    let executedCount = 0;
    for (const file of files) {
      const migrationName = file;
      
      if (executedNames.includes(migrationName)) {
        console.log(`⏭️  ${migrationName} - déjà exécutée`);
        continue;
      }

      try {
        console.log(`🔄 Exécution de ${migrationName}...`);
        const migrationPath = path.join(migrationsDir, file);
        const migration = require(migrationPath);
        
        await migration.up(queryInterface, Sequelize);
        
        // Enregistrer la migration comme exécutée
        await sequelize.query(
          `INSERT INTO SequelizeMeta (name) VALUES ('${migrationName}')`
        );
        
        console.log(`✅ ${migrationName} - exécutée avec succès\n`);
        executedCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de ${migrationName}:`, error.message);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log('✅ Toutes les migrations sont déjà à jour !');
    } else {
      console.log(`\n🎉 ${executedCount} migration(s) exécutée(s) avec succès !`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runAllMigrations();

