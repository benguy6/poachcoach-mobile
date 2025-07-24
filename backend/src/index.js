const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { setupDatabase } = require('./utils/setupDatabase');

dotenv.config();

// Check required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'STRIPE_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Check if SUPABASE_KEY exists (might be the anon key)
if (!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_KEY;
  console.log('Using SUPABASE_KEY as SUPABASE_ANON_KEY');
}

// Check if we have the required Supabase variables
if (!process.env.SUPABASE_KEY) {
  console.error('SUPABASE_KEY is required. Please set it in your .env file.');
} else {
  console.log('✅ SUPABASE_KEY is set');
}

// Update missing vars after the check
const stillMissing = requiredEnvVars.filter(varName => !process.env[varName]);

if (stillMissing.length > 0) {
  console.error('Missing required environment variables:', stillMissing);
  console.log('Please check your .env file and ensure all required variables are set.');
  console.log('Available environment variables:', Object.keys(process.env));
  
  // For development, set default values
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode with default values');
    if (!process.env.STRIPE_SECRET_KEY) {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_development';
    }
  }
} else {
  console.log('✅ All required environment variables are set!');
  console.log('✅ Backend is ready to run with full functionality');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS for Expo Go
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'exp://localhost:19000',
    'exp://192.168.1.100:19000',
    'exp://172.20.10.3:19000'
  ],
  credentials: true
}));
app.use(express.json());

// Add debugging middleware to log all requests
app.use((req, res, next) => {
  console.log(`🔍 Server Debug - ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`🔍 Server Debug - Headers:`, req.headers);
  console.log(`🔍 Server Debug - Body:`, req.body);
  next();
});

const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const coachDashboardRouter = require('./routes/coach_dashboard');
const coachSessionRouter = require('./routes/coach_session');
const findCoachRouter = require('./routes/find_coach');
const studentDashboardRouter = require('./routes/student_dashboard');
const studentCalendarRouter = require('./routes/student_calendar');
const coachCalendarRouter = require('./routes/coach_calendar');
const uploadProfilePictureRouter = require('./routes/uploadProfilePicture');
const uploadQualificationsRouter = require('./routes/uploadQualifications');
const studentProfileRouter = require('./routes/student_profile');
const coachProfileRouter = require('./routes/coach_profile'); // Added coach_profile route
const notificationsRouter = require('./routes/notifications'); // Added notifications route
const coachWalletRouter = require('./routes/coach_wallet'); // Added coach_wallet route
const studentWalletRouter = require('./routes/student_wallet'); // Added student_wallet route
const coachClassManagementRouter = require('./routes/coach_class_management'); // Added coach_class_management route

app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/coach/dashboard', coachDashboardRouter);
app.use('/api/coach/session', coachSessionRouter);
app.use('/api/find-coach', findCoachRouter);
app.use('/api/student/dashboard', studentDashboardRouter);
app.use('/api/student/calendar', studentCalendarRouter);
app.use('/api/coach/calendar', coachCalendarRouter);
app.use('/api/uploadProfilePicture', uploadProfilePictureRouter);
app.use('/api/deleteProfilePicture', uploadProfilePictureRouter);
app.use('/api/uploadQualifications', uploadQualificationsRouter);
app.use('/api/student/profile', studentProfileRouter);
app.use('/api/coach/profile', coachProfileRouter); // Registered coach_profile route
app.use('/api/notifications', notificationsRouter); // Registered notifications route
app.use('/api/coach/wallet', coachWalletRouter); // Registered coach_wallet route
app.use('/api/student/wallet', studentWalletRouter); // Registered student_wallet route
app.use('/api/coach/class-management', coachClassManagementRouter); // Registered coach_class_management route

app.get('/', (_req, res) => {
  res.send('Server is running');
});

// Add error handling middleware
app.use((error, req, res, next) => {
  console.error('🔍 Server Debug - Unhandled error:', error);
  console.error('🔍 Server Debug - Error stack:', error.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Add 404 handler
app.use((req, res) => {
  console.log(`🔍 Server Debug - 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  
  // Check database tables on startup
  try {
    await setupDatabase();
    console.log('✅ Database check completed');
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.log('⚠️  Server will continue running, but wallet functionality may not work properly');
    console.log('📋 Please run the SQL script manually in your Supabase dashboard');
  }
});
