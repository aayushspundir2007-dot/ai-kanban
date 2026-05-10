const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  type: { type: String, enum: ['comment', 'feedback', 'approval'], default: 'comment' },
  attachments: [{ name: String, url: String }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
