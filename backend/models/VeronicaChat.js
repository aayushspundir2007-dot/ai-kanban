const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'veronica'], required: true },
  content: { type: String, required: true },
  action: { type: String, default: null }, // action Veronica took
  actionData: { type: mongoose.Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now }
});

const veronicaChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [messageSchema],
  context: { type: mongoose.Schema.Types.Mixed, default: {} }, // persistent memory
  mood: { type: String, enum: ['helpful', 'encouraging', 'focused', 'celebratory'], default: 'helpful' }
}, { timestamps: true });

module.exports = mongoose.model('VeronicaChat', veronicaChatSchema);
