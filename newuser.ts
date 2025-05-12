import CustomType from '../types/custom';
import express, { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { verifySupabaseToken } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';

const router = express.Router();

const hashPassword = (password: string): string => bcrypt.hashSync(password, 10);
const checkPassword = (plain: string, hashed: string): boolean => bcrypt.compareSync(plain, hashed);

// Password validation
const isStrongPassword = (password: string): boolean => {
  const upper = /[A-Z]/;
  const special = /[!@#$%^&*(),.?":{}|<>]/;
  return password.length >= 6 && upper.test(password) && special.test(password);
};

// Check email uniqueness
const isEmailTaken = async (email: string): Promise<boolean> => {
  const { data } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .limit(1);

  return !!data?.length;
};

// Create Supabase Auth user
const createAuthUser = async (email: string, password: string) => {
  return await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
};

// ===========================
// ✅ Step 1 Signup Routes
// ===========================

router.post('/registerStudentStep1', async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log("🔍 Checking student email:", email);

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  if (await isEmailTaken(email)) {
    res.status(400).json({ error: 'Email already in use' });
    return;
  }

  res.status(200).json({ message: 'Email is available' });
});

router.post('/registerCoachStep1', async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log("🔍 Checking coach email:", email);

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  if (await isEmailTaken(email)) {
    res.status(400).json({ error: 'Email already in use' });
    return;
  }

  res.status(200).json({ message: 'Email is available' });
});

// ===========================
// 🧑‍🏫 Coach Signup
// ===========================

router.post('/signup-coach', async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, age, gender, qualifications } = req.body;

  if (!email || !password || !first_name || !last_name || !age || !gender || !qualifications) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
    return;
  }

  if (await isEmailTaken(email)) {
    res.status(400).json({ error: 'Email already in use' });
    return;
  }

  const { data: authUser, error: authError } = await createAuthUser(email, password);
  if (authError || !authUser?.user?.id) {
    res.status(400).json({ error: authError?.message || 'Auth creation failed' });
    return;
  }

  const userId = authUser.user.id;
  const hashedPassword = hashPassword(password);

  const { error: userErr } = await supabase.from('Users').insert([{
    id: userId,
    email,
    password: hashedPassword,
    first_name,
    last_name,
    age,
    gender,
    role: 'coach',
  }]);

  if (userErr) {
    await supabase.auth.admin.deleteUser(userId);
    res.status(500).json({ error: userErr.message });
    return;
  }

  const { error: coachErr } = await supabase.from('Coaches').insert([{
    id: userId,
    qualifications,
  }]);

  if (coachErr) {
    res.status(500).json({ error: coachErr.message });
    return;
  }

  res.status(201).json({ message: 'Coach registered successfully' });
});

// ===========================
// 👩‍🎓 Student Signup
// ===========================

router.post('/signup-student', async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, age, gender, level_of_expertise } = req.body;

  if (!email || !password || !first_name || !last_name || !age || !gender || !level_of_expertise) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
    return;
  }

  if (await isEmailTaken(email)) {
    res.status(400).json({ error: 'Email already in use' });
    return;
  }

  const { data: authUser, error: authError } = await createAuthUser(email, password);
  if (authError || !authUser?.user?.id) {
    res.status(400).json({ error: authError?.message || 'Auth creation failed' });
    return;
  }

  const userId = authUser.user.id;
  const hashedPassword = hashPassword(password);

  const { error: userErr } = await supabase.from('Users').insert([{
    id: userId,
    email,
    password: hashedPassword,
    first_name,
    last_name,
    age,
    gender,
    role: 'student',
  }]);

  if (userErr) {
    await supabase.auth.admin.deleteUser(userId);
    res.status(500).json({ error: userErr.message });
    return;
  }

  const { error: studentErr } = await supabase.from('Students').insert([{
    id: userId,
    level_of_expertise,
  }]);

  if (studentErr) {
    res.status(500).json({ error: studentErr.message });
    return;
  }

  res.status(201).json({ message: 'Student registered successfully' });
});

// ===========================
// 🔐 Login
// ===========================

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const { data: users, error } = await supabase
    .from('Users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (error || !users || users.length === 0) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  const user = users[0];
  const valid = checkPassword(password, user.password);
  if (!valid) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  });
});

// ===========================
// 🔒 Protected route
// ===========================

router.get('/me', verifySupabaseToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ error: 'User ID missing from request' });
    return;
  }

  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { data: coach } = await supabase
    .from('Coaches')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  const { data: student } = await supabase
    .from('Students')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  let role = 'unknown';
  if (coach) role = 'coach';
  else if (student) role = 'student';

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    role,
  });
});

export default router;

