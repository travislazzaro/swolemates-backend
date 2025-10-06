// services/analyticsService.js
const Analytics = require('../models/Analytics');

class AnalyticsService {
  // Track user activity
  static async trackActivity(userId, action, metadata = {}) {
    try {
      await Analytics.create({
        userId,
        action,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Get user engagement metrics
  static async getUserEngagement(userId, startDate, endDate) {
    const activities = await Analytics.find({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    return {
      totalActivities: activities.length,
      workoutsLogged: activities.filter(a => a.action === 'workout_logged').length,
      matchesMade: activities.filter(a => a.action === 'match_made').length,
      messagesSent: activities.filter(a => a.action === 'message_sent').length
    };
  }

  // Get platform-wide statistics
  static async getPlatformStats() {
    const User = require('../models/User');
    const Workout = require('../models/Workout');
    const Message = require('../models/Message');

    const [
      totalUsers,
      activeUsers,
      totalWorkouts,
      totalMatches,
      totalMessages
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastWorkoutDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Workout.countDocuments(),
      User.aggregate([{ $project: { matchCount: { $size: '$matches' } } }, { $group: { _id: null, total: { $sum: '$matchCount' } } }]),
      Message.countDocuments()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalWorkouts,
      totalMatches: totalMatches[0]?.total || 0,
      totalMessages
    };
  }
}

module.exports = AnalyticsService;

// models/Analytics.js
const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'swipe', 'match_made', 'message_sent', 'workout_logged', 'workout_scheduled']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

analyticsSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);