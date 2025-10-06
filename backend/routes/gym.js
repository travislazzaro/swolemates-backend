const express = require('express');
const router = express.Router();
const Gym = require('../models/gym');
const auth = require('../middleware/auth');

// Get nearby gyms
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query; // maxDistance in meters

    const gyms = await Gym.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(20);

    res.json(gyms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get gym details
router.get('/:gymId', auth, async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.gymId)
      .populate('members', 'name profilePic');
    res.json(gym);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;