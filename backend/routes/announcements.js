const router = require('express').Router();
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.get('/class/:classId', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ class: req.params.classId })
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar')
      .sort('-createdAt');
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, author: req.user._id });
    const populated = await ann.populate('author', 'name avatar role');

    // Notify students
    const cls = await Class.findById(req.body.class);
    if (cls?.students?.length) {
      const notifs = cls.students
        .filter(s => s.toString() !== req.user._id.toString())
        .map(s => ({
          recipient: s,
          type: 'system',
          title: 'New Announcement',
          message: `${req.user.name} posted in ${cls.name}`,
          link: `/classes/${cls._id}`
        }));
      await Notification.insertMany(notifs);
    }

    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add comment to announcement
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { author: req.user._id, content: req.body.content } } },
      { new: true }
    ).populate('author', 'name avatar role').populate('comments.author', 'name avatar');
    res.json(ann);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
