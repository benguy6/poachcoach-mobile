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

    const { data: favouriteActivities, error: faError } = await supabase
      .from('Favourite_activities')
      .select('activity')
      .eq('student_id', userId);

    if (faError) {
      return res.status(500).json({ error: 'Failed to fetch favourite activities' });
    }

    // Fetch completed sessions
    const { data: completedSessions, error: csError } = await supabase
      .from('Student_sessions')
      .select('session_id')
      .eq('student_id', userId)
      .eq('student_status', 'attended');

    if (csError) {
      return res.status(500).json({ error: 'Failed to fetch completed sessions' });
    }

    const completedSessionIds = completedSessions.map(row => row.session_id);

    let sessions = [];
    if (completedSessionIds.length > 0) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('Sessions')
        .select('id, start_time, end_time, topic, coach_id')
        .in('id', completedSessionIds)
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
      studentProfile: {
        favouriteActivities: favouriteActivities.map(fa => fa.activity),
      },
      sessions: sessions.map(session => ({
        id: session.id,
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
    console.error('Error fetching student profile:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;