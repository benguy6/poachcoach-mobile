const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const getGeoFromPostalCode = async (postalCode) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},Singapore&key=${GOOGLE_MAPS_API_KEY}`;
  console.log(`Sending request to Google Maps API: ${url}`);
  try {
    const response = await axios.get(url);
    console.log('Raw response:', response.data);
    const results = response.data.results;
    if (results.length > 0) {
      const formattedAddress = results[0].formatted_address;
      const latitude = results[0].geometry.location.lat;
      const longitude = results[0].geometry.location.lng;
      return { address: formattedAddress, latitude, longitude };
    } else {
      console.warn(`Postal code ${postalCode} not found.`);
      return { address: 'Address not found', latitude: null, longitude: null };
    }
  } catch (error) {
    console.error('Error fetching address from Google Maps API:', error.message);
    return { address: 'Address not found', latitude: null, longitude: null };
  }
};

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
  console.log('🔍 Coach Signup Debug - Request body:', req.body);
  
  const {
    id,
    email,
    first_name,
    last_name,
    age,
    gender,
    number,
    postal_code,
    sport,
  } = req.body;

  console.log('🔍 Coach Signup Debug - Extracted fields:', {
    id, email, first_name, last_name, age, gender, number, postal_code, sport
  });

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
    console.log('❌ Coach Signup Debug - Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('🔍 Coach Signup Debug - Starting geolocation...');
    let address, latitude, longitude;
    try {
      const geoData = await getGeoFromPostalCode(postal_code.toString()); // Ensure postal_code is treated as a string
      address = geoData.address;
      latitude = geoData.latitude;
      longitude = geoData.longitude;

      if (!latitude || !longitude) {
        latitude = 1.290270; // Default latitude for Singapore
        longitude = 103.851959; // Default longitude for Singapore
      }
    } catch (geoError) {
      console.log('Geolocation failed, using default address:', geoError.message);
      address = 'Address not found';
      latitude = 1.290270;
      longitude = 103.851959;
    }

    console.log('🔍 Coach Signup Debug - About to insert into Users table with data:', {
      id, email, first_name, last_name, age: age.toString(), gender, number, postal_code, address, 
      latitude: latitude.toString(), longitude: longitude.toString(), role: 'coach'
    });

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
        address, // Store the converted address
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        role: 'coach',
      },
    ]);

    if (userErr) {
      console.error('❌ Coach Signup Debug - Error inserting into Users:', userErr);
      console.error('❌ Coach Signup Debug - Full error details:', JSON.stringify(userErr, null, 2));
      return res.status(500).json({ error: `Database error saving new user: ${userErr.message}` });
    }

    console.log('✅ Coach Signup Debug - Successfully inserted into Users table');

    const coachPayload = {
      id,
      sport,
    };

    console.log('🔍 Coach Signup Debug - About to insert into Coaches table with data:', coachPayload);
    
    const { error: coachErr } = await supabase.from('Coaches').insert([coachPayload]);

    if (coachErr) {
      console.error('❌ Coach Signup Debug - Error inserting into Coaches:', coachErr);
      console.error('❌ Coach Signup Debug - Full error details:', JSON.stringify(coachErr, null, 2));
      return res.status(500).json({ error: `Database error saving coach data: ${coachErr.message}` });
    }

    console.log('✅ Coach Signup Debug - Successfully inserted into Coaches table');
    
    // Check if wallet was created automatically
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', id)
      .single();
      
    if (walletError) {
      console.log('⚠️ Coach Signup Debug - Wallet not found, this might be the issue:', walletError);
    } else {
      console.log('✅ Coach Signup Debug - Wallet created successfully:', wallet);
    }

    return res.status(201).json({ message: 'Coach registered successfully' });
  } catch (err) {
    console.error('❌ Coach Signup Debug - Unexpected error:', err);
    console.error('❌ Coach Signup Debug - Full error stack:', err.stack);
    return res.status(500).json({ error: `Database error saving new user: ${err.message}` });
  }
});





router.post('/signup-student', async (req, res) => {
  console.log('🔍 Student Signup Debug - Request body:', req.body);
  
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

  console.log('🔍 Student Signup Debug - Extracted fields:', {
    id, email, first_name, last_name, age, gender, number, postal_code
  });

  if (!id || !email || !first_name || !last_name || !age || !gender || !number || !postal_code) {
    console.log('❌ Student Signup Debug - Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('🔍 Student Signup Debug - Starting geolocation...');
    let address, latitude, longitude;
    try {
      const geoData = await getGeoFromPostalCode(postal_code); // Ensure postal_code is treated as a string
      address = geoData.address;
      latitude = geoData.latitude;
      longitude = geoData.longitude;

      if (!latitude || !longitude) {
        latitude = 1.290270; // Default latitude for Singapore
        longitude = 103.851959; // Default longitude for Singapore
      }
    } catch (geoError) {
      console.log('Geolocation failed, using default address:', geoError.message);
      address = 'Address not found';
      latitude = 1.290270;
      longitude = 103.851959;
    }

    console.log('🔍 Student Signup Debug - About to insert into Users table with data:', {
      id, email, first_name, last_name, age: age.toString(), gender, number, postal_code, address, 
      latitude: latitude.toString(), longitude: longitude.toString(), role: 'student'
    });

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
        address, // Store the converted address
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        role: 'student',
      },
    ]);

    if (userErr) {
      console.error('❌ Student Signup Debug - Error inserting into Users:', userErr);
      console.error('❌ Student Signup Debug - Full error details:', JSON.stringify(userErr, null, 2));
      return res.status(500).json({ error: `Database error saving new user: ${userErr.message}` });
    }

    console.log('✅ Student Signup Debug - Successfully inserted into Users table');
    console.log('🔍 Student Signup Debug - About to insert into Students table with data:', { id });

    const { error: studentErr } = await supabase.from('Students').insert([{ id }]);
    if (studentErr) {
      console.error('❌ Student Signup Debug - Error inserting into Students:', studentErr);
      console.error('❌ Student Signup Debug - Full error details:', JSON.stringify(studentErr, null, 2));
      return res.status(500).json({ error: `Database error saving student data: ${studentErr.message}` });
    }

    console.log('✅ Student Signup Debug - Successfully inserted into Students table');
    
    // Check if wallet was created automatically
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', id)
      .single();
      
    if (walletError) {
      console.log('⚠️ Student Signup Debug - Wallet not found, this might be the issue:', walletError);
    } else {
      console.log('✅ Student Signup Debug - Wallet created successfully:', wallet);
    }

    return res.status(201).json({ message: 'Student metadata stored successfully' });
  } catch (err) {
    console.error('❌ Student Signup Debug - Unexpected error:', err);
    console.error('❌ Student Signup Debug - Full error stack:', err.stack);
    return res.status(500).json({ error: `Database error saving new user: ${err.message}` });
  }
});


// /api/user/login (backend)

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


  const { data: coachData, error: coachError } = await supabase
    .from("Coaches")
    .select("id, has_uploaded_qualifications")
    .eq("id", user.id)
    .maybeSingle(); 
  return res.status(200).json({
    message: 'Login successful',
    session,
    coach: coachData ?? null,
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
    .single();

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