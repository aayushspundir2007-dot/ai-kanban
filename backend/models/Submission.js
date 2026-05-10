const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  content: { type: String, default: '' },
  attachments: [{ name: String, url: String }],
  status: { type: String, enum: ['not_submitted', 'submitted', 'late', 'graded', 'returned'], default: 'not_submitted' },
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' },
  submittedAt: Date,
  gradedAt: Date,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
