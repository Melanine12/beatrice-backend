const { sequelize } = require('./server/config/database');

async function fixPointagesForeignKey() {
  try {
    console.log('🔧 Début de la correction de la contrainte de clé étrangère des pointages...');
    
    // 1. Supprimer l'ancienne contrainte de clé étrangère
    console.log('1️⃣ Suppression de l\'ancienne contrainte fk_pointages_employe...');
    await sequelize.query(`
      ALTER TABLE \`tbl_pointages\` 
      DROP FOREIGN KEY \`fk_pointages_employe\`
    `);
    console.log('✅ Ancienne contrainte supprimée');
    
    // 2. Ajouter la nouvelle contrainte de clé étrangère vers tbl_employes
    console.log('2️⃣ Ajout de la nouvelle contrainte vers tbl_employes...');
    await sequelize.query(`
      ALTER TABLE \`tbl_pointages\` 
      ADD CONSTRAINT \`fk_pointages_employe\` 
      FOREIGN KEY (\`employe_id\`) 
      REFERENCES \`tbl_employes\` (\`id\`) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE
    `);
    console.log('✅ Nouvelle contrainte ajoutée');
    
    // 3. Vérifier que la contrainte a été correctement appliquée
    console.log('3️⃣ Vérification de la contrainte...');
    const [constraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE 
        TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_pointages' 
        AND CONSTRAINT_NAME = 'fk_pointages_employe'
    `);
    
    console.log('📋 Contraintes trouvées:', constraints);
    
    if (constraints.length > 0) {
      const constraint = constraints[0];
      if (constraint.REFERENCED_TABLE_NAME === 'tbl_employes') {
        console.log('✅ Contrainte correctement configurée vers tbl_employes');
      } else {
        console.log('❌ Contrainte pointe encore vers:', constraint.REFERENCED_TABLE_NAME);
      }
    } else {
      console.log('❌ Aucune contrainte trouvée');
    }
    
    console.log('🎉 Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    
    // Si l'erreur est que la contrainte n'existe pas, on continue
    if (error.message.includes('doesn\'t exist') || error.message.includes('does not exist')) {
      console.log('⚠️  L\'ancienne contrainte n\'existait pas, on ajoute directement la nouvelle...');
      try {
        await sequelize.query(`
          ALTER TABLE \`tbl_pointages\` 
          ADD CONSTRAINT \`fk_pointages_employe\` 
          FOREIGN KEY (\`employe_id\`) 
          REFERENCES \`tbl_employes\` (\`id\`) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
        `);
        console.log('✅ Nouvelle contrainte ajoutée avec succès');
      } catch (addError) {
        console.error('❌ Erreur lors de l\'ajout de la nouvelle contrainte:', addError.message);
      }
    }
  } finally {
    await sequelize.close();
  }
}

// Exécuter la correction
fixPointagesForeignKey();
