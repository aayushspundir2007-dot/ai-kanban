const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{ name: String, url: String }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
