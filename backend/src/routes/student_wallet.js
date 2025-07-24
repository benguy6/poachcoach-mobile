const express = require('express');
const router = express.Router();
const { verifySupabaseToken } = require('../middleware/authMiddleware');
const paynowService = require('../services/stripePayNowService');
const stripePaymentService = require('../services/stripePaymentService');
const { supabase } = require('../supabaseClient');
// Check if STRIPE_SECRET_KEY is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

// Get student wallet balance and basic info
router.get('/', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;

  try {
    console.log('=== WALLET BALANCE DEBUG ===');
    console.log('Student ID:', studentId);

    // Fetch wallet data from database
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      
      // If wallet doesn't exist, create one
      if (walletError.code === 'PGRST116') {
        console.log('Wallet not found, creating new wallet for student:', studentId);
        
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: studentId,
            balance: 0,
            currency: 'PC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          return res.status(500).json({ error: 'Failed to create wallet' });
        }

        console.log('New wallet created:', newWallet);
        return res.json({
          balance: parseFloat(newWallet.balance),
          currency: newWallet.currency || 'PC',
          lastUpdated: newWallet.updated_at,
          studentId: studentId,
          debug: {
            walletId: newWallet.id,
            balanceType: typeof newWallet.balance,
            parsedBalance: parseFloat(newWallet.balance)
          }
        });
      }
      
      return res.status(500).json({ error: 'Failed to fetch wallet information' });
    }

    if (!wallet) {
      // This shouldn't happen with the above fix, but keeping as fallback
      return res.status(404).json({ error: 'Wallet not found' });
    }

    console.log('Wallet found:', wallet);
    console.log('Balance:', wallet.balance, 'Type:', typeof wallet.balance);
    console.log('Parsed balance:', parseFloat(wallet.balance));

    res.json({
      balance: parseFloat(wallet.balance),
      currency: wallet.currency || 'PC',
      lastUpdated: wallet.updated_at,
      studentId: studentId,
      debug: {
        walletId: wallet.id,
        balanceType: typeof wallet.balance,
        parsedBalance: parseFloat(wallet.balance),
        rawBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet information' });
  }
});

// Debug route to check wallet balance (for testing)
router.get('/debug', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;

  try {
    console.log('=== DEBUG WALLET ROUTE ===');
    console.log('Student ID:', studentId);

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      return res.status(404).json({ error: 'Wallet not found', details: walletError });
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        balanceType: typeof wallet.balance,
        parsedBalance: parseFloat(wallet.balance),
        currency: wallet.currency,
        createdAt: wallet.created_at,
        updatedAt: wallet.updated_at
      },
      recentTransactions: transactions || [],
      debug: {
        studentId: studentId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: 'Debug route failed', details: error.message });
  }
});

// Process wallet top-up with Stripe
router.post('/topup', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;
  const { amount, paymentMethodId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount' });
  }

  if (!paymentMethodId) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  try {
    console.log('Processing wallet top-up for student:', studentId, 'Amount:', amount);

    // Get wallet ID
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', studentId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Process payment using Stripe service
    const paymentResult = await stripePaymentService.processPayment(
      amount, 
      'sgd', 
      paymentMethodId, 
      { student_id: studentId, type: 'wallet_topup' }
    );

    if (!paymentResult.success) {
      return res.status(400).json({ 
        error: 'Payment failed', 
        status: paymentResult.paymentIntent.status 
      });
    }

    // Convert SGD to PC: 1 SGD = 5 PC
    const pcAmount = amount * 5;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: studentId,
        type: 'deposit',
        amount: pcAmount, // Store PC amount in database
        description: `Wallet Top-up (${amount} SGD → ${pcAmount} PC)`,
        status: 'completed',
        transfer_id: paymentResult.paymentIntent.id
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction record' });
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: parseFloat(wallet.balance || 0) + pcAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet balance' });
    }

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: transaction.status,
        transferId: transaction.transfer_id,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      },
      conversion: {
        sgdAmount: amount,
        pcAmount: pcAmount,
        rate: '1 SGD = 5 PC'
      },
      paymentIntentId: paymentResult.paymentIntent.id
    });

  } catch (error) {
    console.error('Error processing top-up:', error);
    res.status(500).json({ error: 'Failed to process top-up' });
  }
});

