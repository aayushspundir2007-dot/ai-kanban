const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
  note: { type: String, default: '' }
}, { _id: true, timestamps: false });

const deliverableSchema = new mongoose.Schema({
  name: String,
  url: String,
  fileSize: Number, // bytes
  wordCount: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  anomalyScore: { type: Number, default: 0 },
  anomalyFlags: [String]
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timeInPreviousStatus: Number // minutes
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Feature 1 — Dependencies
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  blocking: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  blockerNote: { type: String, default: '' },
  blockerReportedAt: Date,
  blockerResolvedAt: Date,

  // Feature 3 — Time tracking
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  storyPoints: { type: Number, default: 1 },
  timeEntries: [timeEntrySchema],
  statusHistory: [statusHistorySchema],

  // Feature 5 — Deliverables + anomaly
  deliverables: [deliverableSchema],

  // Feature 7 — AI resources
  aiResources: [{
    title: String,
    url: String,
    type: { type: String, enum: ['article', 'dataset', 'paper', 'video', 'tool'] },
    relevanceScore: Number,
    pinnedAt: { type: Date, default: Date.now }
  }],

  // Feature 8 — Webhook links
  externalLinks: [{
    source: { type: String, enum: ['github', 'gitlab', 'figma'] },
    externalId: String,
    url: String,
    linkedAt: { type: Date, default: Date.now }
  }],

  // Feature 9 — Stakeholder approval
  stakeholderApproved: { type: Boolean, default: false },
  stakeholderApprovedBy: String,
  stakeholderApprovedAt: Date,

  deadline: Date,
  order: { type: Number, default: 0 },
  labels: [String],
  isAISuggested: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
