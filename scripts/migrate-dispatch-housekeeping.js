// Ce script utilise directement la configuration depuis .env via server/config/database.js
require('dotenv').config();
const { sequelize } = require('../server/config/database');
const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔍 Connexion à la base de données...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'hotel_beatrice'}`);
    
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    const migrationPath = path.join(__dirname, '..', 'migrations', '20250122000000-create-dispatch-housekeeping-tables.js');
    const migration = require(migrationPath);

    console.log('📦 Exécution de la migration dispatch housekeeping...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('✅ Migration exécutée avec succès !');
    console.log('   Tables créées:');
    console.log('   - tbl_dispatch_housekeeping');
    console.log('   - tbl_dispatch_housekeeping_articles');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();

