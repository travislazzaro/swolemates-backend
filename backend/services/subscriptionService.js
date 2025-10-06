// services/subscriptionService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

class SubscriptionService {
  // Create subscription plans
  static PLANS = {
    FREE: { name: 'Free', price: 0, features: ['Basic matching', 'Limited swipes'] },
    PREMIUM: { name: 'Premium', price: 9.99, features: ['Unlimited swipes', 'Advanced filters', 'See who liked you'] },
    PRO: { name: 'Pro', price: 19.99, features: ['Everything in Premium', 'Priority matching', 'Workout analytics', 'Personal training content'] }
  };

  // Create Stripe customer
  static async createCustomer(user) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() }
    });

    await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    return customer;
  }

  // Create subscription
  static async createSubscription(userId, plan) {
    const user = await User.findById(userId);
    
    if (!user.stripeCustomerId) {
      await this.createCustomer(user);
    }

    const priceId = process.env[`STRIPE_${plan}_PRICE_ID`];
    
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: plan,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status
    });

    return subscription;
  }

  // Cancel subscription
  static async cancelSubscription(userId) {
    const user = await User.findById(userId);
    
    if (!user.subscriptionId) {
      throw new Error('No active subscription');
    }

    const subscription = await stripe.subscriptions.del(user.subscriptionId);

    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: 'FREE',
      subscriptionId: null,
      subscriptionStatus: 'cancelled'
    });

    return subscription;
  }

  // Handle webhook events
  static async handleWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          { subscriptionStatus: subscription.status }
        );
        break;
      
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      
      case 'invoice.payment_failed':
        // Handle failed payment
        break;
    }
  }
}

module.exports = SubscriptionService;