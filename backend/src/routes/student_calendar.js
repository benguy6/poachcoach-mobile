const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

// GET /student/sessions - Fetch all sessions a student has booked
router.get('/sessions', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log('=== STUDENT CALENDAR REQUEST ===');
    console.log('User ID:', userId);
    
    // Step 1: Get all student sessions with 'paid' or 'unpaid' status (using userId directly)
    const { data: studentSessions, error: ssError } = await supabase
      .from('Student_sessions')
      .select('id, session_id, student_status, date')
      .eq('student_id', userId)
      .in('student_status', ['paid', 'unpaid']);
    
    console.log('Student Sessions from DB:', studentSessions);

    if (ssError) {
      console.error('Error fetching student sessions:', ssError);
      return res.status(500).json({ error: 'Failed to fetch student sessions' });
    }

    if (!studentSessions || studentSessions.length === 0) {
      return res.json({
        success: true,
        sessions: [],
        totalSessions: 0
      });
    }

    // Step 2: Get unique_ids from Student_sessions.id, then fetch Sessions data using unique_id
    const uniqueIds = studentSessions.map(ss => ss.id); // Student_sessions.id matches Sessions.unique_id
    console.log('Unique IDs to fetch:', uniqueIds);
    
    const { data: sessionData, error: sessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .in('unique_id', uniqueIds);
    
    console.log('Session Data from DB:', sessionData);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    // Step 3: Get unique coach IDs from the sessions
    const coachIds = [...new Set(sessionData.map(session => session.coach_id))];
    console.log('Coach IDs to fetch:', coachIds);

    // Step 4: Get coach data from Users table
    const { data: coaches, error: coachesError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, profile_picture, email, gender')
      .in('id', coachIds);
    
    console.log('Coach Data from DB:', coaches);

    if (coachesError) {
      console.error('Error fetching coaches:', coachesError);
      return res.status(500).json({ error: 'Failed to fetch coaches' });
    }

    // Step 5: Get ratings for all coaches (following find_coach.js pattern)
    const { data: ratings, error: ratingsError } = await supabase
      .from('Rating')
      .select('*')
      .in('coach_id', coachIds);
    
    console.log('Ratings Data from DB:', ratings);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }

    // Step 6: Get qualifications for all coaches (following find_coach.js pattern)
    const { data: qualifications, error: qualificationsError } = await supabase
      .from('Qualifications')
      .select('*')
      .in('coach_id', coachIds);
    
    console.log('Qualifications Data from DB:', qualifications);

    if (qualificationsError) {
      console.error('Error fetching qualifications:', qualificationsError);
      return res.status(500).json({ error: 'Failed to fetch qualifications' });
    }

    // Step 7: Transform the data to match frontend expectations
    const sessions = studentSessions.map(studentSession => {
      // Find the corresponding session data using unique_id match
      const session = sessionData.find(s => 
        s.unique_id === studentSession.id
      );
      if (!session) {
        console.log(`No session found for Student_sessions.id (unique_id): ${studentSession.id}`);
        return null;
      }
      
      // Find the corresponding coach data
      const coach = coaches.find(c => c.id === session.coach_id);
      if (!coach) {
        console.log(`No coach found for coach_id: ${session.coach_id}`);
        return null;
      }
      
      console.log(`Processing session with unique_id ${session.unique_id} (session_id: ${session.session_id}) on ${session.date} with coach ${coach.id}`);
      
      // Calculate ratings for this coach (following find_coach.js pattern)
      const coachRatings = ratings.filter(rating => rating.coach_id === coach.id);
      let averageRating = 5.0;
      let reviewCount = 1;

      if (coachRatings && coachRatings.length > 0) {
        const totalRating = coachRatings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = totalRating / coachRatings.length;
        reviewCount = coachRatings.length;
        console.log(`Coach ${coach.id} has ${reviewCount} ratings, average: ${averageRating}`);
      } else {
        console.log(`Coach ${coach.id} has no ratings, using defaults`);
      }

      // Get qualifications for this coach (following find_coach.js pattern)
      const coachQualifications = qualifications.filter(qual => qual.coach_id === coach.id);
      console.log(`Coach ${coach.id} has ${coachQualifications.length} qualifications`);
      
      const sessionObject = {
        // Session booking info
        bookingId: studentSession.id,
        studentStatus: studentSession.student_status,
        
        // Session details (note: using unique_id as the main id)
        id: session.unique_id,
        sessionId: session.session_id, // Keep session_id for reference
        sessionType: session.session_type,
        startTime: session.start_time,
        endTime: session.end_time,
        duration: session.duration,
        date: session.date,
        day: session.day,
        postalCode: session.postal_code,
        address: session.address,
        latitude: session.latitude,
        longitude: session.longitude,
        classType: session.class_type,
        sessionStatus: session.session_status,
        price: session.price_per_session, // Using price_per_session from DB
        maxStudents: session.max_students,
        studentsAttending: session.students_attending,
        description: session.description,
        sport: session.sport || 'Training', // Add sport field
        
        // Coach details with ratings and qualifications
        coach: {
          id: coach.id,
          name: `${coach.first_name} ${coach.last_name}`.trim(),
          firstName: coach.first_name,
          lastName: coach.last_name,
          profilePicture: coach.profile_picture,
          email: coach.email,
          gender: coach.gender,
          // Rating info (from find_coach.js pattern)
          rating: Number(averageRating.toFixed(1)),
          reviewCount: reviewCount,
          // Qualifications (from find_coach.js pattern)
          qualifications: coachQualifications.map(qual => ({
            id: qual.id,
            name: qual.qualification_name,
            url: qual.qualification_url,
            uploaded_at: qual.uploaded_at
          }))
        }
      };
      
      console.log(`Created session object for unique_id ${session.unique_id} (session_id: ${session.session_id}) on ${session.date}:`, JSON.stringify(sessionObject, null, 2));
      return sessionObject;
    }).filter(session => session !== null); // Remove any null entries

    console.log('=== FINAL TRANSFORMED SESSIONS ===');
    console.log('Number of sessions:', sessions.length);
    console.log('Sessions data:', JSON.stringify(sessions, null, 2));

    // Step 8: Filter out sessions that have passed their end time
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format in local timezone
    
    console.log('🔍 Backend Student Calendar Date Debug:');
    console.log('Current Date (local):', currentDate);
    console.log('Current Time (local):', currentTime);
    
    const currentSessions = sessions.filter(session => {
      const sessionDate = session.date;
      const sessionEndTime = session.endTime;
      
      console.log(`Session ${session.id} on ${sessionDate} ends at ${sessionEndTime}`);
      
      if (sessionDate > currentDate) {
        return true; // Future date, keep session
      } else if (sessionDate < currentDate) {
        return false; // Past date, filter out
      } else {
        // Same date, compare times
        const [hour1, min1] = currentTime.split(':').map(Number);
        const [hour2, min2] = sessionEndTime.split(':').map(Number);
        const currentMinutes = hour1 * 60 + min1;
        const sessionEndMinutes = hour2 * 60 + min2;
        
        // Check if session ended more than 15 minutes ago
        const minutesAfterEnd = currentMinutes - sessionEndMinutes;
        const isEndedMoreThan15MinAgo = minutesAfterEnd > 15;
        
        const isActive = currentMinutes < sessionEndMinutes && !isEndedMoreThan15MinAgo;
        console.log(`Same date comparison: ${currentMinutes} < ${sessionEndMinutes} = ${isActive}, ended more than 15 min ago: ${isEndedMoreThan15MinAgo}`);
        return isActive;
      }
    });

    console.log('=== FILTERED SESSIONS (AFTER TIME CHECK) ===');
    console.log('Sessions after filtering past end times:', currentSessions.length);

    // Step 9: Sort sessions by date/time (most recent first)
    currentSessions.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB - dateA;
    });

    return res.json({
      success: true,
      sessions: currentSessions,
      totalSessions: currentSessions.length
    });
    
    console.log('=== RESPONSE SENT ===');

  } catch (err) {
    console.error('Student calendar error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
