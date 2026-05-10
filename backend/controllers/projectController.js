const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

exports.getProjects = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = {};
    if (role === 'student') query = { $or: [{ owner: _id }, { members: _id }] };
    else if (role === 'faculty') query = { faculty: _id };
    // admin sees all

    const { search, status, type } = req.query;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status) query.status = status;
    if (type) query.type = type;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('faculty', 'name email')
      .populate('members', 'name email avatar')
      .sort('-createdAt');

    // Attach live progress
    const withProgress = await Promise.all(projects.map(async (p) => {
      const tasks = await Task.find({ project: p._id });
      const done = tasks.filter(t => t.status === 'completed').length;
      const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      return { ...p.toObject(), progress, taskCount: tasks.length };
    }));

    res.json(withProgress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('faculty', 'name email avatar')
      .populate('members', 'name email avatar role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, type, deadline, tags, facultyId, members } = req.body;
    const project = await Project.create({
      title, description, type, deadline, tags,
      owner: req.user._id,
      faculty: facultyId,
      members: members || []
    });

    await ActivityLog.create({
      user: req.user._id, action: 'created project',
      entity: 'project', entityId: project._id, details: title
    });

    if (facultyId) {
      await Notification.create({
        recipient: facultyId,
        type: 'system',
        title: 'New Project Assigned',
        message: `${req.user.name} created project "${title}" and assigned you as supervisor.`,
        link: `/projects/${project._id}`
      });
    }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const { status, feedback } = req.body; // approved | rejected | revision_needed
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status },
      { new: true }
    ).populate('owner', 'name');

    await Notification.create({
      recipient: project.owner._id,
      type: 'approval',
      title: `Project ${status}`,
      message: `Your project "${project.title}" has been ${status}. ${feedback || ''}`,
      link: `/projects/${project._id}`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileData = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { files: fileData } },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
