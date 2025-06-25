const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

router.get('/', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, email, profile_picture, age, gender')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: student, error: studentError } = await supabase
      .from('Students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    const { data: studentSessions, error: ssError } = await supabase
      .from('Student_sessions')
      .select('session_id')
      .eq('student_id', student.id)
      .eq('student_status', 'paid');

    if (ssError) {
      return res.status(500).json({ error: 'Failed to fetch session links' });
    }

    const sessionIds = studentSessions.map(row => row.session_id);


    let sessions = [];
    if (sessionIds.length > 0) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('Sessions')
        .select('*')
        .in('id', sessionIds)
        .order('start_time', { ascending: true });

      if (sessionError) {
        return res.status(500).json({ error: 'Failed to fetch sessions' });
      }

      sessions = sessionData;
    }

    return res.json({
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        profilePicture: user.profile_picture,
      },
      studentProfile: student,
      sessions: sessions,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.post('/cancel-session', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.body;

  try {
    const { data: student, error: studentError } = await supabase
      .from('Students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      return res.status(403).json({ error: 'Student profile not found' });
    }

    const { data: studentSession, error: ssError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, session_id')
      .eq('student_id', student.id)
      .eq('session_id', sessionId)
      .single();

    if (ssError || !studentSession) {
      return res.status(404).json({ error: 'Student is not enrolled in this session' });
    }

    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('id, start_time, session_type, students_attending')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date();
    const startTime = new Date(session.start_time);
    const hoursUntil = (startTime - now) / (1000 * 60 * 60);
    const refundEligible = JSON.stringify(hoursUntil >= 24);

    const { error: updateStudentError } = await supabase
      .from('Student_sessions')
      .update({ student_status: 'cancelled' })
      .eq('student_id', student.id)
      .eq('session_id', sessionId);

    if (updateStudentError) {
      return res.status(500).json({ error: 'Failed to cancel student session' });
    }

 
    if (session.session_type === 'single') {
      const { error: updateSessionError } = await supabase
        .from('Sessions')
        .update({ session_status: 'cancelled' })
        .eq('id', sessionId);

      if (updateSessionError) {
        return res.status(500).json({ error: 'Failed to cancel session' });
      }
    } else if (session.session_type === 'group') {
      const updatedCount = Math.max(parseInt(session.students_attending) - 1, 0).toString();

      const { error: decrementError } = await supabase
        .from('Sessions')
        .update({ students_attending: updatedCount })
        .eq('id', sessionId);

      if (decrementError) {
        return res.status(500).json({ error: 'Failed to update student count' });
      }
    }

    return res.json({
      message: 'Session cancelled successfully',
      refund: refundEligible,
    });
  } catch (err) {
    console.error('Student cancel error:', err);
    return res.status(500).json({ error: err.message });
  }
});



module.exports = router;






