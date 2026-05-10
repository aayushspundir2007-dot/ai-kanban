const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, enum: ['project', 'task', 'comment', 'user', 'subscription'] },
  entityId: mongoose.Schema.Types.ObjectId,
  details: String,
  ip: String
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
