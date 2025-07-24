// Stripe Payment Service for Wallet Top-ups
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

class StripePaymentService {
  constructor() {
    this.stripe = stripe;
  }

  // Create a payment intent for wallet top-up
  async createPaymentIntent(amount, currency = 'sgd', metadata = {}) {
    try {
      // Check if we're in development mode or if Stripe key is not set
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('Running in development mode - creating mock payment intent');
        return {
          id: `pi_mock_${Date.now()}`,
          client_secret: 'pi_mock_secret',
          status: 'requires_payment_method',
          amount: Math.round(amount * 100),
          currency: currency,
          metadata: metadata
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        payment_method_types: ['card', 'paynow'],
        metadata: {
          ...metadata,
          type: 'wallet_topup'
        },
        description: `Wallet Top-up - ${amount} ${currency.toUpperCase()}`
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // Confirm a payment intent
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('Running in development mode - confirming mock payment');
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 1000, // Mock amount
          currency: 'sgd'
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
          return_url: 'https://your-app.com/payment-success'
        }
      );

      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  // Retrieve a payment intent
  async retrievePaymentIntent(paymentIntentId) {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('Running in development mode - retrieving mock payment');
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 1000,
          currency: 'sgd',
          metadata: { type: 'wallet_topup' }
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  // Create a payment method
  async createPaymentMethod(type, card = null) {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('Running in development mode - creating mock payment method');
        return {
          id: `pm_mock_${Date.now()}`,
          type: type,
          card: card || { brand: 'visa', last4: '4242' }
        };
      }

      const paymentMethod = await this.stripe.paymentMethods.create({
        type: type,
        card: card
      });

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error('Failed to create payment method');
    }
  }

  // Process a complete payment (create + confirm)
  async processPayment(amount, currency = 'sgd', paymentMethodId, metadata = {}) {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(amount, currency, metadata);
      
      // Confirm payment intent
      const confirmedPayment = await this.confirmPaymentIntent(paymentIntent.id, paymentMethodId);
      
      return {
        success: confirmedPayment.status === 'succeeded',
        paymentIntent: confirmedPayment,
        amount: confirmedPayment.amount / 100, // Convert back from cents
        currency: confirmedPayment.currency
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

module.exports = new StripePaymentService(); 