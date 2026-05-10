const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  googleId: { type: String, default: '' },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin', 'stakeholder'],
    default: 'student'
  },
  avatar: { type: String, default: '' },
  department: { type: String, default: '' },
  enrollmentId: { type: String, default: '' },

  // Feature 10 — Skills
  skills: [{
    name: String,
    category: { type: String, enum: ['technical', 'research', 'design', 'communication', 'management'] },
    level: { type: String, enum: ['beginner', 'intermediate', 'expert'] }
  }],
  preferredRoles: [String],
  availability: { type: Number, default: 20 }, // hours/week

  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    expiresAt: Date
  },

  // Feature 9 — Stakeholder token
  shareToken: { type: String, default: '' },
  tokenExpiry: Date,

  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
