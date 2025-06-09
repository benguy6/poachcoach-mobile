const express = require('express');
const bcrypt = require('bcryptjs'); 
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;  
  const upper = /[A-Z]/;
  const special = /[!@#$%^&*(),.?":{}|<>]/;
  return password.length >= 6 && upper.test(password) && special.test(password);
};

const isEmailTaken = async (email) => {
  const { data, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Auth check failed:', authError.message);
    return false; 
  }

  const existsInAuth = data?.users?.some(user => user.email === email);
  if (existsInAuth) return true;

  
  const { data: users } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .limit(1);

  return !!users?.length;
};


/*const createAuthUserGoogle = async (email) => {
  return await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
} */

/*router.post('/googleOauth', async (req, res) => {
  const {email: le_email, id: userID} = req.body
  
  if (!le_email || !userID  || await isEmailTaken(le_email)) {
    res.status(400).json({message: 'Email is already in use'})
    return
  }
  else {
    res.status(200).json({ message: 'Email is available' })
    return
  }
})*/

router.post('/registerCoachStep1', async (req, res) => {
  const { email, password, confirm_password } = req.body;

  console.log("Checking coach email:", email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (await isEmailTaken(email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
  }

  if (confirm_password !== password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  return res.status(200).json({ message: 'Coach email and password are valid' });
});


router.post('/registerStudentStep1', async (req, res) => {
  const { email, password, confirm_password } = req.body;

  console.log("Checking student email:", email);

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  if (await isEmailTaken(email)) {
    res.status(400).json({ error: 'Email already in use' });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
    return;
  }

  if (confirm_password !== password){
    res.status(400).json({ error: 'passwords do not match' });
    return;
  }



  res.status(200).json({ message: 'Email is available, Password is valid' });
});


router.post('/signup-coach', async (req, res) => {
  const {
    id,
    email,
    first_name,
    last_name,
    age,
    gender,
    number,
    postal_code,
    qualifications, 
    sport,
  } = req.body;

  if (
    !id ||
    !email ||
    !first_name ||
    !last_name ||
    !age ||
    !gender ||
    !number ||
    !postal_code ||
    !sport
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { error: userErr } = await supabase.from('Users').insert([
    {
      id,
      email,
      first_name,
      last_name,
      age: age.toString(),
      gender,
      number,
      postal_code,
      role: 'coach',
    },
  ]);

  if (userErr) {
    console.error('Error inserting into Users:', userErr.message);
    return res.status(500).json({ error: userErr.message });
  }

  const coachPayload = {
    id,
    sport,
    qualifications,
  };

  const { error: coachErr } = await supabase.from('Coaches').insert([coachPayload]);

  if (coachErr) {
    console.error('Error inserting into Coaches:', coachErr.message);
    return res.status(500).json({ error: coachErr.message });
  }

  return res.status(201).json({ message: 'Coach registered successfully' });
});




router.post('/signup-student', async (req, res) => {
  const {
    id,
    email,
    first_name,
    last_name,
    age,
    gender,
    number,
    postal_code,
  } = req.body;

  if (!id || !email || !first_name || !last_name || !age || !gender || !number || !postal_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { error: userErr } = await supabase.from('Users').insert([{
    id,
    email,
    first_name,
    last_name,
    age: age.toString(),
    gender,
    number,
    postal_code,
    role: 'student',
  }]);

  if (userErr) {
    return res.status(500).json({ error: userErr.message });
  }

  const { error: studentErr } = await supabase.from('Students').insert([{ id }]);
  if (studentErr) {
    return res.status(500).json({ error: studentErr.message });
  }

  return res.status(201).json({ message: 'Student metadata stored successfully' });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { user, session } = authData;

  if (!user.email_confirmed_at) {
    return res.status(400).json({
      error: 'You have not verified your email. Please verify it before logging in.',
    });
  }

  

  return res.status(200).json({
    message: 'Login successful',
    session,
  });
});




router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found.' });
  }


  return res.status(200).json({ message: 'Password reset email sent.' });
});




router.post('/reset-password', verifySupabaseToken, async (req, res) => {
  const { new_password, confirm_password } = req.body;

  if (!isStrongPassword(new_password)) {
    return res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
  }

  if (confirm_password !== new_password){
    res.status(400).json({ error: 'passwords do not match' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(new_password, 10);

  const { error } = await supabase
    .from('Users')
    .update({ password: hashedPassword })
    .eq('id', req.user.id); 

  if (error) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  return res.status(200).json({ message: 'Password updated successfully' });
});


router.get('/me', verifySupabaseToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID missing from request' });
  }

  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
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

  return res.json({
    id: user.id,
    first_name: user.first_name,
    email: user.email,
    role,
  });
});

module.exports = router;
