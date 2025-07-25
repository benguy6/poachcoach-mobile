export default {
  expo: {
    name: "PoachCoach",
    slug: "poachcoach-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Environment variables for Expo Go
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_51RoKYWHRBSjb7zrUHDXtC3gnQFYbEpL0yQY9iRK0T0mXK7Du7vle06FgTWpnTUT0iCc1OZVXAqXBVhBVT0Qs1dts00BgEy0Dxd",
      backendUrl: process.env.BACKEND_URL || "http://172.20.10.3:3000",
      nodeEnv: process.env.NODE_ENV || "development",
      enableStripe: true,
      enablePayNow: true,
      mockResponses: true,
      debugMode: true
    },
    plugins: [
      // Add any required plugins for Expo Go
    ]
  }
}; 