const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

router.get('/', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;

  try {
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', coachId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: coach, error: coachError } = await supabase
      .from('Coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      return res.status(404).json({ error: 'Coach profile not found' });
    }

    const { data: sessions, error: sessionError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coach.id)
      .in('session_status', ['pubcon', 'confirmed'])
      .order('start_time', { ascending: true })
      .limit(10);

    if (sessionError) {
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.json({
      coach: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        profilePicture: user.profile_picture,
        bio: coach.bio,
        specialties: coach.specialties,
      },
      confirmedSessions: sessions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/cancel-session', verifySupabaseToken, async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.body;
  
    try {
      const { data: session, error: sessionError } = await supabase
        .from('Sessions')
        .select('id, coach_id, start_time')
        .eq('id', sessionId)
        .single();
  
      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      const { data: coach, error: coachError } = await supabase
        .from('Coaches')
        .select('id')
        .eq('id', userId)
        .single();
  
      if (coachError || !coach || coach.id !== session.coach_id) {
        return res.status(403).json({ error: 'Not authorized to cancel this session' });
      }
  
      const now = new Date();
      const startTime = new Date(session.start_time);
      const hoursUntil = (startTime - now) / (1000 * 60 * 60);
  
      if (hoursUntil < 24) {
        return res.status(400).json({ error: 'Cannot cancel less than 24 hours before start time' });
      }
  
      const { error: cancelError } = await supabase
        .from('Sessions')
        .update({ session_status: 'cancelled' })
        .eq('id', sessionId);
  
      if (cancelError) {
        return res.status(500).json({ error: 'Failed to cancel session' });
      }
  
      const { error: updateStudentsError } = await supabase
        .from('Student_sessions')
        .update({ student_status: 'coach_cancelled' })
        .eq('session_id', sessionId);
  
      if (updateStudentsError) {
        return res.status(500).json({ error: 'Failed to update student statuses' });
      }
  
      return res.json({ message: 'Session cancelled and student statuses updated' });
  
    } catch (err) {
      console.error('Cancel session error:', err);
      return res.status(500).json({ error: err.message });
    }
});

// Debug endpoint for coach dashboard
router.get('/debug', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    console.log('🔍 DASHBOARD DEBUG: Fetching data for coach:', coachId);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', coachId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get coach info
    const { data: coach, error: coachError } = await supabase
      .from('Coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    // Get ALL sessions for this coach
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    // Get sessions with different statuses
    const { data: confirmedSessions, error: confirmedError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('session_status', 'confirmed');

    const { data: pubconSessions, error: pubconError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('session_status', 'pubcon');

    return res.json({
      coachId,
      user: user,
      coach: coach,
      allSessions: allSessions || [],
      confirmedSessions: confirmedSessions || [],
      pubconSessions: pubconSessions || [],
      summary: {
        totalSessions: allSessions?.length || 0,
        confirmedCount: confirmedSessions?.length || 0,
        pubconCount: pubconSessions?.length || 0,
        statuses: allSessions?.reduce((acc, session) => {
          acc[session.session_status] = (acc[session.session_status] || 0) + 1;
          return acc;
        }, {}) || {}
      }
    });

  } catch (err) {
    console.error('🔍 DASHBOARD DEBUG: Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;