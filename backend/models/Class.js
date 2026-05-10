const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  section: { type: String, default: '' },
  room: { type: String, default: '' },
  description: { type: String, default: '' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  classCode: { type: String, unique: true },
  coverColor: { type: String, default: '#1d4ed8' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

classSchema.pre('save', function (next) {
  if (!this.classCode) {
    this.classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
