const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

router.get('/', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('=== STUDENT DASHBOARD REQUEST ===');
    console.log('User ID:', userId);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, email, profile_picture, age, gender')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User fetched:', user);

    // Get student sessions (both paid and unpaid) with dates
    const { data: studentSessions, error: ssError } = await supabase
      .from('Student_sessions')
      .select('id, session_id, student_status, date')
      .eq('student_id', userId)
      .in('student_status', ['paid', 'unpaid']);

    if (ssError) {
      console.error('Student sessions fetch error:', ssError);
      return res.status(500).json({ error: 'Failed to fetch session links' });
    }

    console.log('Student sessions fetched:', studentSessions);

    let sessions = [];
    if (studentSessions && studentSessions.length > 0) {
      const sessionIds = studentSessions.map(ss => ss.session_id);
      const sessionDates = studentSessions.map(ss => ss.date);

      // Get session details using session_id (not id) and matching dates
      const { data: sessionData, error: sessionError } = await supabase
        .from('Sessions')
        .select('*')
        .in('session_id', sessionIds)
        .in('date', sessionDates)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionError) {
        console.error('Sessions fetch error:', sessionError);
        return res.status(500).json({ error: 'Failed to fetch sessions' });
      }

      console.log('Session data fetched:', sessionData);

      // Get unique coach IDs
      const coachIds = [...new Set(sessionData.map(session => session.coach_id))];
      
      // Fetch coach information
      const { data: coaches, error: coachesError } = await supabase
        .from('Users')
        .select('id, first_name, last_name, profile_picture')
        .in('id', coachIds);

      if (coachesError) {
        console.error('Coaches fetch error:', coachesError);
        return res.status(500).json({ error: 'Failed to fetch coach info' });
      }

      console.log('Coaches fetched:', coaches);

      // Transform sessions with student status and coach info
      sessions = studentSessions.map(studentSession => {
        const session = sessionData.find(s => 
          s.session_id === studentSession.session_id && 
          s.date === studentSession.date
        );
        
        if (!session) return null;

        const coach = coaches.find(c => c.id === session.coach_id);
        
        return {
          id: session.session_id,
          session_id: session.session_id,
          session_name: session.sport || 'Training Session',
          coach_name: coach ? `${coach.first_name} ${coach.last_name}`.trim() : 'Coach',
          coach_profile: coach?.profile_picture || null,
          start_time: `${session.date}T${session.start_time}:00`, // Full datetime format
          end_time: `${session.date}T${session.end_time}:00`, // Full datetime format
          date: session.date,
          day: session.day,
          location: session.address || 'TBD',
          students_attending: session.students_attending || '1',
          student_status: studentSession.student_status,
          session_type: session.session_type,
          class_type: session.class_type,
          price: session.price_per_session || session.price_per_hour,
          description: session.description
        };
      }).filter(session => session !== null)
        .sort((a, b) => {
          // Sort by date first, then by start time
          if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
          }
          return a.start_time.localeCompare(b.start_time);
        })
        .slice(0, 3); // Get only the 3 most recent

      console.log('Transformed sessions:', sessions);
    }

    const response = {
      user: {
        id: user.id,
        name: user.first_name, // This should now show the actual first name
        email: user.email,
        profilePicture: user.profile_picture,
        firstName: user.first_name,
        lastName: user.last_name,
        age: user.age,
        gender: user.gender
      },
      sessions: sessions,
    };

    console.log('Final dashboard response:', response);
    return res.json(response);

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /student/dashboard/cancel-session - Cancel both single and group class sessions
router.post('/cancel-session', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId, sessionDate } = req.body;

  try {
    console.log('=== STUDENT CANCELLATION REQUEST ===');
    console.log('User ID:', userId);
    console.log('Session ID:', sessionId);
    console.log('Session Date:', sessionDate);

    // Step 1: Find the specific student session
    const { data: studentSession, error: ssError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, session_id, student_status, date')
      .eq('student_id', userId)
      .eq('session_id', sessionId)
      .eq('date', sessionDate)
      .single();

    if (ssError || !studentSession) {
      console.error('Student session query error:', ssError);
      return res.status(404).json({ error: 'Student is not enrolled in this session' });
    }

    console.log('Found student session:', studentSession);

    // Step 2: Get session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('Sessions')
      .select('session_id, start_time, end_time, date, class_type, session_type, session_status, price_per_session, students_attending, available_slots, max_students')
      .eq('session_id', sessionId)
      .eq('date', sessionDate)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session query error:', sessionError);
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Found session:', sessionData);

    // Step 3: Calculate time until session starts for refund logic
    const now = new Date();
    const sessionDateTime = new Date(`${sessionData.date}T${sessionData.start_time}`);
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('Hours until session:', hoursUntilSession);
    console.log('Student status:', studentSession.student_status);

    // Step 4: Determine refund eligibility (same for all class types)
    const isRefundable = hoursUntilSession >= 12;
    const hasPaid = studentSession.student_status === 'paid';
    const refundAmount = (isRefundable && hasPaid) ? sessionData.price_per_session : 0;

    console.log('Refund calculation:', {
      isRefundable,
      hasPaid,
      refundAmount
    });

    // Step 5: Update Student_sessions table - set status to 'student_cancelled'
    const { error: updateStudentError } = await supabase
      .from('Student_sessions')
      .update({ student_status: 'student_cancelled' })
      .eq('id', studentSession.id);

    if (updateStudentError) {
      console.error('Error updating student session:', updateStudentError);
      return res.status(500).json({ error: 'Failed to cancel student session' });
    }

    console.log('Updated student session status to student_cancelled');

    // Step 6: Handle different class types
    if (sessionData.class_type === 'single') {
      // SINGLE CLASS LOGIC
      console.log('Processing single class cancellation');
      
      // For single classes, just set session_status to 'cancelled'
      const { error: updateSessionError } = await supabase
        .from('Sessions')
        .update({ session_status: 'cancelled' })
        .eq('session_id', sessionId)
        .eq('date', sessionDate);

      if (updateSessionError) {
        console.error('Error updating session status:', updateSessionError);
        return res.status(500).json({ error: 'Failed to update session status' });
      }

      console.log('Updated single session status to "cancelled"');

    } else if (sessionData.class_type === 'group') {
      // GROUP CLASS LOGIC
      console.log('Processing group class cancellation');
      
      // Calculate new attendance numbers - ensure we're working with numbers
      const currentStudentsAttending = parseInt(sessionData.students_attending) || 1;
      const currentAvailableSlots = parseInt(sessionData.available_slots) || 0;
      
      const newStudentsAttending = Math.max(0, currentStudentsAttending - 1);
      const newAvailableSlots = currentAvailableSlots + 1; // Simple increment by 1
      
      console.log('Attendance update:', {
        oldStudentsAttending: currentStudentsAttending,
        newStudentsAttending,
        oldAvailableSlots: currentAvailableSlots,
        newAvailableSlots
      });

      if (sessionData.session_type === 'single') {
        // GROUP SINGLE SESSION
        console.log('Processing group single session');
        
        // Determine new session status
        let newSessionStatus;
        if (newStudentsAttending === 0) {
          newSessionStatus = 'published';
        } else {
          newSessionStatus = 'pubcon';
        }

        // Update the specific session
        const { error: updateSessionError } = await supabase
          .from('Sessions')
          .update({ 
            students_attending: newStudentsAttending,
            available_slots: newAvailableSlots,
            session_status: newSessionStatus
          })
          .eq('session_id', sessionId)
          .eq('date', sessionDate);

        if (updateSessionError) {
          console.error('Error updating group single session:', updateSessionError);
          return res.status(500).json({ error: 'Failed to update session' });
        }

        console.log(`Updated group single session: students_attending=${newStudentsAttending}, available_slots=${newAvailableSlots}, status=${newSessionStatus}`);

      } else if (sessionData.session_type === 'recurring') {
        // GROUP RECURRING SESSION - Same logic as single session groups
        console.log('Processing group recurring session - simplified logic');
        
        // Determine new session status
        let newSessionStatus;
        if (newStudentsAttending === 0) {
          newSessionStatus = 'published';
        } else {
          newSessionStatus = 'pubcon';
        }

        // Update the specific session only
        const { error: updateSessionError } = await supabase
          .from('Sessions')
          .update({ 
            students_attending: newStudentsAttending,
            available_slots: newAvailableSlots,
            session_status: newSessionStatus
          })
          .eq('session_id', sessionId)
          .eq('date', sessionDate);

        if (updateSessionError) {
          console.error('Error updating group recurring session:', updateSessionError);
          return res.status(500).json({ error: 'Failed to update session' });
        }

        console.log(`Updated group recurring session: students_attending=${newStudentsAttending}, available_slots=${newAvailableSlots}, status=${newSessionStatus}`);
      }
    }

    // Step 7: Return response with cancellation details
    const response = {
      success: true,
      message: `${sessionData.class_type} class session cancelled successfully`,
      cancellationDetails: {
        sessionId: sessionId,
        sessionDate: sessionData.date,
        classType: sessionData.class_type,
        sessionType: sessionData.session_type,
        studentStatus: 'student_cancelled',
        refundEligible: isRefundable,
        hasPaid: hasPaid,
        refundAmount: refundAmount,
        hoursBeforeSession: hoursUntilSession.toFixed(1)
      }
    };

    console.log('Cancellation response:', response);
    return res.json(response);

  } catch (err) {
    console.error('Student cancel error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;