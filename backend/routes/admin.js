// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gym = require('../models/Gym');
const AnalyticsService = require('../services/analyticsService');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// middleware/adminAuth.js
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get platform statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = await AnalyticsService.getPlatformStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (with pagination)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban/unban user
router.put('/users/:userId/ban', auth, adminAuth, async (req, res) => {
  try {
    const { banned, reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { banned, banReason: reason },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add gym
router.post('/gyms', auth, adminAuth, async (req, res) => {
  try {
    const gym = new Gym(req.body);
    await gym.save();
    res.status(201).json(gym);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete gym
router.delete('/gyms/:gymId', auth, adminAuth, async (req, res) => {
  try {
    await Gym.findByIdAndDelete(req.params.gymId);
    res.json({ message: 'Gym deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;