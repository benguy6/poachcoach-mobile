import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import userRouter from './routes/user';
import sessionRouter from './routes/sessions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/user', userRouter);
app.use('/api/sessions', sessionRouter);

// Health check
app.get('/', (_req, res) => {
  res.send('✅ Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
