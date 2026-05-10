const router = require('express').Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt').limit(50);
  res.json(notifications);
});

router.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
  res.json({ message: 'All marked as read' });
});

router.put('/:id/read', protect, async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json(n);
});

router.delete('/:id', protect, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
