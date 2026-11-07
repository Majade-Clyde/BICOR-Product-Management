const readline = require('readline');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { supabase } = require('../config/supabase');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function setupAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'Adminclyde';
  const adminEmail = process.env.ADMIN_EMAIL;

  console.log('========================================================');
  console.log('🔐 Product Inventory System - Admin Account Setup');
  console.log('========================================================');
  console.log(`👤 Configured Username: ${adminUsername}`);
  console.log(`📧 Configured Email:    ${adminEmail || 'NOT SET'}`);
  console.log('--------------------------------------------------------');

  if (!adminEmail || adminEmail.includes('@example.com')) {
    console.warn('⚠️  Note: Please update ADMIN_EMAIL in server/.env with your real email if you prefer.');
  }

  // Get password from command line args or prompt interactively
  const argPassword = process.argv[2];

  if (argPassword) {
    await applyPassword(adminUsername, adminEmail, argPassword);
    rl.close();
    return;
  }

  rl.question('Enter desired password for administrator Adminclyde (min 6 characters): ', async (password) => {
    rl.close();
    if (!password || password.trim().length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long.');
      process.exit(1);
    }
    await applyPassword(adminUsername, adminEmail, password.trim());
  });
}

async function applyPassword(adminUsername, adminEmail, password) {
  try {
    console.log(`\nConnecting to Supabase Auth for: ${adminEmail}...`);

    // Check if user already exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingUser = (listData?.users || []).find(
      (u) => (u.email || '').toLowerCase() === adminEmail.toLowerCase()
    );

    if (existingUser) {
      console.log(`Found existing user with email "${adminEmail}". Updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password,
        email_confirm: true,
      });

      if (updateError) throw updateError;
      console.log('✅ Password successfully updated!');
    } else {
      console.log(`Creating new confirmed admin user in Supabase Auth...`);
      const { error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
      });

      if (createError) throw createError;
      console.log('✅ Administrator account successfully created in Supabase Auth!');
    }

    console.log('========================================================');
    console.log('🎉 YOU CAN NOW LOG IN WITH:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: (the password you just set)`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Failed to setup admin account:', err.message || err);
  }
}

setupAdmin();

