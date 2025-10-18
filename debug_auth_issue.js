const User = require('./server/models/User');
const bcrypt = require('bcryptjs');

async function debugAuthIssue() {
  try {
    console.log('🔍 Debugging authentication issue...\n');

    // Test emails from the logs
    const testEmails = ['eli@gmail.com', 'test.user2@beatrice.com'];
    
    for (const email of testEmails) {
      console.log(`\n📧 Checking user: ${email}`);
      
      // Find user by email
      const user = await User.findOne({ 
        where: { email },
        attributes: { exclude: [] } // Include password for verification
      });

      if (!user) {
        console.log('❌ User not found in database');
        continue;
      }

      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.prenom} ${user.nom}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.actif}`);
      console.log(`   Password hash: ${user.mot_de_passe ? 'Present' : 'Missing'}`);
      console.log(`   Password length: ${user.mot_de_passe ? user.mot_de_passe.length : 0}`);

      // Test password verification
      const testPasswords = ['password123', '123456', 'test123', 'password', 'admin123'];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await user.checkPassword(testPassword);
          console.log(`   Testing password "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
          if (isValid) {
            console.log(`   🎉 Found working password: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`   Error testing password "${testPassword}": ${error.message}`);
        }
      }
    }

    // Check if there are any users in the database
    console.log('\n📊 Database user count:');
    const userCount = await User.count();
    console.log(`   Total users: ${userCount}`);

    if (userCount > 0) {
      console.log('\n👥 All users in database:');
      const allUsers = await User.findAll({
        attributes: ['id', 'email', 'nom', 'prenom', 'role', 'actif'],
        limit: 10
      });
      
      allUsers.forEach(user => {
        console.log(`   ${user.id}: ${user.email} (${user.prenom} ${user.nom}) - ${user.role} - Active: ${user.actif}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    process.exit(0);
  }
}

debugAuthIssue();
