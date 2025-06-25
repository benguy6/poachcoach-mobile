const express = require('express');
const router = express.Router();
const { serverClient } = require('../utils/streamClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');


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
  const { channelId, members, type = 'messaging', name } = req.body;
  const requestingUserId = req.user.id;

  if (!channelId || !Array.isArray(members) || members.length < 2) {
    return res.status(400).json({
      error: 'channelId and at least two member IDs are required',
    });
  }

  try {
    if (!members.includes(requestingUserId)) {
      members.push(requestingUserId);
    }

    const channel = serverClient.channel(type, channelId, {
      members,
      created_by_id: requestingUserId,
      ...(members.length > 2 && name ? { name } : {}),
    });

    await channel.create();

    return res.json({
      message: 'Channel created successfully',
      channelId: channel.id,
      members,
    });
  } catch (err) {
    console.error('Failed to create channel:', err);
    return res.status(500).json({ error: 'Failed to create channel' });
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




module.exports = router;
