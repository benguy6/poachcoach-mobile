const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

// Get active class for coach (class that's currently happening)
router.get('/active-class', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;

  try {
    console.log('=== GET ACTIVE CLASS ===');
    console.log('Coach ID:', coachId);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format in local timezone
    const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone

    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);

    // Find sessions that are currently happening (within start and end time)
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('Sessions')
      .select(`
        unique_id,
        session_id,
        sport,
        date,
        start_time,
        end_time,
        address,
        postal_code,
        class_type,
        price_per_session,
        description,
        session_status,
        max_students,
        duration
      `)
      .eq('coach_id', coachId)
      .eq('date', currentDate)
      .gte('start_time', currentTime)
      .lte('end_time', currentTime)
      .in('session_status', ['confirmed', 'in_progress'])
      .order('start_time', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching active sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to fetch active sessions' });
    }

    console.log('Active sessions found:', activeSessions?.length || 0);

    if (!activeSessions || activeSessions.length === 0) {
      return res.json({ activeClass: null });
    }

    // Get the first active session (most likely to be the current one)
    const activeSession = activeSessions[0];

    // Get students enrolled in this session
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('student_id, student_status')
      .eq('id', activeSession.unique_id)
      .in('student_status', ['paid', 'unpaid']);

    if (studentSessionsError) {
      console.error('Error fetching student sessions:', studentSessionsError);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }

    // Get student details
    let students = [];
    if (studentSessions && studentSessions.length > 0) {
      const studentIds = studentSessions.map(ss => ss.student_id);
      const { data: studentDetails, error: studentsError } = await supabase
        .from('Users')
        .select('id, first_name, last_name, email, profile_picture, gender')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching student details:', studentsError);
        return res.status(500).json({ error: 'Failed to fetch student details' });
      }

      students = studentDetails.map(student => {
        const studentSession = studentSessions.find(ss => ss.student_id === student.id);
        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim(),
          email: student.email,
          profilePicture: student.profile_picture,
          gender: student.gender,
          paymentStatus: studentSession ? studentSession.student_status : 'unpaid'
        };
      });
    }

    const activeClass = {
      id: activeSession.unique_id,
      sessionId: activeSession.session_id,
      sport: activeSession.sport,
      date: activeSession.date,
      startTime: activeSession.start_time,
      endTime: activeSession.end_time,
      duration: activeSession.duration,
      location: activeSession.address,
      postalCode: activeSession.postal_code,
      classType: activeSession.class_type,
      pricePerSession: activeSession.price_per_session,
      description: activeSession.description,
      sessionStatus: activeSession.session_status,
      maxStudents: activeSession.max_students,
      studentsAttending: students.length,
      students: students
    };

    console.log('Active class data:', activeClass);

    res.json({ activeClass });

  } catch (error) {
    console.error('Error in active class endpoint:', error);
    res.status(500).json({ error: 'Failed to get active class' });
  }
});

// Start a class (update session status to 'in_progress')
router.post('/start-class', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { uniqueId } = req.body;

  if (!uniqueId) {
    return res.status(400).json({ error: 'Unique ID is required' });
  }

  try {
    console.log('=== START CLASS ===');
    console.log('Coach ID:', coachId);
    console.log('Unique ID:', uniqueId);

    // Verify the session belongs to this coach and is confirmed
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('unique_id, session_id, coach_id, session_status, sport, date, start_time, end_time')
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId)
      .eq('session_status', 'confirmed')
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Session not found or not confirmed' });
    }

    console.log('Found session:', session);

    // Update session status to 'in_progress'
    const { error: updateError } = await supabase
      .from('Sessions')
      .update({ session_status: 'in_progress' })
      .eq('unique_id', uniqueId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return res.status(500).json({ error: 'Failed to start class' });
    }

    // Get students enrolled in this session to send notifications
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('student_id, student_status')
      .eq('id', uniqueId)
      .in('student_status', ['paid', 'unpaid']);

    if (!studentSessionsError && studentSessions && studentSessions.length > 0) {
      // Get student details for notifications
      const studentIds = studentSessions.map(ss => ss.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('Users')
        .select('id, first_name, last_name, email')
        .in('id', studentIds);

      if (!studentsError && students) {
        // Create notifications for each student
        const notifications = students.map(student => ({
          user_id: student.id,
          title: 'Class Started!',
          message: `Your ${session.sport} class with ${req.user.first_name} ${req.user.last_name} has started.`,
          type: 'class_started',
          session_id: uniqueId,
          created_at: new Date().toISOString()
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        } else {
          console.log(`Created ${notifications.length} notifications for students`);
        }
      }
    }

    console.log('Class started successfully');

    res.json({
      success: true,
      message: 'Class started successfully',
      session: {
        id: session.unique_id,
        sessionId: session.session_id,
        sport: session.sport,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time
      }
    });

  } catch (error) {
    console.error('Error starting class:', error);
    res.status(500).json({ error: 'Failed to start class' });
  }
});

