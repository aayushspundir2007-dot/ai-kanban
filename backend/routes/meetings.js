const router = require('express').Router();
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ host: req.user._id }, { participants: req.user._id }]
    }).populate('host', 'name avatar').sort('scheduledAt');
    res.json(meetings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const meeting = await Meeting.create({ ...req.body, host: req.user._id });

    // Notify participants
    if (req.body.participants?.length) {
      const notifs = req.body.participants.map(p => ({
        recipient: p,
        type: 'system',
        title: 'Meeting Scheduled',
        message: `${req.user.name} scheduled "${meeting.title}"`,
        link: '/meetings'
      }));
      await Notification.insertMany(notifs);
    }

    res.status(201).json(meeting);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const m = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(m);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
