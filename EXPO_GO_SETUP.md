# 🚀 Expo Go Setup Guide

## 📱 Running with Expo Go

### **Step 1: Install Dependencies**
```bash
cd frontend
npm install
```

### **Step 2: Start Backend Server**
```bash
cd backend
npm install
npm start
```

### **Step 3: Start Expo Go**
```bash
cd frontend
npm run expo-go
```

### **Step 4: Scan QR Code**
- Open **Expo Go** app on your phone
- Scan the QR code from terminal
- App will load on your device

## 🔧 Configuration

### **Backend URL**
- Default: `http://localhost:3000`
- If using different IP: Update `app.config.js` and `config.js`

### **Environment Variables**
The app uses these settings for Expo Go:
- `NODE_ENV=development`
- `MOCK_RESPONSES=true`
- `DEBUG_MODE=true`

### **Network Configuration**
Make sure your phone and computer are on the same network.

## 📋 Troubleshooting

### **Connection Issues**
1. Check if backend is running on `localhost:3000`
2. Ensure phone and computer are on same network
3. Try using your computer's IP address instead of localhost

### **Expo Go Issues**
1. Clear Expo Go cache
2. Restart Expo Go app
3. Try `npm run expo-go-dev` for development mode

### **Backend Issues**
1. Check if all environment variables are set
2. Ensure Supabase connection is working
3. Verify CORS settings in backend

## 🎯 Features Available in Expo Go

✅ **Wallet System** - Poach Coins with conversion  
✅ **Mock Payments** - Test mode for Stripe  
✅ **Coach/Student Profiles** - Full profile management  
✅ **Session Management** - Create and manage sessions  
✅ **Chat System** - Stream Chat integration  
✅ **Notifications** - Real-time notifications  

## 🔄 Development Workflow

1. **Make changes** to code
2. **Save files** - Expo Go will reload automatically
3. **Test features** on device
4. **Check console** for any errors

## 📱 Testing on Device

- **Wallet Top-up**: Test with mock payments
- **Coach Withdrawals**: Test PayNow integration
- **Session Booking**: Full booking flow
- **Profile Updates**: Upload and edit profiles
- **Chat**: Test messaging between users

## 🚨 Important Notes

- **Mock Mode**: All payments are simulated
- **Development**: Uses test data and mock responses
- **Network**: Requires stable internet connection
- **Backend**: Must be running for full functionality 