// End a class (update session status to 'completed')
router.post('/end-class', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { uniqueId } = req.body;

  if (!uniqueId) {
    return res.status(400).json({ error: 'Unique ID is required' });
  }

  try {
    console.log('=== END CLASS ===');
    console.log('Coach ID:', coachId);
    console.log('Unique ID:', uniqueId);

    // Verify the session belongs to this coach and is in progress
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('unique_id, session_id, coach_id, session_status, sport, date, start_time, end_time, price_per_session')
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId)
      .eq('session_status', 'in_progress')
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Session not found or not in progress' });
    }

    console.log('Found session:', session);

    // Get students enrolled in this session
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('student_id, student_status')
      .eq('id', uniqueId)
      .in('student_status', ['paid', 'unpaid']);

    if (studentSessionsError) {
      console.error('Error fetching student sessions:', studentSessionsError);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }

    // Update student session statuses to 'attended'
    if (studentSessions && studentSessions.length > 0) {
      const studentIds = studentSessions.map(ss => ss.student_id);
      const { error: updateStudentError } = await supabase
        .from('Student_sessions')
        .update({ student_status: 'attended' })
        .eq('id', uniqueId)
        .in('student_id', studentIds);

      if (updateStudentError) {
        console.error('Error updating student sessions:', updateStudentError);
        return res.status(500).json({ error: 'Failed to update student sessions' });
      }
    }

    // Update session status to 'completed'
    const { error: updateError } = await supabase
      .from('Sessions')
      .update({ session_status: 'completed' })
      .eq('unique_id', uniqueId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return res.status(500).json({ error: 'Failed to end class' });
    }

    // Calculate total earnings for this session
    const totalEarnings = studentSessions ? studentSessions.length * parseFloat(session.price_per_session || 0) : 0;

    console.log('Class ended successfully');

    res.json({
      success: true,
      message: 'Class ended successfully',
      session: {
        id: session.unique_id,
        sessionId: session.session_id,
        sport: session.sport,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        totalEarnings: totalEarnings,
        studentsAttended: studentSessions ? studentSessions.length : 0
      }
    });

  } catch (error) {
    console.error('Error ending class:', error);
    res.status(500).json({ error: 'Failed to end class' });
  }
});

