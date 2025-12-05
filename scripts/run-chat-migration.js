const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/config/database');

async function runChatMigration() {
  try {
    console.log('🚀 Démarrage de la migration des tables de chat...\n');

    // Vérifier la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, '../migrations/create_chat_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Lecture du fichier de migration...');
    console.log('📋 Exécution des commandes SQL...\n');

    // Nettoyer le SQL : supprimer les commentaires et les lignes vides
    let cleanSql = sql
      .split('\n')
      .map(line => {
        // Supprimer les commentaires en ligne
        const commentIndex = line.indexOf('--');
        if (commentIndex !== -1) {
          line = line.substring(0, commentIndex);
        }
        return line.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');

    // Diviser en commandes principales (CREATE TABLE et ALTER TABLE)
    const createTableRegex = /CREATE TABLE[^;]+;/gi;
    const alterTableRegex = /ALTER TABLE[^;]+;/gi;
    
    const createCommands = cleanSql.match(createTableRegex) || [];
    const alterCommands = cleanSql.match(alterTableRegex) || [];
    
    const allCommands = [...createCommands, ...alterCommands];

    console.log(`📝 ${allCommands.length} commande(s) SQL trouvée(s)\n`);

    // Exécuter les commandes une par une
    for (let i = 0; i < allCommands.length; i++) {
      const command = allCommands[i].trim();
      if (command) {
        try {
          const commandType = command.substring(0, command.indexOf(' ')).toUpperCase();
          console.log(`⏳ Exécution: ${commandType}...`);
          await sequelize.query(command);
          console.log(`✅ Commande ${i + 1}/${allCommands.length} exécutée avec succès\n`);
        } catch (error) {
          // Si c'est une erreur "table already exists" ou "constraint already exists", on continue
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate key name') ||
              error.message.includes('Duplicate foreign key') ||
              error.message.includes('Duplicate constraint')) {
            console.log(`⚠️  Commande ${i + 1}: ${error.message.split('\n')[0]}\n`);
          } else {
            console.error(`❌ Erreur sur la commande ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    // Vérifier que les tables ont été créées
    console.log('🔍 Vérification des tables créées...\n');
    
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('tbl_conversations', 'tbl_messages')
    `);

    if (tables.length === 2) {
      console.log('✅ Les deux tables ont été créées avec succès:');
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    } else {
      console.log('⚠️  Certaines tables n\'ont pas été créées:');
      const createdTables = tables.map(t => t.TABLE_NAME);
      if (!createdTables.includes('tbl_conversations')) {
        console.log('   ❌ tbl_conversations manquante');
      }
      if (!createdTables.includes('tbl_messages')) {
        console.log('   ❌ tbl_messages manquante');
      }
    }

    // Vérifier la structure des tables
    console.log('\n📊 Structure des tables:\n');
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`📋 ${tableName}:`);
      columns.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}${defaultValue}`);
      });
      console.log('');
    }

    console.log('🎉 Migration terminée avec succès !\n');
    console.log('💡 Les tables de chat sont maintenant prêtes à être utilisées.');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
if (require.main === module) {
  runChatMigration()
    .then(() => {
      console.log('\n✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runChatMigration };

