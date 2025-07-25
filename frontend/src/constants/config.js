import Constants from 'expo-constants';

// Get environment variables from Expo
const extra = Constants.expoConfig?.extra || {};

export const CONFIG = {
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: extra.stripePublishableKey || "pk_test_51RoKYWHRBSjb7zrUHDXtC3gnQFYbEpL0yQY9iRK0T0mXK7Du7vle06FgTWpnTUT0iCc1OZVXAqXBVhBVT0Qs1dts00BgEy0Dxd",
  
  // Backend Configuration
  BACKEND_URL: extra.backendUrl || "http://192.168.88.13:3000",
  
  // Environment
  NODE_ENV: extra.nodeEnv || "development",
  
  // Feature Flags
  ENABLE_STRIPE: extra.enableStripe !== false,
  ENABLE_PAYNOW: extra.enablePayNow !== false,
  
  // Development Settings
  MOCK_RESPONSES: extra.mockResponses !== false,
  DEBUG_MODE: extra.debugMode !== false
};

export default CONFIG; 