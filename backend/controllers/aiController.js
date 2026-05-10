const OpenAI = require('openai');
const Project = require('../models/Project');
const Task = require('../models/Task');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.suggestTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const existingTasks = await Task.find({ project: projectId }).select('title');
    const taskList = existingTasks.map(t => t.title).join(', ');

    const prompt = `You are an academic project management assistant. 
    Project: "${project.title}" (Type: ${project.type})
    Description: ${project.description}
    Existing tasks: ${taskList || 'none'}
    
    Suggest 5 specific, actionable tasks for this academic project. 
    Return as JSON array: [{"title": "...", "description": "...", "priority": "low|medium|high", "estimatedHours": number}]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.predictDeadlineRisk = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    const tasks = await Task.find({ project: projectId });

    if (!tasks.length) return res.json({ risk: 'low', message: 'No tasks yet', score: 0 });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
    const progress = Math.round((completed / total) * 100);

    const daysLeft = project.deadline
      ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Academic project risk analysis:
    - Total tasks: ${total}, Completed: ${completed}, In Progress: ${inProgress}, Overdue: ${overdue}
    - Progress: ${progress}%
    - Days until deadline: ${daysLeft ?? 'not set'}
    
    Analyze the risk of missing the deadline. Return JSON: 
    {"risk": "low|medium|high|critical", "score": 0-100, "message": "brief explanation", "recommendations": ["action1", "action2"]}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { risk: 'medium', score: 50, message: 'Unable to analyze' };

    res.json({ ...analysis, stats: { total, completed, inProgress, overdue, progress, daysLeft } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateDocument = async (req, res) => {
  try {
    const { projectId, docType } = req.body; // abstract | srs | report
    const project = await Project.findById(projectId).populate('owner', 'name');
    const tasks = await Task.find({ project: projectId });

    const taskSummary = tasks.map(t => `- ${t.title} (${t.status})`).join('\n');

    const prompts = {
      abstract: `Write a professional academic project abstract for:
        Title: ${project.title}
        Type: ${project.type}
        Description: ${project.description}
        Tasks: ${taskSummary}
        Write a 200-word abstract suitable for a university project report.`,

      srs: `Generate a Software Requirements Specification (SRS) outline for:
        Project: ${project.title}
        Description: ${project.description}
        Tasks: ${taskSummary}
        Include: Introduction, Scope, Functional Requirements, Non-Functional Requirements, Use Cases.`,

      report: `Generate a project progress report outline for:
        Project: ${project.title}
        Student: ${project.owner?.name}
        Tasks completed: ${tasks.filter(t => t.status === 'completed').length}/${tasks.length}
        Include: Executive Summary, Progress Overview, Completed Work, Pending Work, Challenges, Next Steps.`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompts[docType] || prompts.abstract }],
      temperature: 0.5,
      max_tokens: 1500
    });

    res.json({ document: response.choices[0].message.content, docType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.smartReminder = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('project', 'title');

    const daysLeft = task.deadline
      ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Write a friendly but urgent reminder message for a student about:
    Task: "${task.title}" in project "${task.project?.title}"
    Priority: ${task.priority}
    Days until deadline: ${daysLeft ?? 'no deadline set'}
    Status: ${task.status}
    Keep it under 50 words, motivating and actionable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    res.json({ reminder: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');

exports.adaptiveLearning = async (req, res) => {
  try {
    const userId = req.user._id;
    const submissions = await Submission.find({ student: userId, status: 'graded' })
      .populate('assignment', 'title points');
    const tasks = await Task.find({ assignedTo: userId });
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
    const avgGrade = submissions.length
      ? Math.round(submissions.reduce((s, sub) => s + ((sub.grade / (sub.assignment?.points || 100)) * 100), 0) / submissions.length)
      : null;

    const prompt = `You are an academic advisor AI. Analyze this student's performance:
- Completed tasks: ${completed}, Overdue tasks: ${overdue}
- Average grade: ${avgGrade ?? 'no grades yet'}%
- Total submissions: ${submissions.length}

Provide a personalized learning path. Return JSON:
{
  "strengths": ["..."],
  "weakAreas": ["..."],
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"],
  "studyPlan": [{"day": "Monday", "focus": "...", "duration": "2 hours"}],
  "motivationalMessage": "..."
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    const plan = match ? JSON.parse(match[0]) : {};
    res.json({ plan, stats: { completed, overdue, avgGrade, submissions: submissions.length } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.engagementHeatmap = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const logs = await ActivityLog.find({ user: userId }).sort('createdAt');

    // Build heatmap: { 'YYYY-MM-DD': count }
    const heatmap = {};
    logs.forEach(log => {
      const day = new Date(log.createdAt).toISOString().split('T')[0];
      heatmap[day] = (heatmap[day] || 0) + 1;
    });

    // Last 52 weeks
    const weeks = [];
    const now = new Date();
    for (let w = 51; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7) - (6 - d));
        const key = date.toISOString().split('T')[0];
        week.push({ date: key, count: heatmap[key] || 0 });
      }
      weeks.push(week);
    }

    res.json({ weeks, totalDays: Object.keys(heatmap).length, totalActions: logs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Feature 7: Auto-provision resources for a task ──────────────────────────
exports.provisionResources = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('project', 'title type');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const prompt = `You are an academic resource assistant. A student has a task:
Title: "${task.title}"
Description: "${task.description}"
Project type: ${task.project?.type}

Suggest 4 highly relevant academic resources. Return JSON array:
[{
  "title": "Resource title",
  "url": "https://...",
  "type": "article|dataset|paper|video|tool",
  "relevanceScore": 0-100,
  "reason": "why this is relevant"
}]

Use real, credible sources: Google Scholar, arXiv, GitHub, Kaggle, MDN, official docs, etc.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\[[\s\S]*\]/);
    const resources = match ? JSON.parse(match[0]) : [];

    // Save to task
    const updated = await Task.findByIdAndUpdate(
      req.params.taskId,
      { aiResources: resources.map(r => ({ ...r, pinnedAt: new Date() })) },
      { new: true }
    );

    res.json({ resources, task: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
