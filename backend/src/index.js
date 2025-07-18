const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const coachDashboardRouter = require('./routes/coach_dashboard');
const coachSessionRouter = require('./routes/coach_session');
const findCoachRouter = require('./routes/find_coach');
const studentDashboardRouter = require('./routes/student_dashboard');
const uploadProfilePictureRouter = require('./routes/uploadProfilePicture');

app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/coach/dashboard', coachDashboardRouter);
app.use('/api/coach/session', coachSessionRouter);
app.use('/api/find-coach', findCoachRouter);
app.use('/api/student/dashboard', studentDashboardRouter);
app.use('/api/upload-profile-picture', uploadProfilePictureRouter);

app.get('/', (_req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});