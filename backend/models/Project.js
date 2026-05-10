const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['research', 'software', 'hardware', 'design', 'other'],
    default: 'software'
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stakeholders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold', 'rejected'],
    default: 'active'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision_needed'],
    default: 'pending'
  },

  deadline: Date,
  tags: [String],
  files: [{
    name: String, url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  progress: { type: Number, default: 0, min: 0, max: 100 },

  // Feature 6 — Health score
  healthScore: { type: Number, default: 100 },
  healthBreakdown: {
    taskVelocity: { type: Number, default: 0 },
    blockerResolutionTime: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 }
  },
  healthHistory: [{
    score: Number, calculatedAt: { type: Date, default: Date.now }
  }],

  // Feature 3 — Burndown
  burndownData: [{
    date: Date,
    plannedPoints: Number,
    completedPoints: Number,
    remainingPoints: Number
  }],
  totalStoryPoints: { type: Number, default: 0 },

  // Feature 11 — Portfolio
  portfolioUrl: { type: String, default: '' },
  portfolioGeneratedAt: Date,

  aiSuggestions: [String],
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
