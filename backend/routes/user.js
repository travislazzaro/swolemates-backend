const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer config for file uploads
const upload = multer({
  limits: {
    fileSize: 5000000 // 5MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Please upload an image'));
    }
    cb(undefined, true);
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/me/profile-pic', auth, upload.single('profilePic'), async (req, res) => {
  try {
    // Resize and optimize image
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 500, height: 500, fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'swolemates/profiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profilePic: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({ profilePic: user.profilePic });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get potential matches
router.get('/potential-matches', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    // Get users that current user hasn't liked or passed
    const excludedIds = [
      ...currentUser.likedUsers,
      ...currentUser.passedUsers,
      ...currentUser.matches,
      currentUser._id
    ];

    const potentialMatches = await User.find({
      _id: { $nin: excludedIds },
      // Optional: filter by location, goals, schedule preferences
      'location.coordinates': {
        $near: {
          $geometry: currentUser.location,
          $maxDistance: 50000 // 50km
        }
      }
    })
    .limit(20)
    .select('-password');

    res.json(potentialMatches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Swipe action (like/pass)
router.post('/swipe', auth, async (req, res) => {
  try {
    const { targetUserId, action } = req.body; // action: 'like' or 'pass'
    
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'like') {
      currentUser.likedUsers.push(targetUserId);
      
      // Check if target user also liked current user (mutual match)
      if (targetUser.likedUsers.includes(req.userId)) {
        currentUser.matches.push(targetUserId);
        targetUser.matches.push(req.userId);
        await targetUser.save();
        
        // Create match notification
        const Notification = require('../models/notification');
        await Notification.create({
          userId: targetUserId,
          type: 'match',
          message: `New match with ${currentUser.name}!`,
          data: { userId: req.userId }
        });
        
        return res.json({ matched: true, user: targetUser });
      }
    } else {
      currentUser.passedUsers.push(targetUserId);
    }

    await currentUser.save();
    res.json({ matched: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's matches
router.get('/matches', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('matches', '-password');
    res.json(user.matches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;