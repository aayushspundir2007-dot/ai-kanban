const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const ActivityLog = require('../models/ActivityLog');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, enrollmentId } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, department, enrollmentId });

    // Create default free subscription
    await Subscription.create({
      user: user._id,
      plan: 'free',
      features: { maxProjects: 3, aiFeatures: false, fileUpload: false, advancedAnalytics: false }
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await ActivityLog.create({ user: user._id, action: 'login', entity: 'user', entityId: user._id });

    // Always sync subscription plan onto user object
    const subscription = await Subscription.findOne({ user: user._id });
    if (subscription) {
      await User.findByIdAndUpdate(user._id, { 'subscription.plan': subscription.plan });
      user.subscription = { plan: subscription.plan };
    }

    const token = signToken(user._id);
    res.json({ token, user, subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  const subscription = await Subscription.findOne({ user: req.user._id });
  res.json({ user, subscription });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, department, enrollmentId, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, department, enrollmentId, avatar },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'No credential provided' });

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        password: Math.random().toString(36).slice(-12) + 'Aa1!', // random secure password
        role: 'student',
        'subscription.plan': 'free',
      });
      await Subscription.create({
        user: user._id,
        plan: 'free',
        features: { maxProjects: 3, aiFeatures: false, fileUpload: false, advancedAnalytics: false }
      });
    } else {
      // Update google info if signing in with Google for first time
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture) user.avatar = picture;
        await user.save({ validateBeforeSave: false });
      }
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await ActivityLog.create({ user: user._id, action: 'login via Google', entity: 'user', entityId: user._id });

    const subscription = await Subscription.findOne({ user: user._id });
    if (subscription) user.subscription = { plan: subscription.plan };

    const token = signToken(user._id);
    res.json({ token, user, subscription });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};
