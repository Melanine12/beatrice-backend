const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('../server/config/database');

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '..', 'migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ],
    pattern: /\.js$/
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

async function runMigrations() {
  try {
    console.log('🔍 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('📦 Exécution des migrations...');
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('✅ Aucune nouvelle migration à exécuter');
    } else {
      console.log(`✅ ${migrations.length} migration(s) exécutée(s) avec succès:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.file}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();

