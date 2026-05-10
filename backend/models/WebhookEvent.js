const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  source: { type: String, enum: ['github', 'gitlab', 'figma'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  eventType: { type: String, required: true },
  externalRef: { type: String, default: '' }, // commit SHA, PR number, etc.
  payload: { type: mongoose.Schema.Types.Mixed },
  actionTaken: { type: String, default: '' },
  processed: { type: Boolean, default: false },
  processedAt: Date,
  error: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
