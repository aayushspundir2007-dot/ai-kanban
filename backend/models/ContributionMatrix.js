const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metrics: {
    cardsCreated: { type: Number, default: 0 },
    cardsCompleted: { type: Number, default: 0 },
    avgMoveVelocity: { type: Number, default: 0 }, // hours per card
    totalHoursLogged: { type: Number, default: 0 },
    deliverablesUploaded: { type: Number, default: 0 },
    commentsMade: { type: Number, default: 0 },
    blockerResolutions: { type: Number, default: 0 },
    onTimeDeliveries: { type: Number, default: 0 },
    anomalyFlags: { type: Number, default: 0 }
  },
  contributionScore: { type: Number, default: 0 }, // 0-100
  percentageOfTeam: { type: Number, default: 0 },
  suggestedGrade: { type: String, default: '' },
  aiJustification: { type: String, default: '' },
  lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

contributionSchema.index({ project: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ContributionMatrix', contributionSchema);
