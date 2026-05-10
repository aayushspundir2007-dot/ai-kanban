const StakeholderToken = require('../models/StakeholderToken');
const Project = require('../models/Project');
const Task = require('../models/Task');

// ─── Create stakeholder token (Feature 9) ────────────────────────────────────
exports.createToken = async (req, res) => {
  try {
    const { projectId, label, canComment, canApprove, expiresInDays = 30 } = req.body;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = await StakeholderToken.create({
      project: projectId,
      createdBy: req.user._id,
      label,
      permissions: {
        canView: true,
        canComment: canComment || false,
        canApprove: canApprove || []
      },
      expiresAt
    });

    const shareUrl = `${process.env.CLIENT_URL}/stakeholder/${token.token}`;
    res.status(201).json({ token, shareUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Public stakeholder view (no auth required) ───────────────────────────────
exports.viewByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const record = await StakeholderToken.findOne({ token, isActive: true })
      .populate('project');

    if (!record) return res.status(404).json({ message: 'Invalid or expired link' });
    if (new Date() > record.expiresAt) {
      return res.status(403).json({ message: 'This link has expired' });
    }

    // Log access
    record.lastAccessedAt = new Date();
    record.accessLog.push({ ip: req.ip });
    await record.save();

    const project = await Project.findById(record.project._id)
      .populate('owner', 'name department')
      .populate('members', 'name department')
      .populate('faculty', 'name');

    const tasks = await Task.find({ project: record.project._id })
      .populate('assignedTo', 'name')
      .select('title description status priority deadline stakeholderApproved');

    res.json({
      project,
      tasks,
      permissions: record.permissions,
      label: record.label,
      expiresAt: record.expiresAt
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Stakeholder approves a task ──────────────────────────────────────────────
exports.approveTask = async (req, res) => {
  try {
    const { token, taskId } = req.params;
    const record = await StakeholderToken.findOne({ token, isActive: true });

    if (!record) return res.status(404).json({ message: 'Invalid token' });
    if (new Date() > record.expiresAt) return res.status(403).json({ message: 'Link expired' });

    const canApprove = record.permissions.canApprove.map(id => id.toString());
    if (!canApprove.includes(taskId)) {
      return res.status(403).json({ message: 'Not authorized to approve this task' });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        stakeholderApproved: true,
        stakeholderApprovedBy: record.label,
        stakeholderApprovedAt: new Date()
      },
      { new: true }
    );

    res.json({ task, message: `Task approved by ${record.label}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── List tokens for a project ────────────────────────────────────────────────
exports.listTokens = async (req, res) => {
  try {
    const tokens = await StakeholderToken.find({ project: req.params.projectId })
      .select('-accessLog').sort('-createdAt');
    res.json(tokens);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Revoke token ─────────────────────────────────────────────────────────────
exports.revokeToken = async (req, res) => {
  try {
    await StakeholderToken.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Token revoked' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
