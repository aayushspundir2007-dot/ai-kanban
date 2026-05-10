const mongoose = require('mongoose');

const groupFormationSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectTitle: { type: String, default: '' },
  projectRequirements: [{
    skill: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
    count: { type: Number, default: 1 }
  }],
  groupSize: { type: Number, default: 4 },
  studentPool: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  generatedGroups: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]],
  aiRationale: { type: String, default: '' },
  skillCoverageScore: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'modified', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('GroupFormation', groupFormationSchema);
