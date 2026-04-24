require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../server/config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connexion base OK');

    const [exists] = await sequelize.query(`
      SELECT 1 AS ok
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tbl_maintenances_recurrentes'
        AND COLUMN_NAME = 'is_inspected'
      LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (!exists) {
      await sequelize.query(`
        ALTER TABLE tbl_maintenances_recurrentes
        ADD COLUMN is_inspected TINYINT(1) NOT NULL DEFAULT 0 AFTER destinataires_emails
      `);
      await sequelize.query(`
        CREATE INDEX idx_maint_recurrentes_is_inspected
        ON tbl_maintenances_recurrentes (is_inspected)
      `);
      console.log('Colonne is_inspected ajoutée.');
    } else {
      console.log('Colonne is_inspected existe déjà.');
    }
  } catch (err) {
    console.error('Erreur migration is_inspected:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
