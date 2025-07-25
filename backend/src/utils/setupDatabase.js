const { supabase } = require('../supabaseClient');

/**
 * Setup database tables if they don't exist
 * This function checks if the wallets table exists and logs the status
 */
async function setupDatabase() {
  try {
    console.log('Checking database tables...');

    // Check if wallets table exists by trying to query it
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);

    if (walletsError) {
      if (walletsError.code === 'PGRST116') {
        console.log('❌ Wallets table does not exist');
        console.log('📋 Please run the SQL script manually in your Supabase dashboard:');
        console.log('   1. Go to your Supabase project dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Copy and paste the contents of backend/setup-wallets-table.sql');
        console.log('   4. Execute the script');
        console.log('');
        console.log('⚠️  Wallet functionality will not work until the table is created');
      } else {
        console.error('❌ Error checking wallets table:', walletsError);
      }
    } else {
      console.log('✅ Wallets table exists');
    }

    // Check if transactions table exists
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);

    if (transactionsError) {
      if (transactionsError.code === 'PGRST116') {
        console.log('❌ Transactions table does not exist');
        console.log('📋 This will be created along with the wallets table');
      } else {
        console.error('❌ Error checking transactions table:', transactionsError);
      }
    } else {
      console.log('✅ Transactions table exists');
    }

    console.log('Database check completed');
  } catch (error) {
    console.error('Database check failed:', error);
    console.log('📋 Please run the SQL script manually in your Supabase dashboard');
  }
}

/**
 * Initialize wallet for a user if it doesn't exist
 */
async function initializeUserWallet(userId) {
  try {
    // Check if wallet exists
    const { data: existingWallet, error: checkError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Wallet doesn't exist, create one
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'PC'
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create wallet for user:', userId, createError);
        throw createError;
      }

      console.log('Created wallet for user:', userId);
      return newWallet;
    } else if (checkError) {
      console.error('Error checking wallet existence:', checkError);
      throw checkError;
    }

    return existingWallet;
  } catch (error) {
    console.error('Failed to initialize user wallet:', error);
    throw error;
  }
}

module.exports = {
  setupDatabase,
  initializeUserWallet
}; 