// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  age: {
    type: Number,
    required: true
  },
  profilePic: {
    type: String,
    default: null
  },
  experience: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  goals: [{
    type: String,
    enum: ['Build Muscle', 'Weight Loss', 'Strength', 'Cardio', 'Powerlifting', 'CrossFit', 'General Fitness', 'Conditioning']
  }],
  schedule: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Flexible'],
    required: true
  },
  gym: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    city: String
  },
  workoutsThisMonth: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastWorkoutDate: Date,
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  passedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);