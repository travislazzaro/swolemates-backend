// models/Gym.js
const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: String,
  amenities: [String],
  rating: {
    type: Number,
    default: 0
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  photos: [String]
});

gymSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Gym', gymSchema);