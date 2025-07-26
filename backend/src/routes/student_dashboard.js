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

    // Debug: Check all student sessions for this user (without status filter)
    const { data: allStudentSessions, error: allSSError } = await supabase
      .from('Student_sessions')
      .select('id, session_id, student_status, date')
      .eq('student_id', userId);

    console.log('All student sessions for user:', allStudentSessions);
          console.log('Number of all student sessions:', allStudentSessions?.length || 0);
      
      // Debug: Check session_id values
      if (allStudentSessions && allStudentSessions.length > 0) {
        const sessionIds = [...new Set(allStudentSessions.map(ss => ss.session_id))];
        console.log('Session IDs from Student_sessions:', sessionIds);
      }

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
    console.log('Number of student sessions found:', studentSessions?.length || 0);

    let sessions = [];
    if (studentSessions && studentSessions.length > 0) {
      const sessionIds = studentSessions.map(ss => ss.session_id);
      const sessionDates = studentSessions.map(ss => ss.date);

      // Get session details using session_id (not id) - remove date filter to see all sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('Sessions')
        .select('*')
        .in('session_id', sessionIds)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Filter out sessions that ended more than 15 minutes ago
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-CA');
      const currentTime = now.toTimeString().slice(0, 5);
      
      const filteredSessionData = sessionData.filter(session => {
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
      });

      if (sessionError) {
        console.error('Sessions fetch error:', sessionError);
        return res.status(500).json({ error: 'Failed to fetch sessions' });
      }

      console.log('Session data fetched:', sessionData);
      console.log('Number of sessions found:', sessionData?.length || 0);
      console.log('Filtered sessions found:', filteredSessionData?.length || 0);
      console.log('Session IDs being searched:', sessionIds);
      console.log('Session dates being searched:', sessionDates);
      
      // Debug: Show all found sessions
      if (sessionData && sessionData.length > 0) {
        console.log('All found sessions:');
        sessionData.forEach((session, index) => {
          console.log(`Session ${index + 1}:`, {
            session_id: session.session_id,
            date: session.date,
            start_time: session.start_time,
            end_time: session.end_time,
            sport: session.sport
          });
        });
      }
      
      // Debug: Check session statuses
      if (filteredSessionData && filteredSessionData.length > 0) {
        const statuses = [...new Set(filteredSessionData.map(s => s.session_status))];
        console.log('Session statuses found:', statuses);
        const dates = [...new Set(filteredSessionData.map(s => s.date))];
        console.log('Session dates found:', dates);
      }

      // Get unique coach IDs
      const coachIds = [...new Set(filteredSessionData.map(session => session.coach_id))];
      
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
        const session = filteredSessionData.find(s => 
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

    // Debug: Check all student sessions for this user
    const { data: allStudentSessions, error: allSSError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, session_id, student_status, date')
      .eq('student_id', userId);

    console.log('All student sessions for user:', allStudentSessions);
    console.log('Student sessions with matching session_id:', allStudentSessions?.filter(ss => ss.session_id === sessionId));

    // Step 1: Find the specific student session (remove date filter to debug)
    const { data: studentSession, error: ssError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, session_id, student_status, date')
      .eq('student_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (ssError || !studentSession) {
      console.error('Student session query error:', ssError);
      return res.status(404).json({ error: 'Student is not enrolled in this session' });
    }

    console.log('Found student session:', studentSession);

    // Step 2: Get session details (remove date filter to debug)
    const { data: sessionData, error: sessionError } = await supabase
      .from('Sessions')
      .select('session_id, start_time, end_time, date, class_type, session_type, session_status, price_per_session, students_attending, available_slots, max_students')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session query error:', sessionError);
      
      // Debug: Check what sessions exist with this session_id
      const { data: allSessionsWithId, error: allSessionsError } = await supabase
        .from('Sessions')
        .select('session_id, date, start_time, end_time')
        .eq('session_id', sessionId);
      
      console.log('All sessions with this session_id:', allSessionsWithId);
      
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

// Update session status endpoint
router.post('/update-session-status', verifySupabaseToken, async (req, res) => {
  const studentId = req.user.id;
  const { sessionId, status } = req.body;

  try {
    console.log('=== UPDATE SESSION STATUS ===');
    console.log('Student ID:', studentId);
    console.log('Session ID:', sessionId);
    console.log('New Status:', status);

    // Verify the student is enrolled in this session
    const { data: studentSession, error: studentSessionError } = await supabase
      .from('Student_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('session_id', sessionId)
      .single();

    if (studentSessionError || !studentSession) {
      console.error('Student session not found:', studentSessionError);
      return res.status(404).json({ error: 'Session not found or student not enrolled' });
    }

    // Update the session status
    const { error: updateError } = await supabase
      .from('Sessions')
      .update({ session_status: status })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return res.status(500).json({ error: 'Failed to update session status' });
    }

    console.log('Session status updated successfully to:', status);
    return res.json({ 
      success: true, 
      message: 'Session status updated successfully',
      sessionId: sessionId,
      newStatus: status
    });

  } catch (error) {
    console.error('Update session status error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /student/attendance-status - Get student's attendance status for active class
router.post('/attendance-status', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId, studentId } = req.body;

  try {
    console.log('=== STUDENT ATTENDANCE STATUS REQUEST ===');
    console.log('User ID:', userId);
    console.log('Session ID:', sessionId);
    console.log('Student ID:', studentId);

    // Get student session record
    const { data: studentSession, error: ssError } = await supabase
      .from('Student_sessions')
      .select('student_status')
      .eq('id', sessionId) // Using sessionId as Student_sessions.id
      .eq('student_id', studentId)
      .single();

    if (ssError || !studentSession) {
      console.error('Student session not found:', ssError);
      return res.status(404).json({ error: 'Student session not found' });
    }

    let status = 'pending';
    let lateMinutes = 0;

    // Determine status based on student_status
    switch (studentSession.student_status) {
      case 'attended':
        status = 'present';
        break;
      case 'absent':
        status = 'absent';
        break;
      case 'late':
        status = 'late';
        // Calculate late minutes (this would need to be stored or calculated)
        lateMinutes = 5; // Default for now
        break;
      default:
        status = 'pending';
    }

    console.log('Student attendance status:', { status, lateMinutes });

    res.json({
      success: true,
      status,
      lateMinutes
    });

  } catch (error) {
    console.error('Error checking attendance status:', error);
    res.status(500).json({ error: 'Failed to check attendance status' });
  }
});

// POST /student/active-class-students - Get students for active class
router.post('/active-class-students', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.body;

  try {
    console.log('=== ACTIVE CLASS STUDENTS REQUEST ===');
    console.log('User ID:', userId);
    console.log('Session ID:', sessionId);

    // Get all students for this session
    const { data: studentSessions, error: ssError } = await supabase
      .from('Student_sessions')
      .select('student_id, student_status')
      .eq('id', sessionId); // Using sessionId as Student_sessions.id

    if (ssError) {
      console.error('Error fetching student sessions:', ssError);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }

    if (!studentSessions || studentSessions.length === 0) {
      return res.json({ success: true, students: [] });
    }

    // Get student details
    const studentIds = studentSessions.map(ss => ss.student_id);
    const { data: students, error: studentsError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, email, profile_picture, gender')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }

    // Combine student data with payment status
    const studentsWithPayment = students.map(student => {
      const studentSession = studentSessions.find(ss => ss.student_id === student.id);
      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        profilePicture: student.profile_picture,
        gender: student.gender,
        paymentStatus: studentSession?.student_status === 'paid' ? 'paid' : 'unpaid'
      };
    });

    console.log('Students for active class:', studentsWithPayment.length);

    res.json({
      success: true,
      students: studentsWithPayment
    });

  } catch (error) {
    console.error('Error fetching active class students:', error);
    res.status(500).json({ error: 'Failed to fetch active class students' });
  }
});

// POST /student/submit-feedback - Submit student feedback
router.post('/submit-feedback', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;
  const { sessionId, coachRating, classRating, feedback } = req.body;

  try {
    console.log('=== STUDENT FEEDBACK SUBMISSION ===');
    console.log('User ID:', userId);
    console.log('Session ID:', sessionId);
    console.log('Coach Rating:', coachRating);
    console.log('Class Rating:', classRating);

    // Store feedback in database (you'll need to create a feedback table)
    const { error: feedbackError } = await supabase
      .from('Student_Feedback')
      .insert({
        student_id: userId,
        session_id: sessionId,
        coach_rating: coachRating,
        class_rating: classRating,
        feedback_text: feedback,
        created_at: new Date().toISOString()
      });

    if (feedbackError) {
      console.error('Error storing feedback:', feedbackError);
      return res.status(500).json({ error: 'Failed to store feedback' });
    }

    console.log('Feedback submitted successfully');

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;