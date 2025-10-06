// routes/subscription.js
const express = require('express');
const router = express.Router();
const SubscriptionService = require('../services/subscriptionService');
const auth = require('../middleware/auth');

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json(SubscriptionService.PLANS);
});

// Create subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const subscription = await SubscriptionService.createSubscription(req.userId, plan);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel subscription
router.delete('/cancel', auth, async (req, res) => {
  try {
    const subscription = await SubscriptionService.cancelSubscription(req.userId);
    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await SubscriptionService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;