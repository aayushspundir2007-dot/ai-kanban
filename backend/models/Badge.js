const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['first_project', 'task_master', 'on_time', 'collaborator', 'top_student', 'streak_7', 'streak_30', 'ai_user', 'perfect_score'], required: true },
  title: String,
  description: String,
  icon: String,
  awardedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
