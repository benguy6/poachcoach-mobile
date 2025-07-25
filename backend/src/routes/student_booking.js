const express = require('express');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Book a session (single sessions only for now)
router.post('/book-session', verifySupabaseToken, async (req, res) => {
  try {
    const { sessionId, sessionType, pricePerSession } = req.body;
    const studentId = req.user.id; // From auth middleware

    console.log('📅 Booking request:', {
      sessionId,
      sessionType,
      pricePerSession,
      studentId
    });

    // Validate input
    if (!sessionId || !sessionType || !pricePerSession) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, sessionType, and pricePerSession'
      });
    }

    // For now, only handle single sessions
    if (sessionType !== 'single') {
      return res.status(400).json({
        error: 'Only single sessions are supported at this time'
      });
    }

    // Start a transaction
    const { data: sessionData, error: sessionError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('unique_id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError);
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    console.log('📅 Found session:', sessionData);

    // Check if session is available for booking
    if (sessionData.session_status !== 'published' && sessionData.session_status !== 'pubcon') {
      return res.status(400).json({
        error: 'Session is not available for booking'
      });
    }

    // Check if student already booked this session
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('Student_sessions')
      .select('id')
      .eq('session_id', sessionData.session_id)
      .eq('student_id', studentId)
      .single();

    if (existingBooking) {
      return res.status(400).json({
        error: 'You have already booked this session'
      });
    }

    // Get student's wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError);
      return res.status(500).json({
        error: 'Failed to check wallet balance'
      });
    }

    console.log('💰 Wallet balance:', walletData.balance);

    // Convert SGD to PC (1 SGD = 5 PC)
    const exchangeRate = 5;
    const costInPC = Math.round(pricePerSession * exchangeRate);

    console.log('💰 Cost calculation:', {
      priceInSGD: pricePerSession,
      costInPC,
      currentBalance: walletData.balance
    });

    // Check if student has enough PC
    if (walletData.balance < costInPC) {
      return res.status(400).json({
        error: `Insufficient PC. You need ${costInPC} PC but only have ${walletData.balance}.`
      });
    }

    // Handle booking logic based on session type
    if (sessionData.class_type === 'single') {
      // For single sessions: simply update session status to 'confirmed'
      const { error: updateSessionError } = await supabase
        .from('Sessions')
        .update({ session_status: 'confirmed' })
        .eq('unique_id', sessionId);

      if (updateSessionError) {
        console.error('❌ Error updating session status:', updateSessionError);
        return res.status(500).json({
          error: 'Failed to update session status'
        });
      }

      console.log('✅ Updated single session status to confirmed');

    } else if (sessionData.class_type === 'group') {
      // For group sessions: increment students_attending, decrement available_slots
      const currentStudentsAttending = parseInt(sessionData.students_attending) || 0;
      const newStudentsAttending = currentStudentsAttending + 1;
      const newAvailableSlots = Math.max(0, (sessionData.available_slots || sessionData.max_students) - 1);
      
      console.log('📊 Group session update calculation:', {
        currentStudentsAttending: sessionData.students_attending,
        currentStudentsAttendingType: typeof sessionData.students_attending,
        parsedCurrentStudentsAttending: currentStudentsAttending,
        newStudentsAttending,
        maxStudents: sessionData.max_students
      });
      
      // Determine new session status
      const newSessionStatus = newStudentsAttending >= sessionData.max_students ? 'confirmed' : 'pubcon';

      const { error: updateGroupSessionError } = await supabase
        .from('Sessions')
        .update({
          students_attending: newStudentsAttending,
          available_slots: newAvailableSlots,
          session_status: newSessionStatus
        })
        .eq('unique_id', sessionId);

      if (updateGroupSessionError) {
        console.error('❌ Error updating group session:', updateGroupSessionError);
        return res.status(500).json({
          error: 'Failed to update group session'
        });
      }

      console.log('✅ Updated group session:', {
        newStudentsAttending,
        newAvailableSlots,
        newSessionStatus
      });
    }

    // Create Student_sessions record
    const { error: createStudentSessionError } = await supabase
      .from('Student_sessions')
      .insert({
        id: sessionData.unique_id, // Use unique_id from Sessions table
        student_id: studentId,
        session_id: sessionData.session_id, // Use session_id from Sessions table
        student_status: 'paid'
      });

    if (createStudentSessionError) {
      console.error('❌ Error creating student session:', createStudentSessionError);
      return res.status(500).json({
        error: 'Failed to create booking record'
      });
    }

    console.log('✅ Created student session record');

    // Deduct PC from wallet
    const newBalance = walletData.balance - costInPC;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', studentId);

    if (updateWalletError) {
      console.error('❌ Error updating wallet:', updateWalletError);
      return res.status(500).json({
        error: 'Failed to update wallet balance'
      });
    }

    console.log('✅ Updated wallet balance:', newBalance);

    // Log the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: studentId,
        wallet_id: walletData.id,
        type: 'withdrawal', // Use 'withdrawal' since money is going out for session booking
        amount: -costInPC, // Negative because it's a deduction
        status: 'completed', // Use 'status' column like in student_wallet.js
        description: `Booked session with coach for ${pricePerSession} SGD (${costInPC} PC)`,
      });    if (transactionError) {
      console.error('❌ Error logging transaction:', transactionError);
      // Don't fail the booking if transaction logging faisxls
    }

    console.log('✅ Logged transaction');

    // Return success response
    res.status(200).json({
      success: true,
      message: `Session booked successfully! ${costInPC} PC deducted from your wallet.`,
      booking: {
        sessionId: sessionData.unique_id,
        sessionType: sessionData.class_type,
        costInPC,
        newWalletBalance: newBalance
      }
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      error: 'Internal server error while processing booking'
    });
  }
});

