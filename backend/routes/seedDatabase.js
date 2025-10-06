// scripts/seedDatabase.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Gym = require('../models/Gym');
require('dotenv').config();

const gyms = [
  {
    name: 'FitZone Downtown',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749]
    },
    address: '123 Market St, San Francisco, CA',
    amenities: ['Weights', 'Cardio', 'Classes', 'Pool', 'Sauna'],
    rating: 4.5
  },
  {
    name: 'Iron Temple',
    location: {
      type: 'Point',
      coordinates: [-122.4312, 37.7739]
    },
    address: '456 Mission St, San Francisco, CA',
    amenities: ['Powerlifting', 'Olympic Lifting', 'Personal Training'],
    rating: 4.8
  },
  {
    name: 'CrossFit Box',
    location: {
      type: 'Point',
      coordinates: [-122.4089, 37.7829]
    },
    address: '789 Howard St, San Francisco, CA',
    amenities: ['CrossFit', 'HIIT', 'Climbing Wall', 'Boxing'],
    rating: 4.6
  }
];

const sampleUsers = [
  {
    name: 'Alex Chen',
    email: 'alex@example.com',
    password: 'password123',
    age: 28,
    experience: 'Intermediate',
    goals: ['Build Muscle', 'Strength'],
    schedule: 'Morning',
    gym: 'FitZone Downtown',
    bio: 'Looking for a consistent lifting partner!',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
      city: 'San Francisco'
    }
  },
  // Add more sample users...
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await User.deleteMany({});
    await Gym.deleteMany({});
    
    // Seed gyms
    await Gym.insertMany(gyms);
    console.log('Gyms seeded');
    
    // Seed users
    await User.insertMany(sampleUsers);
    console.log('Users seeded');
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();