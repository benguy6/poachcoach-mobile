const express = require('express');
const router = express.Router();
const { verifySupabaseToken } = require('../middleware/authMiddleware');
const paynowService = require('../services/stripePayNowService');
const { supabase } = require('../supabaseClient');

// Get coach wallet balance and basic info
router.get('/', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;

  try {
    // Fetch wallet data from database
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', coachId)
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      
      // If wallet doesn't exist, create one
      if (walletError.code === 'PGRST116') {
        console.log('Wallet not found, creating new wallet for coach:', coachId);
        
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: coachId,
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

        return res.json({
          balance: parseFloat(newWallet.balance),
          currency: newWallet.currency || 'PC',
          lastUpdated: newWallet.updated_at,
          coachId: coachId
        });
      }
      
      return res.status(500).json({ error: 'Failed to fetch wallet information' });
    }

    if (!wallet) {
      // This shouldn't happen with the above fix, but keeping as fallback
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      balance: parseFloat(wallet.balance),
      currency: wallet.currency || 'PC',
      lastUpdated: wallet.updated_at,
      coachId: coachId
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet information' });
  }
});

// Process PayNow withdrawal
router.post('/withdraw', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  try {
    // Get coach profile to get phone number
    const { data: userProfile, error: profileError } = await supabase
      .from('Users')
      .select('number')
      .eq('id', coachId)
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

    // In a real implementation, you would:
    // 1. Check if balance is sufficient
    // 2. Integrate with PayNow API
    // 3. Update wallet balance
    // 4. Create transaction record
    // 5. Send confirmation

    // Generate PayNow reference
    const paynowReference = paynowService.generateReference();
    
    // Process PayNow transfer
    const paynowResponse = await paynowService.processTransfer(amount, formattedPhone, paynowReference);

    // Get wallet ID
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', coachId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Convert PC to SGD: 5 PC = 1 SGD
    const sgdAmount = amount / 5;

    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: coachId,
        type: 'withdrawal',
        amount: amount, // Store PC amount (positive value, type indicates withdrawal)
        description: `PayNow Transfer (${amount} PC → ${sgdAmount} SGD)`,
        status: paynowResponse.status,
        paynow_reference: paynowReference,
        transfer_id: paynowResponse.transferId,
        recipient_phone: formattedPhone
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction record' });
    }

    res.json({
      success: true,
      message: paynowResponse.message,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: transaction.status,
        paynowReference: transaction.paynow_reference,
        transferId: transaction.transfer_id,
        recipientPhone: transaction.recipient_phone,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      },
      conversion: {
        pcAmount: amount,
        sgdAmount: sgdAmount,
        rate: '5 PC = 1 SGD'
      },
      paynowReference: paynowReference,
      estimatedCompletion: paynowResponse.estimatedCompletion,
      transferId: paynowResponse.transferId
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get coach transactions
router.get('/transactions', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Fetch transactions from database
    const { data: transactions, error: transactionsError, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', coachId)
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
      paynowReference: tx.paynow_reference,
      transferId: tx.transfer_id,
      recipientPhone: tx.recipient_phone,
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

// Get transaction details
router.get('/transactions/:transactionId', verifySupabaseToken, async (req, res) => {
  const { transactionId } = req.params;
  const coachId = req.user.id;

  try {
    // Fetch transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', coachId)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      id: transaction.id,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      status: transaction.status,
      paynowReference: transaction.paynow_reference,
      transferId: transaction.transfer_id,
      recipientPhone: transaction.recipient_phone,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    });

  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// Check PayNow transfer status
router.get('/transfer-status/:reference', verifySupabaseToken, async (req, res) => {
  const { reference } = req.params;

  try {
    const statusResponse = await paynowService.checkTransferStatus(reference);
    
    res.json({
      success: true,
      status: statusResponse.status,
      reference: statusResponse.reference,
      lastUpdated: statusResponse.lastUpdated
    });

  } catch (error) {
    console.error('Error checking transfer status:', error);
    res.status(500).json({ error: 'Failed to check transfer status' });
  }
});

module.exports = router; 