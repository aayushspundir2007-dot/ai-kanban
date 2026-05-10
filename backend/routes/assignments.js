const router = require('express').Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

// Get assignments for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.classId })
      .populate('createdBy', 'name')
      .sort('-createdAt');

    // For students, attach their submission status
    if (req.user.role === 'student') {
      const withStatus = await Promise.all(assignments.map(async (a) => {
        const sub = await Submission.findOne({ assignment: a._id, student: req.user._id });
        return { ...a.toObject(), mySubmission: sub || null };
      }));
      return res.json(withStatus);
    }

    // For faculty, attach submission count
    const withCounts = await Promise.all(assignments.map(async (a) => {
      const count = await Submission.countDocuments({ assignment: a._id, status: { $ne: 'not_submitted' } });
      return { ...a.toObject(), submissionCount: count };
    }));
    res.json(withCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create assignment
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, createdBy: req.user._id });

    // Notify all students in the class
    const cls = await Class.findById(req.body.class).populate('students', '_id');
    if (cls?.students?.length) {
      const notifications = cls.students.map(s => ({
        recipient: s._id,
        type: 'task_update',
        title: 'New Assignment Posted',
        message: `"${assignment.title}" has been posted in ${cls.name}`,
        link: `/classes/${cls._id}`
      }));
      const Notification = require('../models/Notification');
      await Notification.insertMany(notifications);
    }

    res.status(201).json(assignment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update assignment
router.put('/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const a = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(a);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete assignment
router.delete('/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignment: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
