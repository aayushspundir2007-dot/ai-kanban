const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  points: { type: Number, default: 100 },
  type: { type: String, enum: ['assignment', 'quiz', 'material', 'question'], default: 'assignment' },
  attachments: [{ name: String, url: String }],
  topic: { type: String, default: '' },
  status: { type: String, enum: ['active', 'draft', 'closed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
