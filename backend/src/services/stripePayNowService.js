// Check if STRIPE_SECRET_KEY is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

class StripePayNowService {
  constructor() {
    this.stripe = stripe;
  }

  // Generate PayNow reference number
  generateReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PN${timestamp}${random}`;
  }

  // Process PayNow transfer using Stripe
  async processTransfer(amount, recipientPhone, reference) {
    try {
      // Check if we're in development mode or if Stripe key is not set
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('Running in development mode - returning mock response');
        return {
          success: true,
          reference: reference,
          status: 'pending',
          transferId: `pi_${Date.now()}`,
          estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'PayNow transfer initiated successfully (test mode)'
        };
      }

      // For PayNow transfers, we'll use Stripe's payment intent with PayNow
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'sgd',
        payment_method_types: ['paynow'],
        metadata: {
          reference: reference,
          recipient_phone: recipientPhone,
          type: 'withdrawal'
        },
        description: `PayNow Transfer - ${reference}`,
        // For PayNow, we need to specify the payment method
        payment_method_data: {
          type: 'paynow',
          paynow: {
            type: 'sg_qr'
          }
        }
      });

      // For PayNow, we need to confirm the payment immediately
      const confirmedPayment = await this.stripe.paymentIntents.confirm(
        paymentIntent.id,
        {
          payment_method: paymentIntent.payment_method,
          return_url: 'https://your-app.com/payment-success'
        }
      );

      return {
        success: true,
        reference: reference,
        status: confirmedPayment.status,
        transferId: confirmedPayment.id,
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: 'PayNow transfer initiated successfully'
      };

    } catch (error) {
      console.error('Stripe PayNow transfer error:', error);
      
      // For development/testing, return a mock response
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          reference: reference,
          status: 'pending',
          transferId: `pi_${Date.now()}`,
          estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'PayNow transfer initiated successfully (test mode)'
        };
      }
      
      throw new Error('Failed to process PayNow transfer');
    }
  }

  // Check transfer status
  async checkTransferStatus(reference) {
    try {
      // Search for payment intents with this reference
      const paymentIntents = await this.stripe.paymentIntents.search({
        query: `metadata['reference']:'${reference}'`
      });

      if (paymentIntents.data.length === 0) {
        throw new Error('Transfer not found');
      }

      const paymentIntent = paymentIntents.data[0];
      
      return {
        reference: reference,
        status: paymentIntent.status,
        lastUpdated: new Date(paymentIntent.updated * 1000).toISOString()
      };

    } catch (error) {
      console.error('Stripe status check error:', error);
      
      // For development/testing, return a mock response
      if (process.env.NODE_ENV === 'development') {
        const statuses = ['pending', 'processing', 'succeeded', 'failed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          reference: reference,
          status: randomStatus,
          lastUpdated: new Date().toISOString()
        };
      }
      
      throw new Error('Failed to check transfer status');
    }
  }

  // Validate phone number format for PayNow
  validatePhoneNumber(phoneNumber) {
    // Singapore phone number validation
    const sgPhoneRegex = /^(\+65|65)?[689]\d{7}$/;
    return sgPhoneRegex.test(phoneNumber);
  }

  // Format phone number for PayNow
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with 65, replace with +65
    if (cleaned.startsWith('65')) {
      cleaned = '+' + cleaned;
    }
    
    // If it doesn't start with +, add +65
    if (!cleaned.startsWith('+')) {
      cleaned = '+65' + cleaned;
    }
    
    return cleaned;
  }

  // Get transfer history
  async getTransferHistory(phoneNumber, limit = 10, offset = 0) {
    try {
      // Search for payment intents for this phone number
      const paymentIntents = await this.stripe.paymentIntents.search({
        query: `metadata['recipient_phone']:'${phoneNumber}'`,
        limit: limit
      });

      const transfers = paymentIntents.data.map(intent => ({
        id: intent.id,
        reference: intent.metadata.reference,
        amount: intent.amount / 100, // Convert from cents
        status: intent.status,
        recipientPhone: intent.metadata.recipient_phone,
        createdAt: new Date(intent.created * 1000).toISOString(),
        completedAt: intent.status === 'succeeded' ? new Date(intent.updated * 1000).toISOString() : null
      }));

      return {
        transfers: transfers.slice(offset, offset + limit),
        total: transfers.length,
        limit,
        offset
      };

    } catch (error) {
      console.error('Stripe history error:', error);
      
      // For development/testing, return mock data
      if (process.env.NODE_ENV === 'development') {
        const mockTransfers = [
          {
            id: 'pi_123456789',
            reference: 'PN123456789',
            amount: 200,
            status: 'succeeded',
            recipientPhone: phoneNumber,
            createdAt: '2025-06-15T14:30:00Z',
            completedAt: '2025-06-16T10:15:00Z'
          },
          {
            id: 'pi_987654321',
            reference: 'PN987654321',
            amount: 150,
            status: 'pending',
            recipientPhone: phoneNumber,
            createdAt: '2025-06-18T09:00:00Z'
          }
        ];

        return {
          transfers: mockTransfers.slice(offset, offset + limit),
          total: mockTransfers.length,
          limit,
          offset
        };
      }
      
      throw new Error('Failed to get transfer history');
    }
  }
}

module.exports = new StripePayNowService(); 