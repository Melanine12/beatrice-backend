/**
 * Création de la table tbl_inspections + données initiales.
 *
 * Usage:
 * - depuis la racine: node backend/scripts/run-inspections-migration.js
 * - depuis backend/:  node scripts/run-inspections-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/config/database');

const SQL = fs.readFileSync(
  path.join(__dirname, '../../database/create_tbl_inspections.sql'),
  'utf8'
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connexion base OK');
    const statements = SQL
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sequelize.query(statement);
    }
    console.log('Table tbl_inspections créée (ou déjà existante), données initiales insérées.');
  } catch (err) {
    console.error('Erreur migration inspections:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
