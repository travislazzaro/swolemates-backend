const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const auth = require('../middleware/auth');

// Get conversation with a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    const message = new Message({
      senderId: req.userId,
      receiverId,
      content
    });

    await message.save();

    // Create notification
    const Notification = require('../models/notification');
    const User = require('../models/user');
    const sender = await User.findById(req.userId);
    
    await Notification.create({
      userId: receiverId,
      type: 'message',
      message: `${sender.name} sent you a message`,
      data: { userId: req.userId }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.userId, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;