// Submit class feedback
router.post('/submit-feedback', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { 
    uniqueId, 
    generalFeedback, 
    topicsCovered, 
    studentProgress, 
    nextSessionPlan,
    studentFeedbacks 
  } = req.body;

  if (!uniqueId || !generalFeedback) {
    return res.status(400).json({ error: 'Unique ID and general feedback are required' });
  }

  try {
    console.log('=== SUBMIT FEEDBACK ===');
    console.log('Coach ID:', coachId);
    console.log('Unique ID:', uniqueId);

    // Verify the session belongs to this coach and is completed
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('unique_id, session_id, coach_id, session_status, sport, date')
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId)
      .eq('session_status', 'completed')
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Session not found or not completed' });
    }

    console.log('Found session:', session);

    // Insert general feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('Class_Feedback')
      .insert({
        session_unique_id: uniqueId,
        coach_id: coachId,
        general_feedback: generalFeedback,
        topics_covered: topicsCovered || '',
        student_progress: studentProgress || '',
        next_session_plan: nextSessionPlan || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    // Insert individual student feedback if provided
    if (studentFeedbacks && studentFeedbacks.length > 0) {
      const studentFeedbackData = studentFeedbacks.map(sf => ({
        session_unique_id: uniqueId,
        coach_id: coachId,
        student_id: sf.studentId,
        feedback: sf.feedback,
        rating: sf.rating || null,
        created_at: new Date().toISOString()
      }));

      const { error: studentFeedbackError } = await supabase
        .from('Student_Feedback')
        .insert(studentFeedbackData);

      if (studentFeedbackError) {
        console.error('Error inserting student feedback:', studentFeedbackError);
        // Don't fail the entire request, just log the error
      }
    }

    // Process payment to coach wallet
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('student_id, student_status')
      .eq('id', uniqueId)
      .eq('student_status', 'attended');

    if (!studentSessionsError && studentSessions && studentSessions.length > 0) {
      // Get session price
      const { data: sessionDetails, error: sessionDetailsError } = await supabase
        .from('Sessions')
        .select('price_per_session')
        .eq('unique_id', uniqueId)
        .single();

      if (!sessionDetailsError && sessionDetails) {
        const totalEarnings = studentSessions.length * parseFloat(sessionDetails.price_per_session || 0);
        
        // Get coach wallet
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', coachId)
          .single();

        if (!walletError && wallet) {
          const newBalance = parseFloat(wallet.balance || 0) + totalEarnings;
          
          // Update wallet balance
          const { error: updateWalletError } = await supabase
            .from('wallets')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', wallet.id);

          if (!updateWalletError) {
            // Create transaction record
            await supabase
              .from('transactions')
              .insert({
                wallet_id: wallet.id,
                user_id: coachId,
                type: 'deposit',
                amount: totalEarnings,
                description: `Class earnings - ${session.sport} session on ${session.date}`,
                status: 'completed',
                transfer_id: `class_${uniqueId}_${Date.now()}`
              });
          }
        }
      }
    }

    console.log('Feedback submitted successfully');

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback.id,
        sessionId: uniqueId,
        generalFeedback: generalFeedback,
        topicsCovered: topicsCovered,
        studentProgress: studentProgress,
        nextSessionPlan: nextSessionPlan,
        studentFeedbacksCount: studentFeedbacks ? studentFeedbacks.length : 0
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Submit attendance for a class
router.post('/submit-attendance', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { sessionId, attendance } = req.body;

  try {
    console.log('=== SUBMIT ATTENDANCE ===');
    console.log('Coach ID:', coachId);
    console.log('Session ID:', sessionId);
    console.log('Attendance:', attendance);

    if (!sessionId || !attendance) {
      return res.status(400).json({ error: 'Missing sessionId or attendance data' });
    }

    // Verify the session belongs to this coach
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('unique_id, coach_id, session_status')
      .eq('unique_id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized to submit attendance for this session' });
    }

    // Get students enrolled in this session
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, student_status')
      .eq('id', sessionId);

    if (studentSessionsError) {
      console.error('Error fetching student sessions:', studentSessionsError);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }

    // Insert attendance records for each student
    const attendanceRecords = [];
    for (const studentSession of studentSessions) {
      const studentAttendance = attendance[studentSession.student_id];
      if (studentAttendance) {
        attendanceRecords.push({
          session_unique_id: sessionId,
          student_id: studentSession.student_id,
          coach_id: coachId,
          status: studentAttendance,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Insert all attendance records
    if (attendanceRecords.length > 0) {
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (attendanceError) {
        console.error('Error inserting attendance records:', attendanceError);
        return res.status(500).json({ error: 'Failed to submit attendance' });
      }
    }

    // Also update student session status for backward compatibility
    const studentSessionUpdates = [];
    for (const studentSession of studentSessions) {
      const studentAttendance = attendance[studentSession.student_id];
      if (studentAttendance) {
        let newStatus = 'unpaid';
        
        // Map attendance status to student status
        switch (studentAttendance) {
          case 'present':
          case 'late':
            newStatus = 'attended';
            break;
          case 'absent':
            newStatus = 'absent';
            break;
          default:
            newStatus = 'unpaid';
        }

        studentSessionUpdates.push({
          id: studentSession.id,
          student_status: newStatus
        });
      }
    }

    // Update student sessions
    if (studentSessionUpdates.length > 0) {
      for (const update of studentSessionUpdates) {
        const { error: updateError } = await supabase
          .from('Student_sessions')
          .update({ 
            student_status: update.student_status
          })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating student session:', updateError);
          // Don't fail the entire request, just log the error
        }
      }
    }

    console.log('Attendance submitted successfully');

    res.json({
      success: true,
      message: 'Attendance submitted successfully',
      attendance: attendance,
      updatedCount: studentSessionUpdates.length
    });

  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ error: 'Failed to submit attendance' });
  }
});

// Update session status endpoint
router.post('/update-session-status', verifySupabaseToken, async (req, res) => {
  const coachId = req.user.id;
  const { sessionId, status } = req.body;

  try {
    console.log('=== UPDATE SESSION STATUS (COACH) ===');
    console.log('Coach ID:', coachId);
    console.log('Session ID:', sessionId);
    console.log('New Status:', status);

    // Verify the coach owns this session
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('coach_id', coachId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found or coach not authorized:', sessionError);
      return res.status(404).json({ error: 'Session not found or coach not authorized' });
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

module.exports = router; 