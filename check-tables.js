const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function checkTables() {
  try {
    console.log('🔍 Vérification des tables...');
    
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier si les tables existent
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('contrats', 'documents_rh')
    `);
    
    console.log('📋 Tables trouvées:', results.map(r => r.table_name));
    
    if (results.length === 0) {
      console.log('❌ Aucune des tables contrats ou documents_rh n\'existe');
      console.log('💡 Vous devez exécuter les migrations ou créer les tables manuellement');
    } else if (results.length === 1) {
      console.log('⚠️  Une seule table existe:', results[0].table_name);
    } else {
      console.log('✅ Les deux tables existent');
    }
    
    // Vérifier la structure des tables si elles existent
    for (const table of results) {
      console.log(`\n🔍 Structure de la table ${table.table_name}:`);
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '${table.table_name}'
        ORDER BY ordinal_position
      `);
      
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