// Process student withdrawal via PayNow
router.post('/withdraw', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  try {
    console.log('=== WITHDRAWAL DEBUG ===');
    console.log('Student ID:', studentId);
    console.log('Requested amount:', amount);
    console.log('Amount type:', typeof amount);

    // Get student profile to get phone number
    const { data: userProfile, error: profileError } = await supabase
      .from('Users')
      .select('number')
      .eq('id', studentId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const phoneNumber = userProfile.number;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number not registered for PayNow transfers' });
    }

    // Validate phone number format for PayNow
    if (!paynowService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format for PayNow transfers' });
    }

    // Format phone number for PayNow
    const formattedPhone = paynowService.formatPhoneNumber(phoneNumber);

    // Get wallet to check balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', studentId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    console.log('Wallet found:', wallet);
    console.log('Current balance:', wallet.balance);
    console.log('Balance type:', typeof wallet.balance);
    console.log('Requested amount:', amount);
    console.log('Amount type:', typeof amount);

    // Convert both to numbers for comparison
    const currentBalance = parseFloat(wallet.balance || 0);
    const withdrawalAmount = parseFloat(amount);

    console.log('Parsed current balance:', currentBalance);
    console.log('Parsed withdrawal amount:', withdrawalAmount);
    console.log('Is sufficient?', currentBalance >= withdrawalAmount);

    // Check if balance is sufficient
    if (currentBalance < withdrawalAmount) {
      console.log('INSUFFICIENT BALANCE - Current:', currentBalance, 'Requested:', withdrawalAmount);
      return res.status(400).json({ 
        error: 'Insufficient balance for withdrawal',
        debug: {
          currentBalance: currentBalance,
          requestedAmount: withdrawalAmount,
          difference: currentBalance - withdrawalAmount
        }
      });
    }

    console.log('Balance sufficient, proceeding with withdrawal...');

    // Generate PayNow reference
    const paynowReference = paynowService.generateReference();
    
    // Process PayNow transfer
    const paynowResponse = await paynowService.processTransfer(withdrawalAmount, formattedPhone, paynowReference);

    // Convert PC to SGD: 5 PC = 1 SGD
    const sgdAmount = withdrawalAmount / 5;

    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: studentId,
        type: 'withdrawal',
        amount: -withdrawalAmount, // Negative amount for withdrawal
        description: `PayNow Withdrawal (${withdrawalAmount} PC → ${sgdAmount} SGD)`,
        status: 'pending',
        paynow_reference: paynowReference
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating withdrawal transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction record' });
    }

    // Update wallet balance
    const newBalance = currentBalance - withdrawalAmount;
    console.log('Updating balance from', currentBalance, 'to', newBalance);

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet balance' });
    }

    console.log('Withdrawal completed successfully');

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: transaction.status,
        paynowReference: transaction.paynow_reference,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      },
      paynowReference: paynowReference,
      conversion: {
        pcAmount: withdrawalAmount,
        sgdAmount: sgdAmount,
        rate: '5 PC = 1 SGD'
      },
      debug: {
        previousBalance: currentBalance,
        newBalance: newBalance,
        withdrawalAmount: withdrawalAmount
      }
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get student transactions
router.get('/transactions', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Fetch transactions from database
    const { data: transactions, error: transactionsError, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    // Transform transactions to match frontend expectations
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      description: tx.description,
      status: tx.status,
      transferId: tx.transfer_id,
      sessionId: tx.session_id,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at
    }));

    res.json({
      transactions: formattedTransactions,
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create payment intent for top-up (for frontend Stripe integration)
router.post('/create-payment-intent', verifySupabaseToken, async (req, res) => {
  const { amount } = req.body;
  const studentId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const paymentIntent = await stripePaymentService.createPaymentIntent(
      amount, 
      'sgd', 
      { student_id: studentId, type: 'wallet_topup' }
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

module.exports = router; 