const mongoose = require('mongoose');

const standupSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week: { type: Number, required: true },
  year: { type: Number, required: true },
  answers: {
    didLastWeek: { type: String, default: '' },
    nextSteps: { type: String, default: '' },
    blockers: { type: String, default: '' }
  },
  boardMovementSnapshot: {
    tasksCompleted: { type: Number, default: 0 },
    tasksCreated: { type: Number, default: 0 },
    tasksMovedToProgress: { type: Number, default: 0 },
    totalHoursLogged: { type: Number, default: 0 }
  },
  aiSummary: { type: String, default: '' },
  discrepancyFlags: [String],
  sentimentScore: { type: Number, default: 0 }, // -1 to 1
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

standupSchema.index({ project: 1, student: 1, week: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('StandupReport', standupSchema);
