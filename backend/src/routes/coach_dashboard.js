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
      .in('session_status', ['pubcon', 'confirmed', 'published'])
      .order('start_time', { ascending: true })
      .limit(10);

    if (sessionError) {
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    console.log('🔍 Coach Dashboard Debug:');
    console.log('Coach ID:', coach.id);
    console.log('Sessions fetched:', sessions?.length || 0);
    console.log('Session statuses:', sessions?.map(s => ({ id: s.session_id, status: s.session_status, date: s.date, time: s.start_time })) || []);

    // Filter out sessions that ended more than 15 minutes ago
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);
    
    // For each session, fetch students
    const filteredSessionsWithStudents = await Promise.all(sessions.filter(session => {
      // If session is today, check if it ended more than 15 minutes ago
      if (session.date === currentDate) {
        const sessionEndTime = session.end_time;
        const [currentHour, currentMin] = currentTime.split(':').map(Number);
        const [sessionEndHour, sessionEndMin] = sessionEndTime.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMin;
        const sessionEndTotalMinutes = sessionEndHour * 60 + sessionEndMin;
        const minutesAfterEnd = currentTotalMinutes - sessionEndTotalMinutes;
        // If session ended more than 15 minutes ago, exclude it
        return minutesAfterEnd <= 15;
      }
      // Keep future sessions
      return session.date > currentDate;
    }).map(async (session) => {
      // Get all student enrollments for this specific session using unique_id
      const { data: studentSessions, error: studentSessionsError } = await supabase
        .from('Student_sessions')
        .select('student_id, student_status')
        .eq('session_id', session.session_id);

      if (studentSessionsError || !studentSessions || studentSessions.length === 0) {
        return { ...session, students: [] };
      }

      // Get student details from Users table
      const studentIds = studentSessions.map(ss => ss.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('Users')
        .select('id, first_name, last_name, email, profile_picture, gender')
        .in('id', studentIds);

      if (studentsError || !students) {
        return { ...session, students: [] };
      }

      // Combine student details with payment status
      const studentsWithDetails = students.map(student => {
        const studentSession = studentSessions.find(ss => ss.student_id === student.id);
        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim(),
          email: student.email,
          profilePicture: student.profile_picture,
          gender: student.gender,
          paymentStatus: studentSession ? studentSession.student_status : 'unpaid',
        };
      });
      return { ...session, students: studentsWithDetails };
    }));

    console.log('🔍 Coach Dashboard Filtered Sessions:');
    console.log('Sessions after filtering:', filteredSessionsWithStudents?.length || 0);
    console.log('Filtered session details:', filteredSessionsWithStudents?.map(s => ({ id: s.session_id, status: s.session_status, date: s.date, time: s.start_time, students: s.students?.length })) || []);

    return res.json({
      coach: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        profilePicture: user.profile_picture,
        bio: coach.bio,
        specialties: coach.specialties,
      },
      confirmedSessions: filteredSessionsWithStudents,
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
      const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format in local timezone
      
      // Parse session date and time
      const sessionDate = session.date;
      const sessionStartTime = session.start_time;
      
      // Calculate time difference in hours
      let hoursUntil = 0;
      if (sessionDate > currentDate) {
        // Future date, calculate hours until session
        const [hour1, min1] = currentTime.split(':').map(Number);
        const [hour2, min2] = sessionStartTime.split(':').map(Number);
        const currentMinutes = hour1 * 60 + min1;
        const sessionMinutes = hour2 * 60 + min2;
        hoursUntil = (sessionMinutes - currentMinutes) / 60;
      } else if (sessionDate === currentDate) {
        // Same date, calculate time difference
        const [hour1, min1] = currentTime.split(':').map(Number);
        const [hour2, min2] = sessionStartTime.split(':').map(Number);
        const currentMinutes = hour1 * 60 + min1;
        const sessionMinutes = hour2 * 60 + min2;
        hoursUntil = (sessionMinutes - currentMinutes) / 60;
      } else {
        // Past date
        hoursUntil = -1;
      }
  
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