/**
 * Création de la table tbl_maintenances_recurrentes.
 *
 * Usage:
 * - depuis la racine: node backend/scripts/run-maintenances-recurrentes-migration.js
 * - depuis backend/:  node scripts/run-maintenances-recurrentes-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/config/database');

const SQL = fs.readFileSync(
  path.join(__dirname, '../../database/create_tbl_maintenances_recurrentes.sql'),
  'utf8'
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connexion base OK');
    await sequelize.query(SQL);
    console.log('Table tbl_maintenances_recurrentes créée (ou déjà existante).');
  } catch (err) {
    console.error('Erreur migration maintenances récurrentes:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
