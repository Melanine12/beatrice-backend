/**
 * Migration : étape "Demande d'explication" sur tbl_sanctions_pro (production ou local).
 * Charge les variables depuis backend/.env et exécute les ALTER TABLE.
 *
 * Usage (depuis la racine du projet) :
 *   node backend/scripts/run-sanctions-pro-demande-explication-migration.js
 *
 * Ou depuis backend/ :
 *   node scripts/run-sanctions-pro-demande-explication-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../server/config/database');

const SQL_STEPS = [
  `ALTER TABLE tbl_sanctions_pro
   MODIFY COLUMN statut ENUM(
     'en_attente','approuve','rejete','annule','en_analyse_rh','classement_sans_suite',
     'convocation_envoyee','demande_explication_recue','entretien_realise',
     'sanction_validee','sanction_notifiee','dossier_cloture'
   ) NOT NULL DEFAULT 'en_attente'`,
  `ALTER TABLE tbl_sanctions_pro
   ADD COLUMN date_demande_explication DATE NULL COMMENT 'Date dépôt demande explication' AFTER date_convocation`
];

async function run() {
  try {
    console.log('Connexion à la base...', process.env.DB_HOST);
    await sequelize.authenticate();
    console.log('Connexion OK.\n');

    for (let i = 0; i < SQL_STEPS.length; i++) {
      const step = i + 1;
      console.log(`Étape ${step}/${SQL_STEPS.length}...`);
      try {
        await sequelize.query(SQL_STEPS[i]);
        console.log(`  Étape ${step} OK.`);
      } catch (err) {
        if (err.message && (err.message.includes('Duplicate column') || err.message.includes('already exists'))) {
          console.log(`  Étape ${step} déjà appliquée (ignorée).`);
        } else {
          throw err;
        }
      }
    }

    console.log('\nMigration terminée avec succès.');
  } catch (err) {
    console.error('Erreur migration:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
