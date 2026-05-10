const router = require('express').Router();
const Quiz = require('../models/Quiz');
const { protect, authorize, premiumOnly } = require('../middleware/auth');

// Get quizzes for class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ class: req.params.classId })
      .populate('createdBy', 'name').sort('-createdAt');
    res.json(quizzes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create quiz
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(quiz);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI generate quiz questions (disabled)
router.post('/ai-generate', protect, premiumOnly, async (req, res) => {
  res.status(503).json({ message: 'AI quiz generation is currently unavailable.' });
});

// Submit quiz attempt
router.post('/:id/attempt', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    const maxScore = quiz.questions.reduce((s, q) => s + q.points, 0);
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += q.points;
    });

    quiz.attempts.push({ student: req.user._id, answers, score, maxScore, completedAt: new Date() });
    await quiz.save();

    res.json({ score, maxScore, percentage: Math.round((score / maxScore) * 100) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update quiz
router.put('/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(q);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
