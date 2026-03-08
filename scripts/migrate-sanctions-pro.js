// Migration : création de la table tbl_sanctions_pro (sanctions disciplinaires - circuit Pro)
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../server/config/database');

async function run() {
  try {
    console.log('🔍 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie\n');

    const sqlPath = path.join(__dirname, '../../database/create_tbl_sanctions_pro.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Création de la table tbl_sanctions_pro...');
    await sequelize.query(sql);
    console.log('✅ Table tbl_sanctions_pro créée avec succès.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
