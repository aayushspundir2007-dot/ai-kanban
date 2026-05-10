const router = require('express').Router();
const Class = require('../models/Class');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Get all classes for current user
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : req.user.role === 'faculty'
        ? { teacher: req.user._id }
        : { students: req.user._id };
    const classes = await Class.find(query)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar')
      .sort('-createdAt');
    res.json(classes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create class (faculty/admin)
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const cls = await Class.create({ ...req.body, teacher: req.user._id });
    res.status(201).json(cls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single class
router.get('/:id', protect, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('teacher', 'name email avatar department')
      .populate('students', 'name email avatar department enrollmentId');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update class
router.put('/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete class
router.delete('/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Join class by code (students)
router.post('/join', protect, authorize('student'), async (req, res) => {
  try {
    const { classCode } = req.body;
    const cls = await Class.findOne({ classCode: classCode.toUpperCase() });
    if (!cls) return res.status(404).json({ message: 'Invalid class code' });
    if (cls.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }
    cls.students.push(req.user._id);
    await cls.save();
    await Notification.create({
      recipient: cls.teacher,
      type: 'system',
      title: 'New Student Joined',
      message: `${req.user.name} joined your class "${cls.name}"`,
      link: `/classes/${cls._id}`
    });
    res.json(cls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove student from class
router.delete('/:id/students/:studentId', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    await Class.findByIdAndUpdate(req.params.id, {
      $pull: { students: req.params.studentId }
    });
    res.json({ message: 'Student removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
