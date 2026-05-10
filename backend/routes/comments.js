const router = require('express').Router();
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.get('/:entityType/:entityId', protect, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const query = entityType === 'project' ? { project: entityId } : { task: entityId };
    const comments = await Comment.find(query)
      .populate('author', 'name avatar role')
      .sort('createdAt');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { content, projectId, taskId, type } = req.body;
    const comment = await Comment.create({
      content, type,
      author: req.user._id,
      project: projectId,
      task: taskId
    });

    // Notify project owner if faculty is commenting
    if (projectId && req.user.role === 'faculty') {
      const project = await Project.findById(projectId);
      if (project && project.owner.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: project.owner,
          type: 'feedback',
          title: 'New Faculty Feedback',
          message: `${req.user.name} left feedback on your project.`,
          link: `/projects/${projectId}`
        });
      }
    }

    const populated = await comment.populate('author', 'name avatar role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
