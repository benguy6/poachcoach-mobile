const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

router.get('/', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, email, number, profile_picture, age, gender, goals, address, date_joined')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch coach details
    const { data: coach, error: coachError } = await supabase
      .from('Coaches')
      .select('sport')
      .eq('id', userId)
      .single();

    if (coachError || !coach) {
      return res.status(404).json({ error: 'Coach profile not found' });
    }

    // Fetch completed sessions
    const { data: completedSessions, error: csError } = await supabase
      .from('Sessions')
      .select('unique_id')
      .eq('coach_id', userId)
      .eq('session_status', 'completed');

    if (csError) {
      return res.status(500).json({ error: 'Failed to fetch completed sessions' });
    }

    const completedSessionIds = completedSessions.map(row => row.unique_id);

    let sessions = [];
    if (completedSessionIds.length > 0) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('Sessions')
        .select('unique_id, start_time, end_time, topic, coach_id')
        .in('unique_id', completedSessionIds)
        .order('start_time', { ascending: true });

      if (sessionError) {
        return res.status(500).json({ error: 'Failed to fetch session details' });
      }

      sessions = sessionData;
    }

    // Fetch achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('Achievements')
      .select('id, achievement')
      .eq('id', userId);

    if (achievementsError) {
      return res.status(500).json({ error: 'Failed to fetch achievements' });
    }

    // Fetch ratings for the coach
    const { data: ratings, error: ratingsError } = await supabase
      .from('Rating')
      .select('rating')
      .eq('coach_id', userId);

    if (ratingsError) {
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }

    // Calculate average rating
    let averageRating = 5.0; // Default rating
    if (ratings && ratings.length > 0) {
      const totalRatings = ratings.reduce((sum, row) => sum + parseFloat(row.rating), 0);
      averageRating = totalRatings / ratings.length;
    }

    // Construct the response object
    const responseObject = {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        profilePicture: user.profile_picture,
        age: user.age,
        gender: user.gender,
        number: user.number,
        goals: user.goals || 'No goals set',
        address: user.address || 'Address not provided',
        dateJoined: user.date_joined || 'Date not available',
      },
      coach: {
        sport: coach.sport,
        averageRating: averageRating.toFixed(1), // Include average rating in the response
      },
      sessions: sessions.map(session => ({
        id: session.unique_id,
        startTime: session.start_time,
        endTime: session.end_time,
        topic: session.topic,
        coachId: session.coach_id,
      })),
      achievements: achievements.map(achievement => ({
        id: achievement.id,
        achievement: achievement.achievement,
      })),
    };

    console.log('Response Object:', responseObject); // Log the response object

    return res.json(responseObject);

  } catch (err) {
    console.error('Error fetching coach profile:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;