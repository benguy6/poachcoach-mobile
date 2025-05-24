const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const userRouter = require('./routes/user');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use('/api/user', userRouter);


app.get('/', (_req, res) => {
  res.send('✅ Server is running');
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});


