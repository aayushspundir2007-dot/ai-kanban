const ContributionMatrix = require('../models/ContributionMatrix');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

// ─── Calculate contribution for all members ───────────────────────────────────
exports.calculateContribution = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members owner');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const allMembers = [project.owner, ...project.members].filter(Boolean);
    const allTasks = await Task.find({ project: projectId });
    const results = [];

    for (const member of allMembers) {
      const memberId = member._id || member;

      const created = allTasks.filter(t => t.createdBy?.toString() === memberId.toString());
      const completed = allTasks.filter(t =>
        t.assignedTo?.toString() === memberId.toString() && t.status === 'completed'
      );
      const assigned = allTasks.filter(t => t.assignedTo?.toString() === memberId.toString());

      const totalHours = assigned.reduce((sum, t) => {
        const myEntries = (t.timeEntries || []).filter(e => e.user?.toString() === memberId.toString());
        return sum + myEntries.reduce((s, e) => s + (e.duration || 0) / 60, 0);
      }, 0);

      const deliverables = assigned.reduce((sum, t) =>
        sum + (t.deliverables || []).filter(d => d.uploadedBy?.toString() === memberId.toString()).length, 0
      );

      const comments = await Comment.countDocuments({ author: memberId, project: projectId });

      const blockerResolutions = allTasks.filter(t =>
        t.blockerResolvedAt &&
        t.statusHistory?.some(h => h.changedBy?.toString() === memberId.toString() && h.status === 'in_progress')
      ).length;

      const avgVelocity = completed.length > 0
        ? completed.reduce((sum, t) => {
          const inProgressTime = (t.statusHistory || [])
            .filter(h => h.status === 'in_progress')
            .reduce((s, h) => s + (h.timeInPreviousStatus || 0), 0);
          return sum + inProgressTime;
        }, 0) / completed.length / 60
        : 0;

      const onTime = completed.filter(t => !t.deadline || new Date(t.deadline) >= new Date(t.updatedAt)).length;
      const anomalyFlags = assigned.reduce((sum, t) =>
        sum + (t.deliverables || []).filter(d => d.anomalyScore >= 50).length, 0
      );

      const metrics = {
        cardsCreated: created.length,
        cardsCompleted: completed.length,
        avgMoveVelocity: Math.round(avgVelocity * 10) / 10,
        totalHoursLogged: Math.round(totalHours * 10) / 10,
        deliverablesUploaded: deliverables,
        commentsMade: comments,
        blockerResolutions,
        onTimeDeliveries: onTime,
        anomalyFlags
      };

      // Score calculation (weighted)
      const score = Math.min(100, Math.round(
        (completed.length * 15) +
        (created.length * 5) +
        (Math.min(totalHours, 20) * 2) +
        (deliverables * 8) +
        (comments * 2) +
        (blockerResolutions * 10) +
        (onTime * 5) -
        (anomalyFlags * 15)
      ));

      results.push({ memberId, metrics, score });
    }

    // Calculate percentage of team
    const totalScore = results.reduce((s, r) => s + r.score, 0) || 1;

    // AI justification
    const summaryPrompt = `Generate a contribution analysis for an academic project team.
Members and scores: ${results.map(r => `Member score: ${r.score}/100, completed: ${r.metrics.cardsCompleted} tasks, hours: ${r.metrics.totalHoursLogged}h`).join('; ')}

Return JSON array: [{"grade": "A|B|C|D|F", "justification": "2 sentence explanation"}] — one per member in same order.`;

    let grades = results.map(() => ({ grade: 'B', justification: 'Contribution calculated from task metrics.' }));
    try {
      // AI grading disabled
    } catch { /* use defaults */ }

    // Save to DB
    const saved = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const g = grades[i] || grades[0];
      const entry = await ContributionMatrix.findOneAndUpdate(
        { project: projectId, student: r.memberId },
        {
          metrics: r.metrics,
          contributionScore: r.score,
          percentageOfTeam: Math.round((r.score / totalScore) * 100),
          suggestedGrade: g.grade,
          aiJustification: g.justification,
          lastCalculatedAt: new Date()
        },
        { upsert: true, new: true }
      ).populate('student', 'name avatar department enrollmentId');
      saved.push(entry);
    }

    res.json(saved);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get contribution matrix ──────────────────────────────────────────────────
exports.getContribution = async (req, res) => {
  try {
    const matrix = await ContributionMatrix.find({ project: req.params.projectId })
      .populate('student', 'name avatar department enrollmentId');
    res.json(matrix);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
