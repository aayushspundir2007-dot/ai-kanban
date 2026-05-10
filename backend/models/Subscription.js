const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  status: { type: String, enum: ['active', 'canceled', 'past_due', 'trialing'], default: 'active' },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  features: {
    maxProjects: { type: Number, default: 3 },
    aiFeatures: { type: Boolean, default: false },
    fileUpload: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