// Book a monthly recurring session
router.post('/book-recurring-session', verifySupabaseToken, async (req, res) => {
  try {
    const { uniqueId, sessionId, sessionType } = req.body;
    const studentId = req.user.id; // From auth middleware

    console.log('📅 Monthly booking request:', {
      uniqueId,
      sessionId,
      sessionType,
      studentId
    });

    // Validate input
    if (!uniqueId || !sessionId || !sessionType) {
      return res.status(400).json({
        error: 'Missing required fields: uniqueId, sessionId, and sessionType'
      });
    }

    // Only handle monthly sessions
    if (sessionType !== 'monthly') {
      return res.status(400).json({
        error: 'Only monthly recurring sessions are supported'
      });
    }

    // Get recurring session metadata
    const { data: recurringSessionData, error: recurringSessionError } = await supabase
      .from('Recurring_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (recurringSessionError) {
      console.error('❌ Error fetching recurring session:', recurringSessionError);
      return res.status(404).json({
        error: 'Recurring session not found'
      });
    }

    console.log('📅 Found monthly recurring session:', recurringSessionData);

    // Verify the frequency is monthly
    if (recurringSessionData.frequency !== 'monthly') {
      return res.status(400).json({
        error: `Session frequency mismatch. Expected monthly, got ${recurringSessionData.frequency}`
      });
    }

    // Get all sessions in this recurring package
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: true });

    if (allSessionsError) {
      console.error('❌ Error fetching all sessions:', allSessionsError);
      return res.status(500).json({
        error: 'Failed to fetch session package'
      });
    }

    if (!allSessions || allSessions.length === 0) {
      return res.status(404).json({
        error: 'No sessions found in this package'
      });
    }

    console.log('📅 Found sessions in monthly package:', allSessions.length);

    // Check if any sessions are not available for booking
    const unavailableSessions = allSessions.filter(session => 
      session.session_status !== 'published' && session.session_status !== 'pubcon'
    );

    if (unavailableSessions.length > 0) {
      return res.status(400).json({
        error: 'Some sessions in this monthly package are not available for booking'
      });
    }

    // Check if student already booked any session in this monthly package
    const { data: existingBookings, error: existingBookingError } = await supabase
      .from('Student_sessions')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId);

    if (existingBookingError) {
      console.error('❌ Error checking existing bookings:', existingBookingError);
      return res.status(500).json({
        error: 'Failed to check existing bookings'
      });
    }

    if (existingBookings && existingBookings.length > 0) {
      return res.status(400).json({
        error: 'You have already booked sessions in this monthly package'
      });
    }

    // Get student's wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError);
      return res.status(500).json({
        error: 'Failed to check wallet balance'
      });
    }

    console.log('💰 Wallet balance:', walletData.balance);

    // Calculate total cost for the package (sum of all price_per_session)
    const totalCostInSGD = allSessions.reduce((sum, session) => {
      return sum + (parseFloat(session.price_per_session) || 0);
    }, 0);

    // Convert SGD to PC (1 SGD = 5 PC)
    const exchangeRate = 5;
    const totalCostInPC = Math.round(totalCostInSGD * exchangeRate);

    console.log('💰 Monthly package cost calculation:', {
      totalCostInSGD,
      totalCostInPC,
      numberOfSessions: allSessions.length,
      currentBalance: walletData.balance
    });

    // Check if student has enough PC
    if (walletData.balance < totalCostInPC) {
      return res.status(400).json({
        error: `Insufficient PC. You need ${totalCostInPC} PC for this monthly package but only have ${walletData.balance}.`
      });
    }

    // Update each session in the monthly package based on class type
    for (const session of allSessions) {
      if (session.class_type === 'single') {
        // For single sessions: simply update session status to 'confirmed'
        const { error: updateSessionError } = await supabase
          .from('Sessions')
          .update({ session_status: 'confirmed' })
          .eq('unique_id', session.unique_id);

        if (updateSessionError) {
          console.error('❌ Error updating single session status:', updateSessionError);
          return res.status(500).json({
            error: `Failed to update session ${session.unique_id} status`
          });
        }

        console.log(`✅ Updated single session ${session.unique_id} status to confirmed`);

      } else if (session.class_type === 'group') {
        // For group sessions: increment students_attending, decrement available_slots
        const currentStudentsAttending = parseInt(session.students_attending) || 0;
        const newStudentsAttending = currentStudentsAttending + 1;
        const newAvailableSlots = Math.max(0, (session.available_slots || session.max_students) - 1);
        
        console.log(`📊 Group session ${session.unique_id} update calculation:`, {
          currentStudentsAttending: session.students_attending,
          currentStudentsAttendingType: typeof session.students_attending,
          parsedCurrentStudentsAttending: currentStudentsAttending,
          newStudentsAttending,
          maxStudents: session.max_students
        });
        
        // Determine new session status
        const newSessionStatus = newStudentsAttending >= session.max_students ? 'confirmed' : 'pubcon';

        const { error: updateGroupSessionError } = await supabase
          .from('Sessions')
          .update({
            students_attending: newStudentsAttending,
            available_slots: newAvailableSlots,
            session_status: newSessionStatus
          })
          .eq('unique_id', session.unique_id);

        if (updateGroupSessionError) {
          console.error('❌ Error updating group session:', updateGroupSessionError);
          return res.status(500).json({
            error: `Failed to update group session ${session.unique_id}`
          });
        }

        console.log(`✅ Updated group session ${session.unique_id}:`, {
          newStudentsAttending,
          newAvailableSlots,
          newSessionStatus
        });
      }
    }

    // Create Student_sessions records for each session in the monthly package
    const studentSessionInserts = allSessions.map(session => ({
      id: session.unique_id, // Use unique_id from Sessions table
      student_id: studentId,
      session_id: session.session_id, // Use session_id from Sessions table
      student_status: 'paid'
    }));

    const { error: createStudentSessionError } = await supabase
      .from('Student_sessions')
      .insert(studentSessionInserts);

    if (createStudentSessionError) {
      console.error('❌ Error creating student session records:', createStudentSessionError);
      return res.status(500).json({
        error: 'Failed to create booking records'
      });
    }

    console.log(`✅ Created ${allSessions.length} student session records`);

    // Deduct PC from wallet
    const newBalance = walletData.balance - totalCostInPC;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', studentId);

    if (updateWalletError) {
      console.error('❌ Error updating wallet:', updateWalletError);
      return res.status(500).json({
        error: 'Failed to update wallet balance'
      });
    }

    console.log('✅ Updated wallet balance:', newBalance);

    // Log the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: studentId,
        wallet_id: walletData.id,
        type: 'withdrawal', // Use 'withdrawal' since money is going out for session booking
        amount: -totalCostInPC, // Negative because it's a deduction
        status: 'completed', // Use 'status' column like in student_wallet.js
        description: `Booked monthly recurring package (${allSessions.length} sessions) for ${totalCostInSGD} SGD (${totalCostInPC} PC)`,
      });

    if (transactionError) {
      console.error('❌ Error logging transaction:', transactionError);
      // Don't fail the booking if transaction logging fails
    }

    console.log('✅ Logged transaction');

    // Return success response
    res.status(200).json({
      success: true,
      message: `Monthly package booked successfully! ${totalCostInPC} PC deducted from your wallet.`,
      booking: {
        sessionId: sessionId,
        sessionType: 'monthly',
        numberOfSessions: allSessions.length,
        totalCostInPC,
        totalCostInSGD,
        newWalletBalance: newBalance,
        sessionsBooked: allSessions.map(session => ({
          uniqueId: session.unique_id,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          classType: session.class_type
        }))
      }
    });

  } catch (error) {
    console.error('❌ Monthly booking error:', error);
    res.status(500).json({
      error: 'Internal server error while processing monthly booking'
    });
  }
});

