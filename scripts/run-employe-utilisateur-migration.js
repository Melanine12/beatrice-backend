/**
 * Création de la table tbl_employe_utilisateur (liaison employé ↔ utilisateur).
 * Charge les variables depuis backend/.env.
 *
 * Usage : node backend/scripts/run-employe-utilisateur-migration.js
 * (depuis la racine du projet) ou depuis backend/ : node scripts/run-employe-utilisateur-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/config/database');

const SQL = fs.readFileSync(
  path.join(__dirname, '../../database/create_tbl_employe_utilisateur.sql'),
  'utf8'
);

async function run() {
  try {
    console.log('Connexion à la base...', process.env.DB_HOST);
    await sequelize.authenticate();
    console.log('Connexion OK.\n');
    console.log('Création de la table tbl_employe_utilisateur...');
    await sequelize.query(SQL);
    console.log('Table créée avec succès.');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('La table existe déjà.');
    } else {
      console.error('Erreur:', err.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

run();
