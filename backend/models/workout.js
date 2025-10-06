// models/Workout.js
const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  exercises: [{
    type: String
  }],
  duration: {
    type: Number,
    required: true
  },
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
});

module.exports = mongoose.model('Workout', workoutSchema);