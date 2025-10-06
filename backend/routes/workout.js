const express = require('express');
const router = express.Router();
const Workout = require('../models/workout');
const ScheduledWorkout = require('../models/scheduledworkout');
const User = require('../models/user');
const auth = require('../middleware/auth');

// Log workout
router.post('/', auth, async (req, res) => {
  try {
    const { type, exercises, duration, buddy, notes } = req.body;

    const workout = new Workout({
      userId: req.userId,
      type,
      exercises,
      duration,
      buddy,
      notes
    });

    await workout.save();

    // Update user stats
    const user = await User.findById(req.userId);
    user.workoutsThisMonth += 1;
    
    // Update streak
    const today = new Date();
    if (user.lastWorkoutDate) {
      const daysDiff = Math.floor((today - user.lastWorkoutDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.streak += 1;
      } else if (daysDiff > 1) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    
    user.lastWorkoutDate = today;
    await user.save();

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's workouts
router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId })
      .populate('buddy', 'name profilePic')
      .sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule workout
router.post('/schedule', auth, async (req, res) => {
  try {
    const { buddyId, date, time, gym, type, notes } = req.body;

    const scheduledWorkout = new ScheduledWorkout({
      userId: req.userId,
      buddyId,
      date,
      time,
      gym,
      type,
      notes
    });

    await scheduledWorkout.save();

    // Create notification
    const Notification = require('../models/notification');
    const user = await User.findById(req.userId);
    
    await Notification.create({
      userId: buddyId,
      type: 'workout',
      message: `${user.name} scheduled a workout with you`,
      data: { workoutId: scheduledWorkout._id }
    });

    res.status(201).json(scheduledWorkout);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get scheduled workouts
router.get('/scheduled', auth, async (req, res) => {
  try {
    const workouts = await ScheduledWorkout.find({
      $or: [{ userId: req.userId }, { buddyId: req.userId }],
      status: 'pending'
    })
    .populate('userId buddyId', 'name profilePic')
    .sort({ date: 1 });
    
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;