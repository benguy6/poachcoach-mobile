# Stripe Integration Setup Guide

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Database Tables**: Ensure the wallet tables are created using the SQL script

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Development Mode (for testing without real payments)
NODE_ENV=development
```

## Getting Stripe Keys

1. **Log into your Stripe Dashboard**
2. **Go to Developers → API Keys**
3. **Copy your Secret Key and Publishable Key**
4. **Use test keys for development, live keys for production**

## Testing the Integration

### Development Mode (Recommended for Testing)
- Set `NODE_ENV=development` in your `.env` file
- The system will use mock payments for testing
- No real charges will be made

### Production Mode
- Set `NODE_ENV=production` and use live Stripe keys
- Real payments will be processed

## Frontend Integration

For the frontend, you'll need to:

1. **Install Stripe React Native SDK**:
   ```bash
   npm install @stripe/stripe-react-native
   ```

2. **Initialize Stripe in your app**:
   ```javascript
   import { StripeProvider } from '@stripe/stripe-react-native';
   
   export default function App() {
     return (
       <StripeProvider publishableKey="pk_test_your_key_here">
         {/* Your app components */}
       </StripeProvider>
     );
   }
   ```

3. **Create payment methods and confirm payments**

## Current Implementation

The wallet system now supports:

- ✅ **Mock Payments** (development mode)
- ✅ **Real Stripe Payments** (production mode)
- ✅ **PayNow Integration** (for withdrawals)
- ✅ **Automatic Balance Updates**
- ✅ **Transaction History**

## Testing Payment Methods

### Test Card Numbers (Stripe Test Mode)
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

### Test Expiry Dates
- Any future date (e.g., 12/25)
- Any 3-digit CVC

## Security Notes

- Never expose your `STRIPE_SECRET_KEY` in frontend code
- Always use environment variables for sensitive keys
- Use test keys for development and testing
- Implement proper error handling for failed payments

## Next Steps

1. **Run the SQL script** to create database tables
2. **Set up environment variables** with your Stripe keys
3. **Test the integration** in development mode
4. **Implement frontend Stripe components** for payment UI
5. **Deploy with live keys** for production use 