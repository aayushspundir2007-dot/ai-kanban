const Project = require('../models/Project');
const Task = require('../models/Task');
const StandupReport = require('../models/StandupReport');
const Comment = require('../models/Comment');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Calculate Project Health Score (Feature 6) ───────────────────────────────
exports.getHealthScore = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    const tasks = await Task.find({ project: projectId });

    if (!tasks.length) {
      return res.json({ healthScore: 100, breakdown: {}, risks: [], recommendation: 'Add tasks to start tracking health.' });
    }

    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed').length;

    // Task velocity: tasks completed per week
    const oneWeekAgo = new Date(now - 7 * 86400000);
    const recentlyCompleted = tasks.filter(t =>
      t.status === 'completed' && new Date(t.updatedAt) >= oneWeekAgo
    ).length;
    const velocityScore = Math.min(100, recentlyCompleted * 20);

    // Blocker resolution time
    const resolvedBlockers = tasks.filter(t => t.blockerResolvedAt && t.blockerReportedAt);
    const avgBlockerTime = resolvedBlockers.length
      ? resolvedBlockers.reduce((sum, t) =>
        sum + (new Date(t.blockerResolvedAt) - new Date(t.blockerReportedAt)) / 3600000, 0
      ) / resolvedBlockers.length
      : 0;
    const blockerScore = Math.max(0, 100 - (avgBlockerTime * 5) - (blocked * 15));

    // Communication score (standup submissions)
    const memberCount = (project.members?.length || 0) + 1;
    const recentStandups = await StandupReport.countDocuments({
      project: projectId,
      submittedAt: { $gte: oneWeekAgo }
    });
    const communicationScore = Math.min(100, (recentStandups / memberCount) * 100);

    // On-time rate
    const withDeadlines = tasks.filter(t => t.deadline);
    const onTime = withDeadlines.filter(t =>
      t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)
    ).length;
    const onTimeRate = withDeadlines.length ? Math.round((onTime / withDeadlines.length) * 100) : 100;

    // Deadline proximity penalty
    const daysLeft = project.deadline
      ? Math.ceil((new Date(project.deadline) - now) / 86400000)
      : 999;
    const progressExpected = daysLeft < 0 ? 100 : Math.max(0, 100 - (daysLeft / 30) * 100);
    const progressActual = Math.round((completed / total) * 100);
    const progressGap = Math.max(0, progressExpected - progressActual);

    // Composite health score
    const healthScore = Math.max(0, Math.round(
      (velocityScore * 0.25) +
      (blockerScore * 0.25) +
      (communicationScore * 0.20) +
      (onTimeRate * 0.20) -
      (overdue * 5) -
      (progressGap * 0.3)
    ));

    const breakdown = {
      taskVelocity: Math.round(velocityScore),
      blockerResolutionTime: Math.round(blockerScore),
      communicationScore: Math.round(communicationScore),
      onTimeRate
    };

    // AI risk analysis
    const risks = [];
    if (blocked > 0) risks.push({ level: 'high', message: `${blocked} task(s) currently blocked` });
    if (overdue > 0) risks.push({ level: 'high', message: `${overdue} task(s) overdue` });
    if (communicationScore < 50) risks.push({ level: 'medium', message: 'Low standup participation this week' });
    if (progressGap > 20) risks.push({ level: 'medium', message: `Project is ${Math.round(progressGap)}% behind expected progress` });
    if (velocityScore < 30) risks.push({ level: 'low', message: 'Task completion velocity is slow' });

    // Save to project
    await Project.findByIdAndUpdate(projectId, {
      healthScore,
      healthBreakdown: breakdown,
      $push: { healthHistory: { score: healthScore, calculatedAt: new Date() } }
    });

    res.json({ healthScore, breakdown, risks, stats: { total, completed, blocked, overdue, daysLeft, progressGap } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get burndown chart data (Feature 3) ─────────────────────────────────────
exports.getBurndown = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    const tasks = await Task.find({ project: projectId });

    if (!project.deadline) return res.json({ data: [], message: 'No deadline set' });

    const start = new Date(project.createdAt);
    const end = new Date(project.deadline);
    const totalDays = Math.ceil((end - start) / 86400000);
    const totalPoints = tasks.reduce((s, t) => s + (t.storyPoints || 1), 0);

    const data = [];
    for (let d = 0; d <= Math.min(totalDays, 60); d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);

      const completedByDate = tasks.filter(t =>
        t.status === 'completed' && new Date(t.updatedAt) <= date
      ).reduce((s, t) => s + (t.storyPoints || 1), 0);

      const planned = Math.round(totalPoints - (totalPoints / totalDays) * d);
      const actual = totalPoints - completedByDate;

      data.push({
        date: date.toISOString().split('T')[0],
        planned: Math.max(0, planned),
        actual: Math.max(0, actual),
        completed: completedByDate
      });
    }

    res.json({ data, totalPoints, totalDays });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
