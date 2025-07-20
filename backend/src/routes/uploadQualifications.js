const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary } = require('../utils/cloudinary');
const { supabase } = require('../supabaseClient');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Public route for uploading qualifications during signup (no auth required)
router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Generate a unique filename for the qualification
    const timestamp = Date.now();
    const uniqueFilename = `qualification_temp_${timestamp}_${file.originalname}`;

    cloudinary.uploader.upload_stream({ 
      folder: 'qualifications', // Store in separate folder from profile pictures
      public_id: uniqueFilename,
      resource_type: 'raw', 
    }, async (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload file' });
      }

      const fileUrl = result.secure_url;
      console.log('Qualification uploaded successfully:', fileUrl);

      // Return URL without saving to database yet (we'll save after user signup)
      return res.json({ 
        message: 'Qualification uploaded successfully!', 
        url: fileUrl
      });
    }).end(file.buffer);

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Route to save qualifications after coach signup
router.post('/save', async (req, res) => {
  const { coach_id, qualifications } = req.body;

  if (!coach_id || !qualifications || !Array.isArray(qualifications)) {
    return res.status(400).json({ error: 'Coach ID and qualifications array are required' });
  }

  try {
    // Insert all qualifications for this coach
    const qualificationRows = qualifications.map(url => ({
      coach_id,
      qualifications: url
    }));

    const { error: dbError } = await supabase
      .from('Qualifications')
      .insert(qualificationRows);

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save qualifications to database' });
    }

    return res.json({ 
      message: 'Qualifications saved successfully!',
      count: qualifications.length
    });

  } catch (err) {
    console.error('Save qualifications error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
