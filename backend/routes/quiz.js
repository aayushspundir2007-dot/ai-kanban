const router = require('express').Router();
const Quiz = require('../models/Quiz');
const OpenAI = require('openai');
const { protect, authorize, premiumOnly } = require('../middleware/auth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// AI generate quiz questions
router.post('/ai-generate', protect, premiumOnly, async (req, res) => {
  try {
    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;
    const prompt = `Generate ${numQuestions} multiple choice questions about "${topic}" at ${difficulty} difficulty for university students.
Return ONLY valid JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","points":1}]
correctAnswer is the index (0-3) of the correct option.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\[[\s\S]*\]/);
    const questions = match ? JSON.parse(match[0]) : [];
    res.json({ questions });
  } catch (err) { res.status(500).json({ message: err.message }); }
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
