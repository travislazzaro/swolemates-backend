// services/matchingAlgorithm.js
const User = require('../models/User');
const geolib = require('geolib');

class MatchingAlgorithm {
  // Calculate compatibility score between two users
  static calculateCompatibility(user1, user2) {
    let score = 0;

    // Goal compatibility (40 points max)
    const commonGoals = user1.goals.filter(goal => user2.goals.includes(goal));
    score += commonGoals.length * 10;

    // Experience level compatibility (20 points max)
    const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
    const exp1Index = experienceLevels.indexOf(user1.experience);
    const exp2Index = experienceLevels.indexOf(user2.experience);
    const expDiff = Math.abs(exp1Index - exp2Index);
    score += (2 - expDiff) * 10;

    // Schedule compatibility (20 points max)
    if (user1.schedule === user2.schedule || 
        user1.schedule === 'Flexible' || 
        user2.schedule === 'Flexible') {
      score += 20;
    }

    // Gym proximity (20 points max)
    if (user1.gym === user2.gym) {
      score += 20;
    }

    return score;
  }

  // Get ranked potential matches for a user
  static async getRankedMatches(userId, limit = 20) {
    const currentUser = await User.findById(userId);
    
    const excludedIds = [
      ...currentUser.likedUsers,
      ...currentUser.passedUsers,
      ...currentUser.matches,
      currentUser._id
    ];

    // Get potential matches within 50km
    const potentialMatches = await User.find({
      _id: { $nin: excludedIds },
      'location.coordinates': {
        $near: {
          $geometry: currentUser.location,
          $maxDistance: 50000
        }
      }
    }).limit(100);

    // Calculate compatibility scores
    const rankedMatches = potentialMatches.map(user => ({
      user,
      score: this.calculateCompatibility(currentUser, user),
      distance: geolib.getDistance(
        {
          latitude: currentUser.location.coordinates[1],
          longitude: currentUser.location.coordinates[0]
        },
        {
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0]
        }
      )
    }));

    // Sort by score (descending) and return top matches
    rankedMatches.sort((a, b) => b.score - a.score);
    
    return rankedMatches.slice(0, limit).map(match => ({
      ...match.user.toObject(),
      compatibilityScore: match.score,
      distance: Math.round(match.distance / 1000) // Convert to km
    }));
  }
}

module.exports = MatchingAlgorithm;