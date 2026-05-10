const StandupReport = require('../models/StandupReport');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ─── Submit standup ───────────────────────────────────────────────────────────
exports.submitStandup = async (req, res) => {
  try {
    const { projectId, answers } = req.body;
    const week = getWeekNumber();
    const year = new Date().getFullYear();

    // Snapshot board movement this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const tasks = await Task.find({
      project: projectId,
      assignedTo: req.user._id,
      updatedAt: { $gte: weekStart }
    });

    const snapshot = {
      tasksCompleted: tasks.filter(t => t.status === 'completed').length,
      tasksCreated: tasks.filter(t => new Date(t.createdAt) >= weekStart).length,
      tasksMovedToProgress: tasks.filter(t => t.status === 'in_progress').length,
      totalHoursLogged: tasks.reduce((sum, t) => {
        const weekEntries = (t.timeEntries || []).filter(e => new Date(e.startTime) >= weekStart);
        return sum + weekEntries.reduce((s, e) => s + (e.duration || 0), 0) / 60;
      }, 0)
    };

    const standup = await StandupReport.findOneAndUpdate(
      { project: projectId, student: req.user._id, week, year },
      { answers, boardMovementSnapshot: snapshot, submittedAt: new Date() },
      { upsert: true, new: true }
    );

    // Trigger AI analysis async
    generateAISummary(standup._id, answers, snapshot, req.user.name);

    res.status(201).json(standup);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── AI Summary generation ────────────────────────────────────────────────────
async function generateAISummary(standupId, answers, snapshot, studentName) {
  try {
    const prompt = `You are analyzing a student's weekly standup report for an academic project.

Student: ${studentName}
Standup Answers:
- What they did: "${answers.didLastWeek}"
- Next steps: "${answers.nextSteps}"  
- Blockers: "${answers.blockers}"

Actual Board Activity This Week:
- Tasks completed: ${snapshot.tasksCompleted}
- Tasks moved to in-progress: ${snapshot.tasksMovedToProgress}
- Hours logged: ${snapshot.totalHoursLogged.toFixed(1)}h

Analyze and return JSON:
{
  "summary": "2-3 sentence faculty-facing summary",
  "discrepancyFlags": ["flag if answers don't match board activity"],
  "sentimentScore": -1 to 1,
  "riskLevel": "low|medium|high",
  "recommendation": "one actionable suggestion for faculty"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      await StandupReport.findByIdAndUpdate(standupId, {
        aiSummary: result.summary,
        discrepancyFlags: result.discrepancyFlags || [],
        sentimentScore: result.sentimentScore || 0
      });
    }
  } catch (err) {
    console.error('Standup AI error:', err.message);
  }
}

// ─── Get standups for project (faculty view) ──────────────────────────────────
exports.getProjectStandups = async (req, res) => {
  try {
    const { week, year } = req.query;
    const query = { project: req.params.projectId };
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const standups = await StandupReport.find(query)
      .populate('student', 'name avatar department enrollmentId')
      .sort('-submittedAt');
    res.json(standups);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get my standups ──────────────────────────────────────────────────────────
exports.getMyStandups = async (req, res) => {
  try {
    const standups = await StandupReport.find({
      project: req.params.projectId,
      student: req.user._id
    }).sort('-submittedAt').limit(10);
    res.json(standups);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get current week standup prompt ─────────────────────────────────────────
exports.getWeeklyPrompt = async (req, res) => {
  try {
    const week = getWeekNumber();
    const year = new Date().getFullYear();
    const existing = await StandupReport.findOne({
      project: req.params.projectId,
      student: req.user._id,
      week, year
    });
    res.json({ week, year, submitted: !!existing, existing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
