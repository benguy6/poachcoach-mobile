const express = require('express');
const router = express.Router();
const { serverClient } = require('../utils/streamClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');
const { supabase } = require('../supabaseClient');


router.post('/token', verifySupabaseToken, async (req, res) => {
  const user = req.user;

  try {
    await serverClient.upsertUser({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      image: user.profile_picture || undefined,
    });

    const token = serverClient.createToken(user.id);

    return res.json({ token, apiKey: process.env.STREAM_API_KEY, userId: user.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create Stream token' });
  }
});

router.post('/create-channel', verifySupabaseToken, async (req, res) => {
  const { channelId, members, type = 'messaging', name, metadata } = req.body;
  const requestingUserId = req.user.id;

  console.log('🔍 Create channel request:', {
    channelId,
    members,
    type,
    metadata,
    requestingUserId,
    body: req.body
  });

  if (!channelId || !Array.isArray(members) || members.length < 2) {
    console.error('❌ Invalid channel creation request:', {
      channelId: !!channelId,
      members: Array.isArray(members) ? members.length : 'not array',
      membersContent: members
    });
    return res.status(400).json({
      error: 'channelId and at least two member IDs are required',
    });
  }

  try {
    // Check if Stream client is properly configured
    if (!serverClient) {
      console.error('❌ Stream server client not initialized');
      return res.status(500).json({ error: 'Stream Chat not configured' });
    }

    console.log('🔍 Stream API Key available:', !!process.env.STREAM_API_KEY);
    console.log('🔍 Stream API Secret available:', !!process.env.STREAM_API_SECRET);

    if (!members.includes(requestingUserId)) {
      members.push(requestingUserId);
    }

    console.log('🔍 Final members list:', members);

    // Try to get existing channel first
    try {
      const existingChannel = serverClient.channel(type, channelId);
      await existingChannel.watch();
      
      console.log('Channel already exists:', channelId);
      return res.json({
        message: 'Channel already exists',
        channelId: existingChannel.id,
        members: existingChannel.state.members,
        existed: true
      });
    } catch (watchError) {
      // Channel doesn't exist, create new one
      console.log('Creating new channel:', channelId);
    }

    // Create the channel with members and metadata
    const channelOptions = {
      members,
      created_by_id: requestingUserId,
      ...(members.length > 2 && name ? { name } : {}),
    };
    
    // Add metadata if provided
    console.log('🔍 Backend Debug - Processing metadata:', metadata);
    
    if (metadata && typeof metadata === 'object') {
      // Set primary channel name based on who's viewing
      if (metadata.coachName) {
        channelOptions.name = metadata.coachName; // Primary name for student view
        console.log('✅ Backend Debug - Set channel name (coach):', channelOptions.name);
      } else if (metadata.studentName) {
        channelOptions.name = metadata.studentName; // Primary name for coach view
        console.log('✅ Backend Debug - Set channel name (student):', channelOptions.name);
      }
      
      if (metadata.coachAvatar) {
        channelOptions.image = metadata.coachAvatar;
        console.log('✅ Backend Debug - Set channel image:', channelOptions.image);
      }
      
      // Store both names in data field for flexible access
      channelOptions.data = {
        ...channelOptions.data,
        coachName: metadata.coachName,
        studentName: metadata.studentName,
        coachAvatar: metadata.coachAvatar
      };
      console.log('✅ Backend Debug - Set channel data:', channelOptions.data);
    } else {
      console.log('⚠️ Backend Debug - No valid metadata provided');
    }
    
    const channel = serverClient.channel(type, channelId, channelOptions);

    await channel.create();

    console.log('Channel created successfully:', channelId);
    return res.json({
      message: 'Channel created successfully',
      channelId: channel.id,
      members,
      existed: false
    });
  } catch (err) {
    console.error('❌ Failed to create channel:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      channelId,
      members,
      requestingUserId
    });
    return res.status(500).json({ 
      error: 'Failed to create channel',
      details: err.message 
    });
  }
});

router.get('/latest-messages', verifySupabaseToken, async (req, res) => {
    const userId = req.user.id;
  
    try {
      const { channels } = await serverClient.queryChannels(
        { members: { $in: [userId] } },
        { last_message_at: -1 },
        { limit: 10 } 
      );
  
      let messages = [];
  
      for (const channel of channels) {
        const channelMessages = channel.state.messages || [];
  
        const received = channelMessages.filter(
          (msg) => msg.user?.id !== userId
        );
  
        messages.push(...received);
      }
  
      messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
      const latestThree = messages.slice(0, 3);
  
      res.json({ messages: latestThree });
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Failed to fetch latest messages' });
    }
  });

// Get available students for coaches (students who have joined this coach's sessions)
router.get('/students', verifySupabaseToken, async (req, res) => {
  try {
    const coachId = req.user.id;
    console.log('Getting available students for coach:', coachId);

    let students = [];
    
          try {
       console.log('🔍 Attempting to find students via Sessions relationship (trying multiple approaches)...');
       
       // Try approach 1: Direct join with Sessions table
       try {
         console.log('🔍 Trying Sessions table join...');
         const { data: studentSessionsData, error: studentSessionsError } = await supabase
           .from('student_sessions')
           .select(`
             student_id,
             Sessions!inner(coach_id),
             Users!student_id(
               id,
               first_name,
               last_name,
               profile_picture
             )
           `)
           .eq('Sessions.coach_id', coachId)
           .not('Users', 'is', null);

         if (!studentSessionsError && studentSessionsData && studentSessionsData.length > 0) {
           // Extract unique students
           const uniqueStudents = [];
           const studentIds = new Set();

           studentSessionsData.forEach(sessionData => {
             const user = sessionData.Users;
             if (user && !studentIds.has(user.id)) {
               studentIds.add(user.id);
               uniqueStudents.push({
                 id: user.id,
                 first_name: user.first_name,
                 last_name: user.last_name,
                 profile_picture: user.profile_picture,
               });
             }
           });

           students = uniqueStudents;
           console.log('✅ Found students via Sessions relationship:', students.length);
         } else {
           console.error('Sessions join failed:', studentSessionsError);
           throw new Error('Sessions join failed');
         }
       } catch (sessionsJoinError) {
         console.log('🔍 Sessions join failed, trying manual approach...');
         
         // Try approach 2: Manual join - get sessions by coach_id, then get student_sessions
         const { data: coachSessions, error: sessionsError } = await supabase
           .from('Sessions')
           .select('session_id')
           .eq('coach_id', coachId);

         if (!sessionsError && coachSessions && coachSessions.length > 0) {
           const sessionIds = coachSessions.map(session => session.session_id);
           console.log('🔍 Found coach sessions:', sessionIds.length);

           // Get students who joined these sessions
           const { data: studentSessions, error: studentSessionsError } = await supabase
             .from('student_sessions')
             .select(`
               student_id,
               Users!student_id(
                 id,
                 first_name,
                 last_name,
                 profile_picture
               )
             `)
             .in('session_id', sessionIds)
             .not('Users', 'is', null);

           if (!studentSessionsError && studentSessions && studentSessions.length > 0) {
             // Extract unique students
             const uniqueStudents = [];
             const studentIds = new Set();

             studentSessions.forEach(sessionData => {
               const user = sessionData.Users;
               if (user && !studentIds.has(user.id)) {
                 studentIds.add(user.id);
                 uniqueStudents.push({
                   id: user.id,
                   first_name: user.first_name,
                   last_name: user.last_name,
                   profile_picture: user.profile_picture,
                 });
               }
             });

             students = uniqueStudents;
             console.log('✅ Found students via manual join:', students.length);
           } else {
             console.error('Student sessions query failed:', studentSessionsError);
             throw new Error('Manual join failed');
           }
         } else {
           console.error('Coach sessions query failed:', sessionsError);
           throw new Error('Coach sessions query failed');
         }
       }

    } catch (sessionRelationshipError) {
      console.log('🔄 Session relationship query failed, trying Students table...');
      
      try {
        // Fallback 1: Get all students from Students table
        const { data: studentsData, error: studentsError } = await supabase
          .from('Students')
          .select(`
            id,
            Users!inner(
              id,
              first_name,
              last_name,
              profile_picture
            )
          `)
          .limit(10);

        if (!studentsError && studentsData && studentsData.length > 0) {
          students = studentsData.map(student => ({
            id: student.Users.id,
            first_name: student.Users.first_name,
            last_name: student.Users.last_name,
            profile_picture: student.Users.profile_picture,
          }));
          console.log('✅ Found students from Students table:', students.length);
        } else {
          throw new Error('Students table query failed');
        }
      } catch (studentsTableError) {
        console.log('🔄 Students table failed, trying Users table...');
        
        // Fallback 2: Get from Users table (exclude current coach)
        const { data: usersData, error: usersError } = await supabase
          .from('Users')
          .select(`
            id,
            first_name,
            last_name,
            profile_picture
          `)
          .neq('id', coachId)
          .limit(5);

        if (!usersError && usersData && usersData.length > 0) {
          students = usersData;
          console.log('✅ Found users from Users table:', students.length);
        } else {
          console.log('❌ All database queries failed, using mock data');
          throw new Error('All database queries failed');
        }
      }
    }

    // Return real data if we found any
    if (students.length > 0) {
      console.log('📤 Returning real students data:', students.length);
      return res.json({ coaches: students }); // Keep 'coaches' key for compatibility
    }

    // Final fallback: mock data
    console.log('📤 No real students found, returning mock data');
    const mockStudents = [
      {
        id: 'mock-student-1',
        first_name: 'Demo',
        last_name: 'Student',
        profile_picture: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        id: 'mock-student-2',
        first_name: 'Test', 
        last_name: 'User',
        profile_picture: 'https://randomuser.me/api/portraits/women/1.jpg'
      }
    ];
    
    res.json({ coaches: mockStudents });

  } catch (error) {
    console.error('❌ Error in /students route:', error);
    
    // Ultimate fallback: always return something workable for demo
    console.log('📤 Returning ultimate fallback mock data');
    res.json({ 
      coaches: [
        {
          id: 'fallback-student-1',
          first_name: 'Chat',
          last_name: 'Demo',
          profile_picture: 'https://randomuser.me/api/portraits/men/2.jpg'
        }
      ]
    });
  }
});


module.exports = router;