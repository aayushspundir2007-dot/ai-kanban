const router = require('express').Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Get all submissions for an assignment (faculty)
router.get('/assignment/:assignmentId', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email avatar enrollmentId')
      .sort('-submittedAt');
    res.json(submissions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get my submission for an assignment (student)
router.get('/my/:assignmentId', protect, async (req, res) => {
  try {
    const sub = await Submission.findOne({
      assignment: req.params.assignmentId,
      student: req.user._id
    });
    res.json(sub || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Submit / update submission (student)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { assignmentId, classId, content, attachments } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    const isLate = assignment?.dueDate && new Date() > new Date(assignment.dueDate);

    const sub = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: req.user._id },
      {
        assignment: assignmentId,
        student: req.user._id,
        class: classId,
        content,
        attachments,
        status: isLate ? 'late' : 'submitted',
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    ).populate('student', 'name email');

    res.json(sub);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Grade submission (faculty)
router.put('/:id/grade', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback, status: 'graded', gradedAt: new Date(), gradedBy: req.user._id },
      { new: true }
    ).populate('student', 'name _id');

    await Notification.create({
      recipient: sub.student._id,
      type: 'feedback',
      title: 'Assignment Graded',
      message: `Your submission has been graded: ${grade} points. ${feedback || ''}`,
      link: `/classes/${sub.class}`
    });

    res.json(sub);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Return submission (ungrade)
router.put('/:id/return', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { status: 'returned', feedback: req.body.feedback },
      { new: true }
    );
    res.json(sub);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
