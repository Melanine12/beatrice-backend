const Employe = require('./server/models/Employe');

async function checkEmployes() {
  try {
    console.log('🔍 Checking employees in tbl_employes...\n');

    // Get all employees
    const employes = await Employe.findAll({
      attributes: ['id', 'nom_famille', 'prenoms', 'email_personnel', 'poste', 'statut'],
      limit: 20
    });

    console.log(`📊 Total employees found: ${employes.length}\n`);

    if (employes.length > 0) {
      console.log('👥 Employees in database:');
      employes.forEach(emp => {
        console.log(`   ${emp.id}: ${emp.prenoms} ${emp.nom_famille} (${emp.email_personnel}) - ${emp.poste} - Status: ${emp.statut}`);
      });
    } else {
      console.log('❌ No employees found in tbl_employes');
    }

    // Check if employee ID 3 exists
    console.log('\n🔍 Checking if employee ID 3 exists...');
    const emp3 = await Employe.findByPk(3);
    if (emp3) {
      console.log('✅ Employee ID 3 found:');
      console.log(`   Name: ${emp3.prenoms} ${emp3.nom_famille}`);
      console.log(`   Email: ${emp3.email_personnel}`);
      console.log(`   Post: ${emp3.poste}`);
      console.log(`   Status: ${emp3.statut}`);
    } else {
      console.log('❌ Employee ID 3 not found');
    }

  } catch (error) {
    console.error('❌ Error checking employees:', error);
  } finally {
    process.exit(0);
  }
}

checkEmployes();
