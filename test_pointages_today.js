const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPointagesToday() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_beatrice'
  });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split('T')[0];
    
    console.log('📅 Date recherchée:', todayDate);
    console.log('📅 Date complète:', today.toISOString());
    
    // Test 1: Vérifier tous les pointages d'aujourd'hui
    const [allToday] = await connection.execute(
      `SELECT COUNT(*) as total, 
              COUNT(DISTINCT employe_id) as employes_distincts,
              SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as presents,
              SUM(CASE WHEN present = 0 THEN 1 ELSE 0 END) as absents
       FROM tbl_pointages 
       WHERE DATE(date_pointage) = DATE(?)`,
      [todayDate]
    );
    console.log('\n📊 Tous les pointages aujourd\'hui:', allToday[0]);
    
    // Test 2: Vérifier avec CURDATE()
    const [withCurdate] = await connection.execute(
      `SELECT COUNT(DISTINCT employe_id) as count 
       FROM tbl_pointages 
       WHERE DATE(date_pointage) = CURDATE()
       AND present = 1`
    );
    console.log('\n📊 Avec CURDATE():', withCurdate[0]);
    
    // Test 3: Vérifier les pointages récents avec present=1
    const [recent] = await connection.execute(
      `SELECT employe_id, date_pointage, present, DATE(date_pointage) as date_only
       FROM tbl_pointages 
       WHERE present = 1
       ORDER BY date_pointage DESC 
       LIMIT 10`
    );
    console.log('\n📊 Derniers pointages avec present=1:');
    recent.forEach(p => {
      console.log(`  - Employé ${p.employe_id}: ${p.date_pointage} (DATE: ${p.date_only}), present: ${p.present}`);
    });
    
    // Test 4: Vérifier le format exact de date_pointage
    const [formatCheck] = await connection.execute(
      `SELECT date_pointage, 
              DATE(date_pointage) as date_only,
              CURDATE() as mysql_today,
              DATE(date_pointage) = CURDATE() as matches_today
       FROM tbl_pointages 
       WHERE present = 1
       ORDER BY date_pointage DESC 
       LIMIT 5`
    );
    console.log('\n📊 Format de date_pointage:');
    formatCheck.forEach(p => {
      console.log(`  - date_pointage: ${p.date_pointage}, DATE(): ${p.date_only}, CURDATE(): ${p.mysql_today}, Match: ${p.matches_today}`);
    });
    
    // Test 5: Compter les employés présents avec la date exacte
    const [exactMatch] = await connection.execute(
      `SELECT COUNT(DISTINCT employe_id) as count 
       FROM tbl_pointages 
       WHERE DATE(date_pointage) = DATE(?)
       AND present = 1`,
      [todayDate]
    );
    console.log('\n📊 Employés présents avec DATE() et date exacte:', exactMatch[0]);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await connection.end();
  }
}

testPointagesToday();

