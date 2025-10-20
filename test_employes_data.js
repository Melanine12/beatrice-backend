const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function checkEmployesData() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Vérification de la table tbl_employes...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tbl_employes'");
    
    if (tables.length === 0) {
      console.log('❌ La table tbl_employes n\'existe pas!');
      return;
    }
    
    console.log('✅ La table tbl_employes existe');
    
    // Compter les employés
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM tbl_employes');
    const total = countResult[0].total;
    console.log(`📊 Nombre total d'employés: ${total}`);
    
    if (total > 0) {
      // Récupérer quelques employés
      const [employes] = await connection.execute(`
        SELECT id, civilite, nom_famille, prenoms, poste, statut 
        FROM tbl_employes 
        LIMIT 5
      `);
      
      console.log('👥 Premiers employés:');
      employes.forEach(emp => {
        console.log(`  - ${emp.civilite} ${emp.prenoms} ${emp.nom_famille} (${emp.poste}) - ${emp.statut}`);
      });
    } else {
      console.log('⚠️  Aucun employé trouvé dans la base de données');
    }
    
    await connection.end();
    console.log('✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkEmployesData();
