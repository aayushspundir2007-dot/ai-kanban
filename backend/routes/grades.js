const router = require('express').Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { protect } = require('../middleware/auth');

// Get gradebook for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.classId }).select('title points dueDate');
    const submissions = await Submission.find({ class: req.params.classId })
      .populate('student', 'name email enrollmentId')
      .populate('assignment', 'title points');

    res.json({ assignments, submissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get my grades for a class (student)
router.get('/my/:classId', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      class: req.params.classId,
      student: req.user._id
    }).populate('assignment', 'title points dueDate');
    res.json(submissions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