// Book a weekly recurring session
router.post('/book-weekly-session', verifySupabaseToken, async (req, res) => {
  try {
    const { uniqueId, sessionId, sessionType, paymentType } = req.body;
    const studentId = req.user.id; // From auth middleware

    console.log('📅 Weekly booking request:', {
      uniqueId,
      sessionId,
      sessionType,
      paymentType,
      studentId
    });

    // Validate input
    if (!uniqueId || !sessionId || !sessionType || !paymentType) {
      return res.status(400).json({
        error: 'Missing required fields: uniqueId, sessionId, sessionType, and paymentType'
      });
    }

    // Only handle weekly sessions
    if (sessionType !== 'weekly') {
      return res.status(400).json({
        error: 'Only weekly recurring sessions are supported'
      });
    }

    // Validate payment type
    if (paymentType !== 'full_package' && paymentType !== 'weekly') {
      return res.status(400).json({
        error: 'Payment type must be either "full_package" or "weekly"'
      });
    }

    // Get recurring session metadata
    const { data: recurringSessionData, error: recurringSessionError } = await supabase
      .from('Recurring_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (recurringSessionError) {
      console.error('❌ Error fetching recurring session:', recurringSessionError);
      return res.status(404).json({
        error: 'Recurring session not found'
      });
    }

    console.log('📅 Found weekly recurring session:', recurringSessionData);

    // Verify the frequency is weekly
    if (recurringSessionData.frequency !== 'weekly') {
      return res.status(400).json({
        error: `Session frequency mismatch. Expected weekly, got ${recurringSessionData.frequency}`
      });
    }

    // Get all sessions in this recurring package
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: true });

    if (allSessionsError) {
      console.error('❌ Error fetching all sessions:', allSessionsError);
      return res.status(500).json({
        error: 'Failed to fetch session package'
      });
    }

    if (!allSessions || allSessions.length === 0) {
      return res.status(404).json({
        error: 'No sessions found in this weekly package'
      });
    }

    console.log('📅 Found sessions in weekly package:', allSessions.length);

    // Check if any sessions are not available for booking
    const unavailableSessions = allSessions.filter(session => 
      session.session_status !== 'published' && session.session_status !== 'pubcon'
    );

    if (unavailableSessions.length > 0) {
      return res.status(400).json({
        error: 'Some sessions in this weekly package are not available for booking'
      });
    }

    // Check if student already booked any session in this weekly package
    const { data: existingBookings, error: existingBookingError } = await supabase
      .from('Student_sessions')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId);

    if (existingBookingError) {
      console.error('❌ Error checking existing bookings:', existingBookingError);
      return res.status(500).json({
        error: 'Failed to check existing bookings'
      });
    }

    if (existingBookings && existingBookings.length > 0) {
      return res.status(400).json({
        error: 'You have already booked sessions in this weekly package'
      });
    }

    // Get student's wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError);
      return res.status(500).json({
        error: 'Failed to check wallet balance'
      });
    }

    console.log('💰 Wallet balance:', walletData.balance);

    // Calculate cost based on payment type
    let sessionsToPayFor;
    let totalCostInSGD;
    let numberOfSessionsPaid;
    let paymentDescription;

    if (paymentType === 'full_package') {
      // Pay for all sessions in the package
      sessionsToPayFor = allSessions;
      totalCostInSGD = allSessions.reduce((sum, session) => {
        return sum + (parseFloat(session.price_per_session) || 0);
      }, 0);
      numberOfSessionsPaid = allSessions.length;
      paymentDescription = `weekly full package (${allSessions.length} sessions)`;
    } else {
      // Pay for first week only (7 days from start date)
      const startDate = new Date(recurringSessionData.start_date);
      const oneWeekLater = new Date(startDate);
      oneWeekLater.setDate(startDate.getDate() + 7);
      
      sessionsToPayFor = allSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && sessionDate < oneWeekLater;
      });
      
      totalCostInSGD = sessionsToPayFor.reduce((sum, session) => {
        return sum + (parseFloat(session.price_per_session) || 0);
      }, 0);
      numberOfSessionsPaid = sessionsToPayFor.length;
      paymentDescription = `weekly package first week (${sessionsToPayFor.length} sessions)`;
    }

    // Convert SGD to PC (1 SGD = 5 PC)
    const exchangeRate = 5;
    const totalCostInPC = Math.round(totalCostInSGD * exchangeRate);

    console.log('💰 Weekly package cost calculation:', {
      paymentType,
      totalCostInSGD,
      totalCostInPC,
      numberOfSessionsPaid,
      totalSessionsInPackage: allSessions.length,
      currentBalance: walletData.balance
    });

    // Check if student has enough PC
    if (walletData.balance < totalCostInPC) {
      return res.status(400).json({
        error: `Insufficient PC. You need ${totalCostInPC} PC for this ${paymentType === 'full_package' ? 'full package' : 'first week'} but only have ${walletData.balance}.`
      });
    }

    // Update each session in the weekly package based on class type (ALL sessions, regardless of payment type)
    for (const session of allSessions) {
      console.log(`🔄 Processing session ${session.unique_id} with class_type: ${session.class_type}, current status: ${session.session_status}`);
      
      if (session.class_type === 'single') {
        // For single sessions: simply update session status to 'confirmed'
        const { data: updateData, error: updateSessionError } = await supabase
          .from('Sessions')
          .update({ session_status: 'confirmed' })
          .eq('unique_id', session.unique_id)
          .select();

        if (updateSessionError) {
          console.error('❌ Error updating single session status:', updateSessionError);
          return res.status(500).json({
            error: `Failed to update session ${session.unique_id} status`
          });
        }

        console.log(`✅ Updated single session ${session.unique_id} status to confirmed:`, updateData);

      } else if (session.class_type === 'group') {
        // For group sessions: increment students_attending, decrement available_slots
        const currentStudentsAttending = parseInt(session.students_attending) || 0;
        const newStudentsAttending = currentStudentsAttending + 1;
        const newAvailableSlots = Math.max(0, (session.available_slots || session.max_students) - 1);
        
        console.log(`📊 Group session ${session.unique_id} update calculation:`, {
          currentStudentsAttending: session.students_attending,
          currentStudentsAttendingType: typeof session.students_attending,
          parsedCurrentStudentsAttending: currentStudentsAttending,
          newStudentsAttending,
          maxStudents: session.max_students
        });
        
        // Determine new session status based on whether session is full
        const newSessionStatus = newStudentsAttending >= session.max_students ? 'confirmed' : 'pubcon';
        
        console.log(`📊 Group session ${session.unique_id} will be updated to status: ${newSessionStatus}`);

        const { data: updateData, error: updateGroupSessionError } = await supabase
          .from('Sessions')
          .update({
            students_attending: newStudentsAttending,
            available_slots: newAvailableSlots,
            session_status: newSessionStatus
          })
          .eq('unique_id', session.unique_id)
          .select();

        if (updateGroupSessionError) {
          console.error('❌ Error updating group session:', updateGroupSessionError);
          return res.status(500).json({
            error: `Failed to update group session ${session.unique_id}`
          });
        }

        console.log(`✅ Updated group session ${session.unique_id}:`, {
          newStudentsAttending,
          newAvailableSlots,
          newSessionStatus,
          updateData
        });
      }
    }

    // Create Student_sessions records with different payment status based on payment type
    const studentSessionInserts = allSessions.map(session => {
      const isPaidSession = paymentType === 'full_package' || 
                           sessionsToPayFor.some(paidSession => paidSession.unique_id === session.unique_id);
      
      return {
        id: session.unique_id, // Use unique_id from Sessions table
        student_id: studentId,
        session_id: session.session_id, // Use session_id from Sessions table
        student_status: isPaidSession ? 'paid' : 'unpaid'
      };
    });

    const { error: createStudentSessionError } = await supabase
      .from('Student_sessions')
      .insert(studentSessionInserts);

    if (createStudentSessionError) {
      console.error('❌ Error creating student session records:', createStudentSessionError);
      return res.status(500).json({
        error: 'Failed to create booking records'
      });
    }

    console.log(`✅ Created ${allSessions.length} student session records (${numberOfSessionsPaid} paid, ${allSessions.length - numberOfSessionsPaid} unpaid)`);

    // Deduct PC from wallet
    const newBalance = walletData.balance - totalCostInPC;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', studentId);

    if (updateWalletError) {
      console.error('❌ Error updating wallet:', updateWalletError);
      return res.status(500).json({
        error: 'Failed to update wallet balance'
      });
    }

    console.log('✅ Updated wallet balance:', newBalance);

    // Log the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: studentId,
        wallet_id: walletData.id,
        type: 'withdrawal', // Use 'withdrawal' since money is going out for session booking
        amount: -totalCostInPC, // Negative because it's a deduction
        status: 'completed', // Use 'status' column like in student_wallet.js
        description: `Booked ${paymentDescription} for ${totalCostInSGD} SGD (${totalCostInPC} PC)`,
      });

    if (transactionError) {
      console.error('❌ Error logging transaction:', transactionError);
      // Don't fail the booking if transaction logging fails
    }

    console.log('✅ Logged transaction');

    // Return success response
    res.status(200).json({
      success: true,
      message: `Weekly package ${paymentType === 'full_package' ? 'fully' : 'partially'} booked successfully! ${totalCostInPC} PC deducted from your wallet.`,
      booking: {
        sessionId: sessionId,
        sessionType: 'weekly',
        paymentType: paymentType,
        numberOfSessions: allSessions.length,
        numberOfSessionsPaid: numberOfSessionsPaid,
        totalCostInPC,
        totalCostInSGD,
        newWalletBalance: newBalance,
        sessionsBooked: allSessions.map(session => ({
          uniqueId: session.unique_id,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          classType: session.class_type,
          paymentStatus: paymentType === 'full_package' || 
                        sessionsToPayFor.some(paidSession => paidSession.unique_id === session.unique_id) ? 'paid' : 'unpaid'
        }))
      }
    });

  } catch (error) {
    console.error('❌ Weekly booking error:', error);
    res.status(500).json({
      error: 'Internal server error while processing weekly booking'
    });
  }
});

module.exports = router;
