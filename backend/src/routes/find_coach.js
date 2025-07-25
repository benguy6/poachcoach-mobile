const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');


router.get('/published', verifySupabaseToken, async (req, res) => {
  try {
    console.log('Finding coaches with single, weekly recurring, and monthly recurring sessions (published and pubcon status)...');

    // Get current user's location data
    const currentUserId = req.user.id;
    const { data: currentUser, error: currentUserError } = await supabase
      .from('Users')
      .select('first_name, last_name, latitude, longitude')
      .eq('id', currentUserId)
      .single();

    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError);
      return res.status(500).json({ error: 'Failed to fetch current user data' });
    }

    // Step 1: Get all published and pubcon single sessions
    const { data: singleSessions, error: singleSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .in('session_status', ['published', 'pubcon'])
      .eq('session_type', 'single');

    if (singleSessionsError) {
      console.error('Error fetching single sessions:', singleSessionsError);
      return res.status(500).json({ error: 'Failed to fetch single sessions' });
    }

    // Step 2: Get ALL recurring sessions first (to check entire packages)
    const { data: allRecurringSessions, error: recurringSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('session_type', 'recurring');

    if (recurringSessionsError) {
      console.error('Error fetching recurring sessions:', recurringSessionsError);
      return res.status(500).json({ error: 'Failed to fetch recurring sessions' });
    }

    // Step 3: Get recurring session metadata for all recurring sessions
    let recurringSessionsData = [];
    if (allRecurringSessions && allRecurringSessions.length > 0) {
      const uniqueSessionIds = [...new Set(allRecurringSessions.map(session => session.session_id))];
      
      const { data: recurringData, error: recurringError } = await supabase
        .from('Recurring_sessions')
        .select('*')
        .in('session_id', uniqueSessionIds);

      if (recurringError) {
        console.error('Error fetching recurring sessions data:', recurringError);
        return res.status(500).json({ error: 'Failed to fetch recurring sessions data' });
      }
      
      recurringSessionsData = recurringData || [];
    }

    // Step 4: Filter out entire packages where ANY session doesn't have 'published' or 'pubcon' status
    const validRecurringPackages = {};
    if (allRecurringSessions && allRecurringSessions.length > 0) {
      // Group by session_id first
      const sessionPackages = {};
      allRecurringSessions.forEach(session => {
        if (!sessionPackages[session.session_id]) {
          sessionPackages[session.session_id] = [];
        }
        sessionPackages[session.session_id].push(session);
      });

      // Only keep packages where ALL sessions have valid status
      Object.keys(sessionPackages).forEach(sessionId => {
        const allSessionsInPackage = sessionPackages[sessionId];
        const allSessionsValid = allSessionsInPackage.every(session => 
          session.session_status === 'published' || session.session_status === 'pubcon'
        );
        
        if (allSessionsValid) {
          validRecurringPackages[sessionId] = allSessionsInPackage;
        }
      });
    }

    // Step 5: Separate weekly and monthly sessions from valid packages only
    const weeklyRecurringSessions = [];
    const monthlyRecurringSessions = [];
    
    if (Object.keys(validRecurringPackages).length > 0 && recurringSessionsData) {
      Object.values(validRecurringPackages).forEach(sessionPackage => {
        sessionPackage.forEach(session => {
          const metadata = recurringSessionsData.find(rd => rd.session_id === session.session_id);
          if (metadata) {
            if (metadata.frequency === 'weekly') {
              weeklyRecurringSessions.push(session);
            } else if (metadata.frequency === 'monthly') {
              monthlyRecurringSessions.push(session);
            }
          }
        });
      });
    }

    // Combine all sessions
    const allSessions = [...(singleSessions || []), ...(weeklyRecurringSessions || []), ...(monthlyRecurringSessions || [])];

    if (allSessions.length === 0) {
      return res.status(200).json({ coaches: [] });
    }

    // Step 6: Get unique coach IDs
    const coachIds = [...new Set(allSessions.map(session => session.coach_id))];

    // Step 7: Get coach data from Users table
    const { data: coaches, error: coachesError } = await supabase
      .from('Users')
      .select('*')
      .in('id', coachIds);

    if (coachesError) {
      console.error('Error fetching coaches:', coachesError);
      return res.status(500).json({ error: 'Failed to fetch coach data' });
    }

    // Step 8: Get ratings for all coaches
    const { data: ratings, error: ratingsError } = await supabase
      .from('Rating')
      .select('*')
      .in('coach_id', coachIds);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }

    // Step 9: Get qualifications for all coaches
    const { data: qualifications, error: qualificationsError } = await supabase
      .from('Qualifications')
      .select('*')
      .in('coach_id', coachIds);

    if (qualificationsError) {
      console.error('Error fetching qualifications:', qualificationsError);
      return res.status(500).json({ error: 'Failed to fetch qualifications' });
    }

    // Step 10: Process and combine all data
    const coachesWithData = coaches.map(coach => {
      // Get single sessions for this coach - already filtered by session_status in Step 1
      const coachSingleSessions = singleSessions ? singleSessions.filter(session => session.coach_id === coach.id) : [];
      
      // Get weekly recurring sessions for this coach - already filtered to only valid packages
      const coachWeeklySessions = weeklyRecurringSessions ? weeklyRecurringSessions.filter(session => session.coach_id === coach.id) : [];
      
      // Get monthly recurring sessions for this coach - already filtered to only valid packages
      const coachMonthlySessions = monthlyRecurringSessions ? monthlyRecurringSessions.filter(session => session.coach_id === coach.id) : [];
      
      // Group weekly sessions by session_id and get their recurring metadata
      const weeklySessionGroups = {};
      coachWeeklySessions.forEach(session => {
        if (!weeklySessionGroups[session.session_id]) {
          weeklySessionGroups[session.session_id] = {
            sessions: [],
            recurringData: recurringSessionsData.find(rd => rd.session_id === session.session_id)
          };
        }
        weeklySessionGroups[session.session_id].sessions.push(session);
      });

      // Group monthly sessions by session_id and get their recurring metadata
      const monthlySessionGroups = {};
      coachMonthlySessions.forEach(session => {
        if (!monthlySessionGroups[session.session_id]) {
          monthlySessionGroups[session.session_id] = {
            sessions: [],
            recurringData: recurringSessionsData.find(rd => rd.session_id === session.session_id)
          };
        }
        monthlySessionGroups[session.session_id].sessions.push(session);
      });

      // Calculate ratings
      const coachRatings = ratings.filter(rating => rating.coach_id === coach.id);
      let averageRating = 5.0;
      let reviewCount = 1;

      if (coachRatings && coachRatings.length > 0) {
        const totalRating = coachRatings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = totalRating / coachRatings.length;
        reviewCount = coachRatings.length;
      }

      // Get qualifications for this coach
      const coachQualifications = qualifications.filter(qual => qual.coach_id === coach.id);

      return {
        // Coach basic info
        id: coach.id,
        name: `${coach.first_name} ${coach.last_name}`.trim(),
        email: coach.email,
        avatar: coach.profile_picture,
        gender: coach.gender, // Add gender field

        // Rating info
        rating: Number(averageRating.toFixed(1)),
        reviewCount: reviewCount,
        
        // Single Sessions info
        singleSessions: coachSingleSessions.map(session => ({
          id: session.id,
          unique_id: session.unique_id,
          sessionType: session.session_type,
          start_time: session.start_time,
          end_time: session.end_time,
          duration: session.duration,
          date: session.date,
          day: session.day,
          postal_code: session.postal_code,
          address: session.address,
          latitude: session.latitude,
          longitude: session.longitude,
          class_type: session.class_type,
          max_students: session.max_students,
          available_slots: session.available_slots,
          age_range: session.age_range,
          sport: session.sport,
          description: session.description,
          price_per_session: session.price_per_session,
          price_per_hour: session.price_per_hour,
        })),

        // Weekly Recurring Sessions info
        weeklyRecurringSessions: Object.values(weeklySessionGroups).map(group => ({
          sessionId: group.sessions[0].session_id,
          sessionType: 'recurring',
          frequency: 'weekly',
          recurringMetadata: group.recurringData ? {
            start_date: group.recurringData.start_date,
            number_of_weeks: group.recurringData.number_of_weeks,
          } : null,
          individualSessions: group.sessions.map(session => ({
            id: session.id,
            unique_id: session.unique_id,
            start_time: session.start_time,
            end_time: session.end_time,
            duration: session.duration,
            date: session.date,
            day: session.day,
            postal_code: session.postal_code,
            address: session.address,
            latitude: session.latitude,
            longitude: session.longitude,
            class_type: session.class_type,
            max_students: session.max_students,
            available_slots: session.available_slots,
            age_range: session.age_range,
            sport: session.sport,
            description: session.description,
            price_per_session: session.price_per_session,
            price_per_hour: session.price_per_hour,
          }))
        })),

        // Monthly Recurring Sessions info
        monthlyRecurringSessions: Object.values(monthlySessionGroups).map(group => ({
          sessionId: group.sessions[0].session_id,
          sessionType: 'recurring',
          frequency: 'monthly',
          recurringMetadata: group.recurringData ? {
            frequency: group.recurringData.frequency,
          } : null,
          individualSessions: group.sessions.map(session => ({
            id: session.id,
            unique_id: session.unique_id,
            start_time: session.start_time,
            end_time: session.end_time,
            duration: session.duration,
            date: session.date,
            day: session.day,
            postal_code: session.postal_code,
            address: session.address,
            latitude: session.latitude,
            longitude: session.longitude,
            class_type: session.class_type,
            max_students: session.max_students,
            available_slots: session.available_slots,
            age_range: session.age_range,
            sport: session.sport,
            description: session.description,
            price_per_session: session.price_per_session,
            price_per_hour: session.price_per_hour,
          }))
        })),
        
        // Qualifications
        qualifications: coachQualifications.map(qual => ({
          id: qual.id,
          name: qual.qualification_name,
          url: qual.qualification_url,
          uploaded_at: qual.uploaded_at
        }))
      };
    });

    console.log(`Found ${coachesWithData.length} coaches with single, weekly recurring, and monthly recurring sessions`);

    return res.status(200).json({
      coaches: coachesWithData,
      total: coachesWithData.length,
      currentUser: {
        id: currentUserId,
        name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
        location: {
          latitude: currentUser.latitude,
          longitude: currentUser.longitude
        }
      }
    });

  } catch (err) {
    console.error('Error in find coaches endpoint:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;