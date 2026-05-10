const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// ─── Get tasks for project ────────────────────────────────────────────────────
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name')
      .populate('blockedBy', 'title status')
      .populate('blocking', 'title status')
      .sort('order');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Create task ──────────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, deadline, assignedTo,
      labels, estimatedHours, storyPoints, isAISuggested, blockedBy } = req.body;

    const task = await Task.create({
      title, description, status, priority, deadline, assignedTo,
      labels, estimatedHours, storyPoints, isAISuggested,
      blockedBy: blockedBy || [],
      project: req.params.projectId,
      createdBy: req.user._id,
      statusHistory: [{ status: status || 'todo', changedBy: req.user._id }]
    });

    // Update blocking references
    if (blockedBy?.length) {
      await Task.updateMany(
        { _id: { $in: blockedBy } },
        { $addToSet: { blocking: task._id } }
      );
    }

    // Update project story points
    await Project.findByIdAndUpdate(req.params.projectId, {
      $inc: { totalStoryPoints: storyPoints || 1 }
    });

    await ActivityLog.create({
      user: req.user._id, action: 'created task',
      entity: 'task', entityId: task._id, details: title
    });

    if (assignedTo && assignedTo !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo, type: 'task_update',
        title: 'New Task Assigned',
        message: `You have been assigned: "${title}"`,
        link: `/projects/${req.params.projectId}`
      });
    }

    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Update task ──────────────────────────────────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    // Track status change history
    if (req.body.status && req.body.status !== existing.status) {
      const lastChange = existing.statusHistory?.slice(-1)[0];
      const timeInPrev = lastChange
        ? Math.round((Date.now() - new Date(lastChange.changedAt)) / 60000)
        : 0;

      req.body.statusHistory = [
        ...(existing.statusHistory || []),
        { status: req.body.status, changedBy: req.user._id, timeInPreviousStatus: timeInPrev }
      ];

      // If unblocking, set resolvedAt
      if (existing.status === 'blocked' && req.body.status !== 'blocked') {
        req.body.blockerResolvedAt = new Date();
      }
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email avatar')
      .populate('blockedBy', 'title status')
      .populate('blocking', 'title status');

    // Recalculate project progress
    const tasks = await Task.find({ project: task.project });
    const done = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((done / tasks.length) * 100);
    await Project.findByIdAndUpdate(task.project, { progress });

    await ActivityLog.create({
      user: req.user._id, action: `updated task to ${task.status}`,
      entity: 'task', entityId: task._id
    });

    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Delete task ──────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });

    // Clean up blocking references
    await Task.updateMany(
      { _id: { $in: task.blockedBy } },
      { $pull: { blocking: task._id } }
    );
    await Task.updateMany(
      { _id: { $in: task.blocking } },
      { $pull: { blockedBy: task._id } }
    );

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Reorder tasks (drag & drop) ─────────────────────────────────────────────
exports.reorderTasks = async (req, res) => {
  try {
    const updates = req.body.map(({ id, order, status }) =>
      Task.findByIdAndUpdate(id, { order, status })
    );
    await Promise.all(updates);
    res.json({ message: 'Reordered' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Feature 1: Set blocker ───────────────────────────────────────────────────
exports.setBlocker = async (req, res) => {
  try {
    const { blockedByIds, blockerNote } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'blocked',
        blockedBy: blockedByIds,
        blockerNote,
        blockerReportedAt: new Date(),
        $push: { statusHistory: { status: 'blocked', changedBy: req.user._id } }
      },
      { new: true }
    ).populate('blockedBy', 'title assignedTo').populate('assignedTo', 'name');

    // Update blocking references
    await Task.updateMany(
      { _id: { $in: blockedByIds } },
      { $addToSet: { blocking: task._id } }
    );

    // Notify faculty
    const project = await Project.findById(task.project).populate('faculty', '_id name');
    if (project?.faculty) {
      await Notification.create({
        recipient: project.faculty._id,
        type: 'task_update',
        title: '🚫 Task Blocked',
        message: `Task "${task.title}" is blocked. Reason: ${blockerNote}`,
        link: `/projects/${task.project}/kanban`
      });
    }

    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Feature 1: Resolve blocker ──────────────────────────────────────────────
exports.resolveBlocker = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'in_progress',
        blockedBy: [],
        blockerNote: '',
        blockerResolvedAt: new Date(),
        $push: { statusHistory: { status: 'in_progress', changedBy: req.user._id } }
      },
      { new: true }
    );

    // Clean up blocking refs
    await Task.updateMany(
      { blocking: task._id },
      { $pull: { blocking: task._id } }
    );

    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Feature 3: Log time entry ────────────────────────────────────────────────
exports.logTime = async (req, res) => {
  try {
    const { startTime, endTime, note } = req.body;
    const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: { timeEntries: { user: req.user._id, startTime, endTime, duration, note } },
        $inc: { actualHours: duration / 60 }
      },
      { new: true }
    );

    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Feature 5: Upload deliverable ───────────────────────────────────────────
exports.uploadDeliverable = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { wordCount } = req.body;
    const fileSize = req.file.size;
    const task = await Task.findById(req.params.id);

    // Anomaly detection
    const timeInProgress = task.statusHistory
      .filter(h => h.status === 'in_progress')
      .reduce((sum, h) => sum + (h.timeInPreviousStatus || 0), 0);

    const anomalyFlags = [];
    let anomalyScore = 0;

    if (wordCount && timeInProgress < 30 && wordCount > 1000) {
      anomalyFlags.push(`High word count (${wordCount}) with very low time in progress (${timeInProgress} min)`);
      anomalyScore += 40;
    }
    if (fileSize > 5 * 1024 * 1024 && timeInProgress < 60) {
      anomalyFlags.push(`Large file (${Math.round(fileSize / 1024)}KB) uploaded after minimal work time`);
      anomalyScore += 30;
    }
    if (timeInProgress === 0 && fileSize > 0) {
      anomalyFlags.push('File uploaded without any recorded time in progress');
      anomalyScore += 50;
    }

    const deliverable = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      fileSize,
      wordCount: wordCount ? parseInt(wordCount) : 0,
      uploadedBy: req.user._id,
      anomalyScore: Math.min(anomalyScore, 100),
      anomalyFlags
    };

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { deliverables: deliverable } },
      { new: true }
    );

    // Alert faculty if anomaly detected
    if (anomalyScore >= 50) {
      const project = await Project.findById(task.project).populate('faculty', '_id');
      if (project?.faculty) {
        await Notification.create({
          recipient: project.faculty._id,
          type: 'system',
          title: '⚠️ Effort Anomaly Detected',
          message: `Suspicious upload on task "${task.title}": ${anomalyFlags[0]}`,
          link: `/projects/${task.project}/kanban`
        });
      }
    }

    res.json({ deliverable, anomalyScore, anomalyFlags, task: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
