const User = require('./server/models/User');

async function testAuthWithExistingUser() {
  try {
    console.log('🔍 Testing authentication with existing users...\n');

    // Test with an existing user
    const testEmail = 'admin@beatrice.com';
    console.log(`📧 Testing with user: ${testEmail}`);
    
    // Find user by email
    const user = await User.findOne({ 
      where: { email: testEmail },
      attributes: { exclude: [] } // Include password for verification
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.prenom} ${user.nom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.actif}`);
    console.log(`   Password hash: ${user.mot_de_passe ? 'Present' : 'Missing'}`);

    // Test password verification with common passwords
    const testPasswords = ['password123', '123456', 'test123', 'password', 'admin123', 'beatrice123', 'admin'];
    
    console.log('\n🔐 Testing password verification:');
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

    // Test the actual login flow
    console.log('\n🚀 Testing actual login flow:');
    const testPassword = 'password123'; // Try with a common password
    
    try {
      const isPasswordValid = await user.checkPassword(testPassword);
      if (isPasswordValid) {
        console.log(`✅ Password verification successful with "${testPassword}"`);
        
        // Update last login
        user.derniere_connexion = new Date();
        await user.save();
        console.log('✅ Last login updated');
        
        console.log('\n🎉 Login flow would succeed!');
      } else {
        console.log(`❌ Password verification failed with "${testPassword}"`);
      }
    } catch (error) {
      console.log(`❌ Error during password verification: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    process.exit(0);
  }
}

testAuthWithExistingUser();
