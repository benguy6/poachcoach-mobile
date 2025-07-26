const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; 
// Function to perform geocoding
const getGeoFromPostalCode = async (postalCode) => {
  try {
    // Step 1: Reverse geocode to get latitude and longitude
    const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=${GOOGLE_MAPS_API_KEY}`;
    const reverseResponse = await axios.get(reverseGeocodeUrl);
    const reverseData = reverseResponse.data;

    if (reverseData.status !== 'OK' || reverseData.results.length === 0) {
      console.warn(`Postal code ${postalCode} not found.`);
      return { address: 'Address not found', latitude: null, longitude: null };
    }

    const location = reverseData.results[0].geometry.location;
    const lat = location.lat;
    const lng = location.lng;

    // Step 2: Geocode latitude and longitude to get a human-readable address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await axios.get(geocodeUrl);
    const geocodeData = geocodeResponse.data;

    if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
      const address = geocodeData.results[0].formatted_address;
      return { address, latitude: lat, longitude: lng };
    } else {
      console.warn(`No address found for location (${lat}, ${lng}).`);
      return { address: 'Address not found', latitude: lat, longitude: lng };
    }
  } catch (error) {
    console.error('Error during geocoding:', error.message);
    return { address: 'Address not found', latitude: null, longitude: null };
  }
};

// Route to create a new session
router.post('/single-session', verifySupabaseToken, async (req, res) => {
  const coach_id = req.user.id;

  try {
    console.log('Incoming request body:', req.body);

    const {
      start_time,
      end_time,
      duration,
      address,
      date,
      day_of_week,
      postal_code,
      session_type,
      class_type,
      max_students,
      available_slots,
      age_range,
      sport,
      description,
      price_per_session,
      price_per_hour,
    } = req.body;

    if (
      !start_time ||
      !end_time ||
      !duration ||
      !date ||
      !day_of_week ||
      !address ||
      !postal_code ||
      !session_type ||
      !class_type ||
      !age_range ||
      !sport ||
      !description ||
      !price_per_session ||
      !price_per_hour
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Perform geocoding to get address, latitude, and longitude
    const { addresss, latitude, longitude } = await getGeoFromPostalCode(postal_code);

    // Insert session data into the database
    const { data, error } = await supabase
      .from('Sessions')
      .insert([
        {
          coach_id,
          start_time,
          end_time,
          duration,
          date,
          day: day_of_week,
          postal_code,
          address,
          latitude,
          longitude,
          session_type,
          class_type,
          max_students,
          available_slots: class_type === 'group' ? available_slots : null,
          age_range,
          sport,
          description,
          price_per_session,
          price_per_hour,
          session_status: 'published', // Set default session status
        },
      ]);

    if (error) {
      console.error('Error inserting session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    return res.status(201).json({ message: 'Session created successfully', data });
  } catch (err) {
    console.error('Error handling request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to create monthly recurring sessions
router.post('/recurring-monthly', verifySupabaseToken, async (req, res) => {
  const coach_id = req.user.id;

  try {
    console.log('Incoming monthly recurring session request body:', req.body);

    const { sessionMetadata, location, classConfiguration, individualSessions } = req.body;

    // Validate required fields
    if (!sessionMetadata || !location || !classConfiguration || !individualSessions) {
      return res.status(400).json({ error: 'Missing required fields: sessionMetadata, location, classConfiguration, or individualSessions' });
    }

    if (!Array.isArray(individualSessions) || individualSessions.length === 0) {
      return res.status(400).json({ error: 'individualSessions must be a non-empty array' });
    }

    // Generate a unique recurring session ID
    const session_id = uuidv4();

    // Insert into Recurring_sessions table
    const { data: recurringSessionData, error: recurringError } = await supabase
      .from('Recurring_sessions')
      .insert([
        {
          session_id,
          frequency: sessionMetadata.frequency, // 'monthly'
        },
      ]);

    if (recurringError) {
      console.error('Error inserting recurring session:', recurringError);
      return res.status(500).json({ error: 'Failed to create recurring session' });
    }

    // Perform geocoding to get coordinates from postal code
    const { address: geocodedAddress, latitude, longitude } = await getGeoFromPostalCode(location.postalCode);

    // Prepare individual sessions data for batch insert
    const sessionsToInsert = individualSessions.map((session) => ({
      coach_id,
      session_id: session_id,
      start_time: session.startTime,
      end_time: session.endTime,
      duration: session.duration,
      date: session.date,
      day: session.dayOfWeek,
      postal_code: location.postalCode,
      address: location.address || geocodedAddress,
      latitude,
      longitude,
      session_type: sessionMetadata.sessionType, // 'recurring'
      class_type: session.classType,
      max_students: session.maxStudents,
      available_slots: session.classType === 'group' ? session.availableSlots : null,
      age_range: session.ageRange,
      sport: session.sport,
      description: session.description,
      price_per_session: session.pricePerSession,
      price_per_hour: session.pricePerHour,
      session_status: 'published', // Set default session status
    }));

    // Insert all individual sessions into Sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('Sessions')
      .insert(sessionsToInsert);

    if (sessionsError) {
      console.error('Error inserting individual sessions:', sessionsError);
      // If sessions failed to insert, we should clean up the recurring session
      await supabase
        .from('Recurring_sessions')
        .delete()
        .eq('session_id', session_id);
      
      return res.status(500).json({ error: 'Failed to create individual sessions' });
    }

    return res.status(201).json({ 
      message: 'Monthly recurring sessions created successfully', 
      session_id,
      sessions_created: sessionsToInsert.length,
      data: {
        recurring_session: recurringSessionData,
        sessions: sessionsData
      }
    });

  } catch (err) {
    console.error('Error handling monthly recurring session request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to create recurring weekly sessions
router.post('/recurring-weekly', verifySupabaseToken, async (req, res) => {
  const coach_id = req.user.id;

  try {
    console.log('Incoming recurring session request body:', req.body);

    const {
      sessionMetadata,
      location,
      classConfiguration,
      scheduleConfiguration,
      pricing,
      individualSessions
    } = req.body;

    // Validate required fields
    if (!sessionMetadata || !location || !classConfiguration || !scheduleConfiguration || !individualSessions || !Array.isArray(individualSessions)) {
      return res.status(400).json({ error: 'Missing required fields for recurring session' });
    }

    // Generate a unique session_id for this recurring session
    const session_id = uuidv4();

    // Perform geocoding to get address, latitude, and longitude
    const { address: geocodedAddress, latitude, longitude } = await getGeoFromPostalCode(location.postalCode);

    // Prepare individual sessions for batch insert
    const sessionsToInsert = [];
    
    for (const session of individualSessions) {
      // Validate each individual session has required fields
      if (!session.date || !session.startTime || !session.endTime || !session.duration || !session.pricePerSession) {
        return res.status(400).json({ error: 'Missing required fields in individual session data' });
      }

      sessionsToInsert.push({
        session_id: session_id, // All sessions share the same recurring session ID
        coach_id,
        start_time: session.startTime,
        end_time: session.endTime,
        duration: session.duration,
        date: session.date,
        day: session.dayOfWeek,
        postal_code: location.postalCode,
        address: session.address || location.address,
        latitude,
        longitude,
        session_type: 'recurring',
        class_type: session.classType,
        max_students: session.maxStudents,
        available_slots: session.classType === 'group' ? session.availableSlots : null,
        age_range: session.ageRange,
        sport: session.sport,
        description: session.description,
        price_per_session: session.pricePerSession,
        price_per_hour: session.pricePerHour,
        session_status: 'published', // Set default session status
      });
    }

    // Insert all individual sessions into Sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('Sessions')
      .insert(sessionsToInsert);

    if (sessionsError) {
      console.error('Error inserting individual sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to create individual sessions' });
    }

    // Insert recurring session metadata into Recurring_sessions table
    const { data: recurringData, error: recurringError } = await supabase
      .from('Recurring_sessions')
      .insert([
        {
          session_id: session_id,
          frequency: sessionMetadata.frequency, // 'weekly'
          start_date: scheduleConfiguration.startDate,
          number_of_weeks: scheduleConfiguration.numberOfWeeks.toString(),
        },
      ]);

    if (recurringError) {
      console.error('Error inserting recurring session metadata:', recurringError);
      return res.status(500).json({ error: 'Failed to create recurring session metadata' });
    }

    return res.status(201).json({ 
      message: 'Recurring session created successfully', 
      session_id: session_id,
      individual_sessions_count: individualSessions.length,
      sessionsData,
      recurringData
    });

  } catch (err) {
    console.error('Error handling recurring session request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
