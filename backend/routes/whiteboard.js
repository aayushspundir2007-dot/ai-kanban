const router = require('express').Router();
const Whiteboard = require('../models/Whiteboard');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const boards = await Whiteboard.find({ project: req.params.projectId })
      .populate('createdBy', 'name').sort('-updatedAt');
    res.json(boards);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const board = await Whiteboard.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('collaborators', 'name avatar');
    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const board = await Whiteboard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Whiteboard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
