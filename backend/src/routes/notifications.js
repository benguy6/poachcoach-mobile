const express = require('express');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /notifications - Get all notifications for the authenticated user
router.get('/', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching notifications for user:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 notifications

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    console.log(`Found ${notifications.length} notifications for user ${userId}`);

    res.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Error in notifications route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notifications/unread-count - Get count of unread notifications
router.get('/unread-count', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching unread count for user:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ error: 'Failed to fetch unread count' });
    }

    const unreadCount = notifications ? notifications.length : 0;
    console.log(`User ${userId} has ${unreadCount} unread notifications`);

    res.json({
      success: true,
      unreadCount: unreadCount
    });

  } catch (error) {
    console.error('Error in unread-count route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId) // Ensure user can only update their own notifications
      .select();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`Notification ${notificationId} marked as read`);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error in mark-read route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /notifications/mark-all-read - Mark all notifications as read for the user
router.put('/mark-all-read', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Marking all notifications as read for user ${userId}`);

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }

    console.log(`All notifications marked as read for user ${userId}`);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error in mark-all-read route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
