const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    points: { type: Number, default: 1 }
  }],
  timeLimit: { type: Number, default: 30 }, // minutes
  isAIGenerated: { type: Boolean, default: false },
  attempts: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [Number],
    score: Number,
    maxScore: Number,
    completedAt: Date
  }],
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
