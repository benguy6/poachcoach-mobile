const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

// Create a new session
router.post('/create', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const {
    sport,
    session_type,
    startTime,
    endTime,
    recurringDays,
    monthlyDates,
    price,
    description,
    minAge,
    maxAge,
    groupType,
    maxStudents,
    postal_code,
    location_name,
    repeatCount,
    // ...add any other fields you collect from the frontend
  } = req.body;

  // Basic validation
  if (!sport || !session_type || !startTime || !endTime || !price || !postal_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Prepare session data for insertion
  const sessionData = {
    coach_id: coachId,
    sport,
    session_type,
    start_time: startTime,
    end_time: endTime,
    days_of_week: session_type === 'recurring' && recurringDays ? recurringDays.join(',') : null,
    days_of_month: session_type === 'recurring' && monthlyDates ? monthlyDates.join(',') : null,
    price_per_session: price,
    description,
    age_range_start: minAge ? String(minAge) : null,
    age_range_end: maxAge ? String(maxAge) : null,
    max_students: groupType === 'group' ? maxStudents : '1',
    postal_code,
    location_name,
    frequency: session_type === 'recurring' ? (recurringDays ? 'weekly' : 'monthly') : 'single',
    duration: `${startTime} - ${endTime}`,
    repeat_count: repeatCount ? String(repeatCount) : null,
    class_type: groupType,
    session_status: 'confirmed',
    created_at: new Date().toISOString(),
    // Add more fields as needed
  };

  // Insert into Sessions table
  const { data, error } = await supabase
    .from('Sessions')
    .insert([sessionData])
    .select();

  if (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }

  return res.status(201).json({ message: 'Session created successfully', session: data[0] });
});

module.exports = router;
