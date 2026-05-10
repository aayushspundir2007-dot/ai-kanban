const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const PREMIUM_PRICE_ID = 'price_your_stripe_price_id'; // Set in Stripe dashboard

exports.createCheckoutSession = async (req, res) => {
  try {
    let customerId = req.user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user = await User.findOne({ email: session.customer_email });
    if (user) {
      await Subscription.findOneAndUpdate(
        { user: user._id },
        {
          plan: 'premium',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'active',
          features: { maxProjects: 999, aiFeatures: true, fileUpload: true, advancedAnalytics: true }
        },
        { upsert: true }
      );
      await User.findByIdAndUpdate(user._id, { 'subscription.plan': 'premium' });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { plan: 'free', status: 'canceled', features: { maxProjects: 3, aiFeatures: false, fileUpload: false, advancedAnalytics: false } }
    );
  }

  res.json({ received: true });
};

exports.getSubscription = async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id });
  res.json(sub);
};

exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id });
    if (sub?.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    }
    res.json({ message: 'Subscription canceled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
