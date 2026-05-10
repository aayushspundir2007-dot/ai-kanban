const router = require('express').Router();
const express = require('express');
const {
  createCheckoutSession,
  handleWebhook,
  getSubscription,
  cancelSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.get('/', protect, getSubscription);
router.post('/checkout', protect, createCheckoutSession);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;
