const WebhookEvent = require('../models/WebhookEvent');
const Task = require('../models/Task');
const Project = require('../models/Project');

// ─── GitHub webhook handler (Feature 8) ──────────────────────────────────────
exports.handleGithub = async (req, res) => {
  try {
    const payload = req.body;
    const event = req.headers['x-github-event'];

    const webhookEvent = await WebhookEvent.create({
      source: 'github',
      eventType: event,
      payload,
      externalRef: payload.after || payload.pull_request?.number?.toString() || ''
    });

    let actionTaken = 'none';
    let taskId = null;

    // Parse task reference from commit message or PR title
    // Convention: "fixes #TASKID" or "[TASKID]" in commit message
    const message = payload.head_commit?.message || payload.pull_request?.title || '';
    const taskRef = message.match(/\[([a-f0-9]{24})\]/) || message.match(/fixes #([a-f0-9]{24})/i);

    if (taskRef) {
      const task = await Task.findById(taskRef[1]);
      if (task) {
        taskId = task._id;

        if (event === 'push') {
          await Task.findByIdAndUpdate(task._id, {
            $push: {
              externalLinks: {
                source: 'github',
                externalId: payload.after,
                url: payload.compare
              }
            }
          });
          actionTaken = 'linked_commit';
        }

        if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
          await Task.findByIdAndUpdate(task._id, {
            status: 'completed',
            $push: { statusHistory: { status: 'completed', changedBy: null } }
          });
          actionTaken = 'moved_to_completed';
        }

        if (event === 'pull_request' && payload.action === 'opened') {
          await Task.findByIdAndUpdate(task._id, {
            status: 'review',
            $push: { statusHistory: { status: 'review', changedBy: null } }
          });
          actionTaken = 'moved_to_review';
        }
      }
    }

    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      task: taskId,
      actionTaken,
      processed: true,
      processedAt: new Date()
    });

    res.json({ received: true, actionTaken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GitLab webhook handler ───────────────────────────────────────────────────
exports.handleGitlab = async (req, res) => {
  try {
    const payload = req.body;
    const event = req.headers['x-gitlab-event'];

    await WebhookEvent.create({
      source: 'gitlab',
      eventType: event,
      payload,
      externalRef: payload.checkout_sha || payload.object_attributes?.iid?.toString() || '',
      processed: true,
      processedAt: new Date(),
      actionTaken: 'logged'
    });

    // Same task-ref parsing logic
    const message = payload.commits?.[0]?.message || payload.object_attributes?.title || '';
    const taskRef = message.match(/\[([a-f0-9]{24})\]/);

    if (taskRef) {
      const task = await Task.findById(taskRef[1]);
      if (task && event === 'Merge Request Hook' && payload.object_attributes?.state === 'merged') {
        await Task.findByIdAndUpdate(task._id, { status: 'completed' });
      }
    }

    res.json({ received: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Figma webhook handler ────────────────────────────────────────────────────
exports.handleFigma = async (req, res) => {
  try {
    const payload = req.body;

    await WebhookEvent.create({
      source: 'figma',
      eventType: payload.event_type || 'figma_event',
      payload,
      externalRef: payload.file_key || '',
      processed: true,
      processedAt: new Date(),
      actionTaken: 'logged'
    });

    // If a comment is resolved in Figma, move linked task to review
    if (payload.event_type === 'FILE_COMMENT' && payload.comment?.resolved) {
      const taskRef = payload.comment?.message?.match(/\[([a-f0-9]{24})\]/);
      if (taskRef) {
        await Task.findByIdAndUpdate(taskRef[1], { status: 'review' });
      }
    }

    res.json({ received: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get webhook history ──────────────────────────────────────────────────────
exports.getWebhookHistory = async (req, res) => {
  try {
    const events = await WebhookEvent.find({ project: req.params.projectId })
      .sort('-createdAt').limit(50);
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
