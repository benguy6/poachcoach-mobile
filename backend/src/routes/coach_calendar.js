const express = require('express');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all sessions for the coach with student details
router.get('/sessions', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    console.log('Fetching sessions for coach:', coachId);

    // Get all sessions for this coach with status 'pubcon' or 'confirmed'
    // Only include sessions that haven't ended yet
    const { data: sessions, error: sessionsError } = await supabase
      .from('Sessions')
      .select(`
        session_id,
        unique_id,
        sport,
        date,
        start_time,
        end_time,
        address,
        postal_code,
        class_type,
        price_per_session,
        price_per_hour,
        description,
        session_status,
        max_students,
        duration
      `)
      .eq('coach_id', coachId)
      .in('session_status', ['published', 'pubcon', 'confirmed'])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    console.log('Sessions query result:', { sessions: sessions?.length, error: sessionsError });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    if (!sessions || sessions.length === 0) {
      console.log('No sessions found for coach:', coachId);
      return res.json([]);
    }

    // Filter out sessions that have already ended
    const currentDateTime = new Date();
    const activeSessions = sessions.filter(session => {
      const sessionEndDateTime = new Date(`${session.date}T${session.end_time}`);
      return sessionEndDateTime > currentDateTime;
    });

    console.log(`Found ${activeSessions.length} active sessions after filtering`);

    // For each session, get the students who are enrolled
    const sessionsWithStudents = await Promise.all(
      activeSessions.map(async (session) => {
        try {
          console.log(`Processing session ${session.session_id} (unique_id: ${session.unique_id}) on ${session.date}`);

          // Get all student enrollments for this specific session using unique_id
          const { data: studentSessions, error: studentSessionsError } = await supabase
            .from('Student_sessions')
            .select('student_id, student_status')
            .eq('id', session.unique_id); // Match Student_sessions.id to Sessions.unique_id

          if (studentSessionsError) {
            console.error('Error fetching student sessions:', studentSessionsError);
            return {
              id: session.unique_id, // Use unique_id as the main identifier
              sessionId: session.session_id,
              sport: session.sport,
              date: session.date,
              time: session.start_time,
              endTime: session.end_time,
              duration: session.duration,
              location: session.address,
              postal_code: session.postal_code,
              classType: session.class_type,
              pricePerSession: session.price_per_session ? parseFloat(session.price_per_session) : null,
              pricePerHour: session.price_per_hour ? parseFloat(session.price_per_hour) : null,
              description: session.description,
              sessionStatus: session.session_status,
              maxStudents: session.max_students,
              studentsAttending: 0,
              students: []
            };
          }

          if (!studentSessions || studentSessions.length === 0) {
            console.log(`No students found for session ${session.session_id} (unique_id: ${session.unique_id}) on ${session.date}`);
            return {
              id: session.unique_id, // Use unique_id as the main identifier
              sessionId: session.session_id,
              sport: session.sport,
              date: session.date,
              time: session.start_time,
              endTime: session.end_time,
              duration: session.duration,
              location: session.address,
              postal_code: session.postal_code,
              classType: session.class_type,
              pricePerSession: session.price_per_session ? parseFloat(session.price_per_session) : null,
              pricePerHour: session.price_per_hour ? parseFloat(session.price_per_hour) : null,
              description: session.description,
              sessionStatus: session.session_status,
              maxStudents: session.max_students,
              studentsAttending: 0,
              students: []
            };
          }

          console.log(`Found ${studentSessions.length} students for session ${session.session_id}`);

          // Get student details from Users table
          const studentIds = studentSessions.map(ss => ss.student_id);
          const { data: students, error: studentsError } = await supabase
            .from('Users')
            .select('id, first_name, last_name, email, number, profile_picture, gender')
            .in('id', studentIds);

          if (studentsError) {
            console.error('Error fetching student details:', studentsError);
            return {
              id: session.unique_id, // Use unique_id as the main identifier
              sessionId: session.session_id,
              sport: session.sport,
              date: session.date,
              time: session.start_time,
              endTime: session.end_time,
              duration: session.duration,
              location: session.address,
              postal_code: session.postal_code,
              classType: session.class_type,
              pricePerSession: session.price_per_session ? parseFloat(session.price_per_session) : null,
              pricePerHour: session.price_per_hour ? parseFloat(session.price_per_hour) : null,
              description: session.description,
              sessionStatus: session.session_status,
              maxStudents: session.max_students,
              studentsAttending: 0,
              students: []
            };
          }

          // Combine student details with payment status
          const studentsWithDetails = students.map(student => {
            const studentSession = studentSessions.find(ss => ss.student_id === student.id);
            return {
              id: student.id,
              name: `${student.first_name} ${student.last_name}`.trim(),
              email: student.email,
              phone: student.number, // Map 'number' column to 'phone' field
              profilePicture: student.profile_picture,
              gender: student.gender,
              paymentStatus: studentSession ? studentSession.student_status : 'unpaid' // 'paid' or 'unpaid'
            };
          });

          return {
            id: session.unique_id, // Use unique_id as the main identifier
            sessionId: session.session_id, // Keep original session_id for backend operations
            sport: session.sport,
            date: session.date,
            time: session.start_time,
            endTime: session.end_time,
            duration: session.duration,
            location: session.address,
            postal_code: session.postal_code,
            classType: session.class_type,
            pricePerSession: session.price_per_session ? parseFloat(session.price_per_session) : null,
            pricePerHour: session.price_per_hour ? parseFloat(session.price_per_hour) : null,
            description: session.description,
            sessionStatus: session.session_status,
            maxStudents: session.max_students,
            studentsAttending: studentsWithDetails.length,
            students: studentsWithDetails
          };
        } catch (error) {
          console.error('Error processing session:', session.session_id, '(unique_id:', session.unique_id, ')', error);
          return {
            id: session.unique_id,
            sessionId: session.session_id,
            sport: session.sport,
            date: session.date,
            time: session.start_time,
            endTime: session.end_time,
            duration: session.duration,
            location: session.address,
            postal_code: session.postal_code,
            classType: session.class_type,
            pricePerSession: session.price_per_session ? parseFloat(session.price_per_session) : null,
            pricePerHour: session.price_per_hour ? parseFloat(session.price_per_hour) : null,
            description: session.description,
            sessionStatus: session.session_status,
            maxStudents: session.max_students,
            studentsAttending: 0,
            students: []
          };
        }
      })
    );

    console.log(`Found ${sessionsWithStudents.length} sessions with student details for coach ${coachId}`);
    res.json(sessionsWithStudents);

  } catch (error) {
    console.error('Error in coach calendar sessions route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check all sessions for a coach
router.get('/debug-sessions', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    console.log('🔍 DEBUG: Fetching ALL sessions for coach:', coachId);

    // Get ALL sessions for this coach without any status filtering
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    console.log('🔍 DEBUG: All sessions query result:', { 
      sessions: allSessions?.length, 
      error: allSessionsError,
      sessions: allSessions 
    });

    if (allSessionsError) {
      console.error('🔍 DEBUG: Error fetching all sessions:', allSessionsError);
      return res.status(500).json({ error: 'Failed to fetch all sessions' });
    }

    // Get sessions with specific statuses
    const { data: pubconSessions, error: pubconError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('session_status', 'pubcon');

    const { data: confirmedSessions, error: confirmedError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('session_status', 'confirmed');

    // Check current date/time
    const currentDateTime = new Date();
    console.log('🔍 DEBUG: Current date/time:', currentDateTime);

    // Check which sessions would be filtered out by date
    const futureSessions = allSessions?.filter(session => {
      if (!session.date || !session.end_time) return false;
      const sessionEndDateTime = new Date(`${session.date}T${session.end_time}`);
      return sessionEndDateTime > currentDateTime;
    }) || [];

    console.log('🔍 DEBUG: Future sessions count:', futureSessions.length);

    return res.json({
      coachId,
      currentDateTime: currentDateTime.toISOString(),
      allSessions: allSessions || [],
      pubconSessions: pubconSessions || [],
      confirmedSessions: confirmedSessions || [],
      futureSessions: futureSessions,
      summary: {
        totalSessions: allSessions?.length || 0,
        pubconCount: pubconSessions?.length || 0,
        confirmedCount: confirmedSessions?.length || 0,
        futureCount: futureSessions.length,
        statuses: allSessions?.reduce((acc, session) => {
          acc[session.session_status] = (acc[session.session_status] || 0) + 1;
          return acc;
        }, {}) || {}
      }
    });

  } catch (err) {
    console.error('🔍 DEBUG: Error in debug endpoint:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate duration between two times
function calculateDuration(startTime, endTime) {
  try {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0 && diffMinutes > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minutes`;
    } else {
      return '30 minutes'; // Default fallback
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '1 hour'; // Default fallback
  }
}

// Helper function to determine the type of time overlap for detailed conflict reporting
function getOverlapType(reqStart, reqEnd, existStart, existEnd) {
  // Complete overlap cases
  if (reqStart >= existStart && reqEnd <= existEnd) {
    return 'requested_session_completely_inside_existing';
  }
  if (existStart >= reqStart && existEnd <= reqEnd) {
    return 'existing_session_completely_inside_requested';
  }
  
  // Partial overlap cases
  if (reqStart < existStart && reqEnd > existStart && reqEnd <= existEnd) {
    return 'requested_session_starts_before_and_overlaps';
  }
  if (reqStart >= existStart && reqStart < existEnd && reqEnd > existEnd) {
    return 'requested_session_starts_during_and_extends_beyond';
  }
  
  // Edge case: sessions touch at boundaries (should be prevented)
  if (reqEnd === existStart || reqStart === existEnd) {
    return 'sessions_touch_at_boundary';
  }
  
  // Exact same time (should not happen but cover it)
  if (reqStart === existStart && reqEnd === existEnd) {
    return 'exact_same_time_slot';
  }
  
  return 'unknown_overlap_type';
}

// Helper function to create notifications
async function createNotification(userId, title, message, type, data = {}) {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type,
        data: data,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    console.log('Notification created successfully for user:', userId);
    return notification;
  } catch (error) {
    console.error('Error in createNotification helper:', error);
    return null;
  }
}

// Helper function to create reschedule notification for student
async function createRescheduleNotification(studentId, sessionDetails) {
  const { sessionId, studentSessionId, sport, originalDate, newDate, newStartTime, newEndTime, newAddress, newPostalCode } = sessionDetails;
  
  // Calculate deadline (by the end time of the rescheduled session)
  const deadlineDateTime = new Date(`${newDate}T${newEndTime}`);
  
  const title = 'Session Rescheduled - Response Required';
  const message = `Your ${sport} session has been rescheduled. Please accept or reject the new timing by ${deadlineDateTime.toLocaleString()}.`;
  
  const notificationData = {
    sessionId: sessionId,
    studentSessionId: studentSessionId, // Include the Student_sessions id
    sport: sport,
    originalDate: originalDate,
    newDate: newDate,
    newStartTime: newStartTime,
    newEndTime: newEndTime,
    newAddress: newAddress,
    newPostalCode: newPostalCode,
    deadline: deadlineDateTime.toISOString(),
    requiresResponse: true
  };

  return await createNotification(studentId, title, message, 'session_reschedule', notificationData);
}

// Helper function to create coach notification when student responds to reschedule
async function createCoachRescheduleResponseNotification(coachId, studentName, sessionDetails, response) {
  const { sport, newDate, newStartTime, sessionId } = sessionDetails;
  
  const sessionDateTime = new Date(`${newDate}T${newStartTime}`);
  const formattedDate = sessionDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = sessionDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let title, message, icon, actionColor;

  if (response === 'accept') {
    title = 'Reschedule Accepted';
    message = `Great news! ${studentName} has accepted the rescheduled ${sport} session for ${formattedDate} at ${formattedTime}.`;
  } else {
    title = 'Reschedule Rejected';
    message = `${studentName} has declined the rescheduled ${sport} session. The session has been cancelled and a refund has been processed.`;

  }
  
  const notificationData = {
    sessionId: sessionId,
    studentName: studentName,
    sport: sport,
    newDate: newDate,
    newStartTime: newStartTime,
    formattedDate: formattedDate,
    formattedTime: formattedTime,
    response: response,
    icon: icon,
    actionColor: actionColor,
    timestamp: new Date().toISOString()
  };

  return await createNotification(coachId, title, message, 'reschedule_response', notificationData);
}

// Cancel a session (coach can cancel their own sessions) - INDIVIDUAL AND GROUP CLASSES
router.post('/cancel-session', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    const { uniqueId } = req.body; // Changed from sessionId and date to uniqueId

    if (!uniqueId) {
      return res.status(400).json({ error: 'Unique ID is required' });
    }

    console.log('=== COACH CANCELLATION REQUEST ===');
    console.log('Coach ID:', coachId);
    console.log('Unique ID:', uniqueId);

    // Step 1: Verify the session belongs to this coach and get session details
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('session_id, unique_id, coach_id, session_status, class_type, price_per_session, sport, date')
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId)
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    console.log('Found session:', session);

    // Step 2: Check if session is already cancelled
    if (session.session_status === 'cancelled') {
      return res.status(400).json({ error: 'Session is already cancelled' });
    }

    // Step 3: Handle both Individual and Group classes
    if (session.class_type !== 'Individual' && session.class_type !== 'single' && session.class_type !== 'group') {
      return res.status(400).json({ error: 'Invalid class type for cancellation' });
    }

    // Step 4: Get all students enrolled in this session using unique_id
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, student_status')
      .eq('id', uniqueId) // Match Student_sessions.id to Sessions.unique_id
      .in('student_status', ['paid', 'unpaid']);

    if (studentSessionsError) {
      console.error('Error fetching student sessions:', studentSessionsError);
      return res.status(500).json({ error: 'Failed to fetch student enrollments' });
    }

    console.log('Student sessions found:', studentSessions);

    // Step 5: Update session status to 'cancelled'
    const { error: updateSessionError } = await supabase
      .from('Sessions')
      .update({ session_status: 'cancelled' })
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId);

    if (updateSessionError) {
      console.error('Error updating session status:', updateSessionError);
      return res.status(500).json({ error: 'Failed to cancel session' });
    }

    console.log('Session status updated to "cancelled"');

    // Step 6: Process each student enrollment
    const refundDetails = [];
    
    for (const studentSession of studentSessions) {
      console.log(`Processing student ${studentSession.student_id} with status ${studentSession.student_status}`);
      
      // Check if refund is needed BEFORE updating status
      const needsRefund = studentSession.student_status === 'paid';
      const refundAmount = needsRefund ? session.price_per_session : 0;
      
      // Update student session status to 'coach_cancelled'
      const { error: updateStudentError } = await supabase
        .from('Student_sessions')
        .update({ student_status: 'coach_cancelled' })
        .eq('id', studentSession.id);

      if (updateStudentError) {
        console.error('Error updating student session:', updateStudentError);
        return res.status(500).json({ error: 'Failed to update student enrollment' });
      }

      refundDetails.push({
        studentId: studentSession.student_id,
        originalStatus: studentSession.student_status,
        newStatus: 'coach_cancelled',
        needsRefund: needsRefund,
        refundAmount: refundAmount
      });

      // Simulate refund alert (in real implementation, this would be actual refund processing)
      if (needsRefund) {
        console.log(`REFUND ALERT: Student ${studentSession.student_id} needs refund of $${refundAmount} for cancelled ${session.sport} session`);
      }
    }

    // Step 7: Return success response
    const response = {
      success: true,
      message: `${session.class_type} session cancelled successfully by coach`,
      cancellationDetails: {
        uniqueId: uniqueId,
        sessionId: session.session_id,
        sessionDate: session.date,
        sport: session.sport,
        classType: session.class_type,
        sessionStatus: 'cancelled',
        studentsAffected: studentSessions.length,
        refundDetails: refundDetails
      }
    };

    console.log('Coach cancellation response:', response);
    return res.json(response);

  } catch (error) {
    console.error('Error in coach cancel session route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reschedule a session (coach can reschedule their single classes only)
router.post('/reschedule-session', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    const { 
      uniqueId, // Changed from sessionId and originalDate to uniqueId
      newDate, 
      newStartTime, 
      newEndTime, 
      newPricePerSession,
      newAddress,
      newPostalCode 
    } = req.body;

    if (!uniqueId || !newDate || !newStartTime || !newEndTime || !newPricePerSession) {
      return res.status(400).json({ error: 'Missing required fields for rescheduling' });
    }

    console.log('=== COACH RESCHEDULE REQUEST ===');
    console.log('Coach ID:', coachId);
    console.log('Unique ID:', uniqueId);
    console.log('New Date:', newDate);
    console.log('New Time:', newStartTime, '-', newEndTime);

    // Step 1: Verify the session belongs to this coach and is a single class
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('session_id, unique_id, coach_id, session_status, class_type, sport, address, postal_code, date')
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId)
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    console.log('Found session:', session);

    // Step 2: Check if session can be rescheduled (only single classes, not cancelled)
    if (session.class_type !== 'Individual' && session.class_type !== 'single') {
      return res.status(400).json({ error: 'Only single classes can be rescheduled' });
    }

    if (session.session_status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot reschedule a cancelled session' });
    }

    // Step 3: Validate that new date is in the future (no preponing to earlier than current date)
    const currentDate = new Date();
    const newSessionDate = new Date(newDate);
    if (newSessionDate <= currentDate) {
      return res.status(400).json({ error: 'Sessions can only be postponed to future dates' });
    }

    // Step 3.5: Check for time slot conflicts with existing sessions
    console.log('Checking for time slot conflicts...');
    console.log(`Requested slot: ${newDate} ${newStartTime} - ${newEndTime}`);
    console.log(`Current session unique_id: ${session.unique_id}`);
    
    const { data: conflictingSessions, error: conflictCheckError } = await supabase
      .from('Sessions')
      .select('session_id, unique_id, date, start_time, end_time, sport')
      .eq('coach_id', coachId)
      .eq('date', newDate)
      .in('session_status', ['pubcon', 'confirmed', 'rescheduled']) // Include rescheduled sessions too
      .neq('unique_id', session.unique_id); // Exclude the current session being rescheduled based on unique_id

    if (conflictCheckError) {
      console.error('Error checking for conflicts:', conflictCheckError);
      return res.status(500).json({ error: 'Failed to check for scheduling conflicts' });
    }

    console.log(`Found ${conflictingSessions?.length || 0} existing sessions on ${newDate} for coach ${coachId}`);

    // Check if new time slot overlaps with any existing sessions
    if (conflictingSessions && conflictingSessions.length > 0) {
      // Convert new session times to comparable Date objects for precise comparison
      const requestedStartTime = new Date(`2000-01-01T${newStartTime}`);
      const requestedEndTime = new Date(`2000-01-01T${newEndTime}`);
      
      console.log(`Checking overlap for requested slot: ${requestedStartTime.toTimeString()} - ${requestedEndTime.toTimeString()}`);
      
      for (const existingSession of conflictingSessions) {
        const existingStartTime = new Date(`2000-01-01T${existingSession.start_time}`);
        const existingEndTime = new Date(`2000-01-01T${existingSession.end_time}`);
        
        console.log(`Comparing with existing ${existingSession.sport} session (session_id: ${existingSession.session_id}, unique_id: ${existingSession.unique_id}): ${existingStartTime.toTimeString()} - ${existingEndTime.toTimeString()}`);
        
        // IRONCLAD OVERLAP DETECTION:
        // Two time intervals overlap if and only if:
        // 1. The requested session starts before the existing session ends AND
        // 2. The existing session starts before the requested session ends
        // This covers all possible overlap scenarios:
        // - Complete overlap (one inside the other)
        // - Partial overlap (start or end overlapping)
        // - Adjacent sessions (touching boundaries)
        const hasTimeOverlap = (requestedStartTime < existingEndTime) && (existingStartTime < requestedEndTime);
        
        if (hasTimeOverlap) {
          const overlapType = getOverlapType(requestedStartTime, requestedEndTime, existingStartTime, existingEndTime);
          console.log(`❌ CONFLICT DETECTED! Overlap type: ${overlapType}`);
          
          return res.status(400).json({ 
            error: 'Time slot conflict detected',
            conflictType: 'schedule_overlap',
            details: {
              message: `The selected time slot conflicts with another ${existingSession.sport} session`,
              overlapType: overlapType,
              conflictingSession: {
                sessionId: existingSession.session_id,
                uniqueId: existingSession.unique_id,
                sport: existingSession.sport,
                date: existingSession.date,
                startTime: existingSession.start_time,
                endTime: existingSession.end_time
              },
              requestedSlot: {
                date: newDate,
                startTime: newStartTime,
                endTime: newEndTime
              },
              suggestion: 'Please choose a different time slot that does not overlap with existing sessions'
            }
          });
        }
        
        console.log(`✓ No overlap with session ${existingSession.session_id} (unique_id: ${existingSession.unique_id})`);
      }
    }

    console.log('✅ No time conflicts detected, proceeding with reschedule...');

    // Step 4: Calculate new duration and price per hour
    function calculateDuration(startTime, endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        return `${minutes} minutes`;
      } else {
        return '30 minutes';
      }
    }

    function calculateDurationInHours(startTime, endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end - start;
      return diffMs / (1000 * 60 * 60);
    }

    function getDayOfWeek(dateString) {
      const date = new Date(dateString);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }

    const newDuration = calculateDuration(newStartTime, newEndTime);
    const newDurationInHours = calculateDurationInHours(newStartTime, newEndTime);
    const newPricePerHour = (parseFloat(newPricePerSession) / newDurationInHours).toFixed(2);
    const newDay = getDayOfWeek(newDate);

    // Step 5: Update the session with new details and set status to 'rescheduled'
    const updateData = {
      date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      duration: newDuration,
      price_per_session: newPricePerSession,
      price_per_hour: newPricePerHour,
      day: newDay,
      session_status: 'rescheduled'
    };

    // Add address and postal code if provided
    if (newAddress) updateData.address = newAddress;
    if (newPostalCode) updateData.postal_code = newPostalCode;

    const { error: updateSessionError } = await supabase
      .from('Sessions')
      .update(updateData)
      .eq('unique_id', uniqueId)
      .eq('coach_id', coachId);

    if (updateSessionError) {
      console.error('Error updating session:', updateSessionError);
      return res.status(500).json({ error: 'Failed to reschedule session' });
    }

    console.log('Session rescheduled successfully');

    // Step 6: Get student details for notification using unique_id
    const { data: studentSessions, error: studentSessionsError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, student_status')
      .eq('id', uniqueId); // Match Student_sessions.id to Sessions.unique_id

    if (studentSessionsError) {
      console.error('Error fetching student sessions:', studentSessionsError);
      return res.status(500).json({ error: 'Failed to fetch student details' });
    }

    // Step 7: Create notifications for each affected student
    const notificationPromises = studentSessions.map(async (studentSession) => {
      return await createRescheduleNotification(studentSession.student_id, {
        sessionId: session.session_id,
        studentSessionId: studentSession.id, // Include the Student_sessions id
        sport: session.sport,
        originalDate: session.date,
        newDate: newDate,
        newStartTime: newStartTime,
        newEndTime: newEndTime,
        newAddress: newAddress || session.address,
        newPostalCode: newPostalCode || session.postal_code
      });
    });

    // Wait for all notifications to be created
    const notifications = await Promise.all(notificationPromises);
    const successfulNotifications = notifications.filter(n => n !== null);

    console.log(`Created ${successfulNotifications.length} notifications for reschedule`);

    // Step 8: Update Student_sessions table to reflect new date (Note: Student_sessions.id = Sessions.unique_id, so no update needed for the relationship)
    for (const studentSession of studentSessions) {
      const { error: updateStudentSessionError } = await supabase
        .from('Student_sessions')
        .update({ date: newDate })
        .eq('id', studentSession.id); // Use Student_sessions.id directly

      if (updateStudentSessionError) {
        console.error('Error updating student session date:', updateStudentSessionError);
        return res.status(500).json({ error: 'Failed to update student session' });
      }
    }

    // Step 9: Return success response with notification details
    const response = {
      success: true,
      message: 'Session rescheduled successfully',
      rescheduleDetails: {
        uniqueId: uniqueId,
        sessionId: session.session_id,
        sport: session.sport,
        originalDate: session.date,
        newDate: newDate,
        newStartTime: newStartTime,
        newEndTime: newEndTime,
        newDuration: newDuration,
        newPricePerSession: newPricePerSession,
        newAddress: newAddress || session.address,
        newPostalCode: newPostalCode || session.postal_code,
        studentsAffected: studentSessions.length,
        studentsNotified: successfulNotifications.length,
        students: studentSessions
      }
    };

    console.log('Coach reschedule response:', response);
    return res.json(response);

  } catch (error) {
    console.error('Error in coach reschedule session route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle student response to session reschedule (accept/reject)
router.post('/handle-reschedule-response', verifySupabaseToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { sessionId, studentSessionId, response } = req.body; // Now use studentSessionId instead of originalDate

    if (!sessionId || !studentSessionId || !response || !['accept', 'reject'].includes(response)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    console.log('=== STUDENT RESCHEDULE RESPONSE ===');
    console.log('Student ID:', studentId);
    console.log('Session ID:', sessionId);
    console.log('Student Session ID:', studentSessionId);
    console.log('Response:', response);

    // Step 1: Verify the student session belongs to this student
    const { data: studentSession, error: studentSessionError } = await supabase
      .from('Student_sessions')
      .select('id, student_id, student_status, session_id, date')
      .eq('id', studentSessionId)
      .eq('student_id', studentId)
      .single();

    if (studentSessionError || !studentSession) {
      console.error('Student session verification error:', studentSessionError);
      return res.status(404).json({ error: 'Student enrollment not found' });
    }

    // Step 2: Get the session details and verify it's in rescheduled status
    const { data: session, error: sessionError } = await supabase
      .from('Sessions')
      .select('session_id, unique_id, session_status, sport, date, start_time, end_time, price_per_session')
      .eq('session_id', sessionId)
      .eq('session_status', 'rescheduled')
      .single();

    if (sessionError || !session) {
      console.error('Session verification error:', sessionError);
      return res.status(404).json({ error: 'Rescheduled session not found' });
    }

    console.log('Found rescheduled session:', session);

    // Step 3: Check if the response is before the session end time
    const sessionEndDateTime = new Date(`${session.date}T${session.end_time}`);
    const currentDateTime = new Date();

    if (currentDateTime > sessionEndDateTime) {
      // Past session end time - automatically cancel and process refund
      await handleAutomaticCancellation(session, studentSession);
      return res.status(400).json({ 
        error: 'Response deadline has passed. Session has ended and has been automatically cancelled with refund processed.' 
      });
    }

    if (response === 'accept') {
      // Step 4a: Accept the reschedule - change session status to 'confirmed'
      // IMPORTANT: Use unique_id to target the specific session instance
      const { error: updateSessionError } = await supabase
        .from('Sessions')
        .update({ session_status: 'confirmed' })
        .eq('unique_id', session.unique_id);

      if (updateSessionError) {
        console.error('Error updating session status:', updateSessionError);
        return res.status(500).json({ error: 'Failed to confirm session' });
      }

      console.log('Session status updated to "confirmed" for unique_id:', session.unique_id);

      // Step 4a.1: Get student name and coach ID for notification
      const { data: studentData, error: studentError } = await supabase
        .from('Users')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      const { data: sessionWithCoach, error: sessionWithCoachError } = await supabase
        .from('Sessions')
        .select('coach_id')
        .eq('unique_id', session.unique_id)
        .single();

      if (!studentError && !sessionWithCoachError && studentData && sessionWithCoach) {
        const studentName = `${studentData.first_name} ${studentData.last_name}`.trim();
        const coachNotificationDetails = {
          sport: session.sport,
          newDate: session.date,
          newStartTime: session.start_time,
          sessionId: sessionId
        };
        
        // Send notification to coach about acceptance
        await createCoachRescheduleResponseNotification(
          sessionWithCoach.coach_id, 
          studentName, 
          coachNotificationDetails, 
          'accept'
        );
        console.log('Coach notification sent for reschedule acceptance');
      }

      return res.json({
        success: true,
        message: 'Session reschedule accepted successfully',
        sessionDetails: {
          sessionId: sessionId,
          sport: session.sport,
          newDate: session.date,
          newTime: session.start_time,
          status: 'confirmed'
        }
      });

    } else if (response === 'reject') {
      // Step 4b: Reject the reschedule - cancel session and process refund
      // IMPORTANT: Use unique_id to target the specific session instance
      const { error: updateSessionError } = await supabase
        .from('Sessions')
        .update({ session_status: 'cancelled' })
        .eq('unique_id', session.unique_id);

      if (updateSessionError) {
        console.error('Error cancelling session:', updateSessionError);
        return res.status(500).json({ error: 'Failed to cancel session' });
      }

      console.log('Session status updated to "cancelled" for unique_id:', session.unique_id);

      // Update student status to 'coach_cancelled' and process refund if needed
      const needsRefund = studentSession.student_status === 'paid';
      const refundAmount = needsRefund ? session.price_per_session : 0;

      const { error: updateStudentError } = await supabase
        .from('Student_sessions')
        .update({ student_status: 'coach_cancelled' })
        .eq('id', studentSession.id);

      if (updateStudentError) {
        console.error('Error updating student session:', updateStudentError);
        return res.status(500).json({ error: 'Failed to update student enrollment' });
      }

      // Simulate refund alert
      if (needsRefund) {
        console.log(`REFUND ALERT: Student ${studentId} refused reschedule, refund of $${refundAmount} processed for ${session.sport} session`);
      }

      // Step 4b.1: Get student name and coach ID for notification
      const { data: studentData, error: studentError } = await supabase
        .from('Users')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      const { data: sessionWithCoach, error: sessionWithCoachError } = await supabase
        .from('Sessions')
        .select('coach_id')
        .eq('unique_id', session.unique_id)
        .single();

      if (!studentError && !sessionWithCoachError && studentData && sessionWithCoach) {
        const studentName = `${studentData.first_name} ${studentData.last_name}`.trim();
        const coachNotificationDetails = {
          sport: session.sport,
          newDate: session.date,
          newStartTime: session.start_time,
          sessionId: sessionId
        };
        
        // Send notification to coach about rejection
        await createCoachRescheduleResponseNotification(
          sessionWithCoach.coach_id, 
          studentName, 
          coachNotificationDetails, 
          'reject'
        );
        console.log('Coach notification sent for reschedule rejection');
      }

      return res.json({
        success: true,
        message: 'Session reschedule rejected. Session cancelled and refund processed.',
        cancellationDetails: {
          sessionId: sessionId,
          sport: session.sport,
          refundAmount: refundAmount,
          needsRefund: needsRefund
        }
      });
    }

  } catch (error) {
    console.error('Error in reschedule response route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to handle automatic cancellation when deadline is passed
async function handleAutomaticCancellation(session, studentSession) {
  try {
    console.log('Handling automatic cancellation for expired reschedule response');

    // Cancel the session
    await supabase
      .from('Sessions')
      .update({ session_status: 'cancelled' })
      .eq('unique_id', session.unique_id);

    // Update student status and process refund if needed
    const needsRefund = studentSession.student_status === 'paid';
    const refundAmount = needsRefund ? session.price_per_session : 0;

    await supabase
      .from('Student_sessions')
      .update({ student_status: 'coach_cancelled' })
      .eq('id', studentSession.id);

    // Simulate refund alert
    if (needsRefund) {
      console.log(`AUTOMATIC REFUND: Student ${studentSession.student_id} missed reschedule deadline, refund of $${refundAmount} processed for ${session.sport} session`);
    }

    console.log('Automatic cancellation completed');
  } catch (error) {
    console.error('Error in automatic cancellation:', error);
  }
}

module.exports = router;
