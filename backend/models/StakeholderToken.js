const mongoose = require('mongoose');
const crypto = require('crypto');

const stakeholderTokenSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  token: { type: String, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, default: 'External Reviewer' }, // "NGO Supervisor", "Industry Mentor"
  permissions: {
    canView: { type: Boolean, default: true },
    canComment: { type: Boolean, default: false },
    canApprove: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
  },
  expiresAt: { type: Date, required: true },
  lastAccessedAt: Date,
  accessLog: [{
    ip: String,
    accessedAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

stakeholderTokenSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('StakeholderToken', stakeholderTokenSchema);
