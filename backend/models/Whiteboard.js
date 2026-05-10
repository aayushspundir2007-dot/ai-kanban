const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  elements: { type: mongoose.Schema.Types.Mixed, default: [] }, // canvas JSON
  thumbnail: String
}, { timestamps: true });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
