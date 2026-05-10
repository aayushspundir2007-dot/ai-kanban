const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  contributions: [{
    taskTitle: String,
    description: String,
    hoursSpent: Number,
    deliverables: [String],
    impact: String
  }],
  skills: [String],
  aiGeneratedSummary: { type: String, default: '' },
  publicSlug: { type: String, unique: true, sparse: true },
  pdfUrl: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
