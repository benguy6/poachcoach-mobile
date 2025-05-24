const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

const hashPassword = (password) => bcrypt.hashSync(password, 10);
const checkPassword = (plain, hashed) => bcrypt.compareSync(plain, hashed);

const isStrongPassword = (password) => {
  const upper = /[A-Z]/;
  const special = /[!@#$%^&*(),.?":{}|<>]/;
  return password.length >= 6 && upper.test(password) && special.test(password);
};

const isEmailTaken = async (email) => {
  const { data } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .limit(1);

  return !!data?.length;
};

const createAuthUser = async (email, password) => {
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false 
  });

  if (error || !user?.user?.id) {
    return { data: null, error };
  }

  const { error: confirmError } = await supabase.auth.admin.sendEmailVerificationEmail(
    user.user.id,
    {
      redirectTo: 'http://localhost:3000/login'
    }
  );

  return {
    data: user,
    error: confirmError || null,
  };
};


const createAuthUserGoogle = async (email) => {
  return await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
}

router.post('/googleOauth', async (req, res) => {
  const {email: le_email, id: userID} = req.body
  
  if (!le_email || !userID  || await isEmailTaken(le_email)) {
    res.status(400).json({message: 'Email is already in use'})
    return
  }
  else {
    res.status(200).json({ message: 'Email is available' })
    return
  }
})

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



router.post('/registerCoachStep1', async (req, res) => {
  const { email, password, confirm_password } = req.body;

  console.log("Checking coach email:", email);

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


  res.status(200).json({ message: 'Email is available' });
});



router.post('/signup-coach', async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    age,
    gender,
    number,
    postal_code,
    qualifications,
    sport, 
    isGoogleSignup,
  } = req.body;

  if (!email || !first_name || !last_name || !age || !gender || !qualifications || !postal_code || !number || !sport) {
    return res.status(400).json({ error: 'Missing Required Fields' });
  }

  if (!isGoogleSignup && !password) {
    return res.status(400).json({ error: 'Missing password for email signup' });
  }

  if (await isEmailTaken(email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  let authUser, authError;

  if (isGoogleSignup) {
    ({ data: authUser, error: authError } = await createAuthUserGoogle(email));
  } else {
    ({ data: authUser, error: authError } = await createAuthUser(email, password));
  }

  if (authError || !authUser?.user?.id) {
    return res.status(400).json({ error: authError?.message || 'Auth creation failed' });
  }

  const userId = authUser.user.id;


  const userPayload = {
    id: userId,
    email,
    number,
    first_name,
    last_name,
    age: age.toString(),
    gender,
    postal_code,
    role: 'coach',
    password: isGoogleSignup ? null : await hashPassword(password),
  };

  const { error: userErr } = await supabase.from('Users').insert([userPayload]);

  if (userErr) {
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: userErr.message });
  }


  const { error: coachErr } = await supabase.from('Coaches').insert([{
    id: userId,
    qualifications,
    sport,
  }]);

  if (coachErr) {
    return res.status(500).json({ error: coachErr.message });
  }

  return res.status(201).json({ message: 'Coach registered successfully' });
});


router.post('/signup-student', async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    age,
    gender,
    number,
    postal_code,
    isGoogleSignup
  } = req.body;

  if (!email || !first_name || !last_name || !age || !gender || !number || !postal_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isGoogleSignup && !password) {
    return res.status(400).json({ error: 'Missing password for email signup' });
  }

  if (await isEmailTaken(email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  let authUser, authError;
  if (isGoogleSignup) {
    ({ data: authUser, error: authError } = await createAuthUserGoogle(email));
  } else {
    ({ data: authUser, error: authError } = await createAuthUser(email, password));
  }

  if (authError || !authUser?.user?.id) {
    return res.status(400).json({ error: authError?.message || 'Auth creation failed' });
  }

  const userId = authUser.user.id;


  const userPayload = {
    id: userId,
    email,
    first_name,
    last_name,
    age: age.toString(), 
    gender,
    number,
    postal_code,
    role: 'student',
    password: isGoogleSignup ? null : await hashPassword(password),
  };


  const { error: userErr } = await supabase.from('Users').insert([userPayload]);

  if (userErr) {
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: userErr.message });
  }


  const { error: studentErr } = await supabase.from('Students').insert([{ id: userId }]);

  if (studentErr) {
    return res.status(500).json({ error: studentErr.message });
  }

  return res.status(201).json({ message: 'Student registered successfully' });
});




router.post('/login', async (req, res) => {
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

  let x = await supabase.auth.admin.listUsers()
  let y = x.data?.users || []

  for (let i = 0; i < y.length; i++) {
    if (email===y[i].email && y[i].email_confirmed_at===null) {
      res.status(400).json({ error: 'You have not verified your email. Try to sign up again after one day' })
      return;
    }
  }


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

router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('*')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/reset-password', 
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Password reset email sent' });
})

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




