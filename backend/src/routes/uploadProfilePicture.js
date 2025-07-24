const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary } = require('../utils/cloudinary');
const { supabase } = require('../supabaseClient');
const { verifySupabaseToken } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', verifySupabaseToken, upload.single('file'), async (req, res) => {
  const file = req.file;
  const userId = req.user.id;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    cloudinary.uploader.upload_stream({ 
      folder: 'avatars',
      public_id: `user_${userId}`,
    }, async (error, result) => {
      if (error) return res.status(500).json({ error: error.message });

      const imageUrl = result.secure_url;

      const { error: updateError } = await supabase
        .from('Users')
        .update({ profile_picture: imageUrl })
        .eq('id', userId);

      if (updateError) return res.status(500).json({ error: updateError.message });

      return res.json({ message: 'Profile picture updated!', url: imageUrl });
    }).end(file.buffer);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/', verifySupabaseToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete from Cloudinary if exists
    try {
      await cloudinary.uploader.destroy(`avatars/user_${userId}`);
    } catch (cloudinaryError) {
      console.log('Cloudinary deletion failed (image may not exist):', cloudinaryError.message);
    }

    // Update database to set profile_picture to null
    const { error: updateError } = await supabase
      .from('Users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({ message: 'Profile picture deleted successfully' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;