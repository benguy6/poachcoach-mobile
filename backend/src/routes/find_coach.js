const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

router.get('/published', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id; 

  try {
    const { data: sessions, error: sessionError } = await supabase
      .from('Sessions')
      .select(`
        *,
        Users: coach_id (
          *
        )
      `)
      .eq('session_status', 'published');

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, first_name, last_name, email, profile_picture, age, gender, postal_code')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      sessions,
      user,
    });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;