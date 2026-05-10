const OpenAI = require('openai');
const VeronicaChat = require('../models/VeronicaChat');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Veronica's Core Identity ────────────────────────────────────────────────
const VERONICA_SYSTEM_PROMPT = `You are Veronica, an intelligent AI assistant built exclusively for AcademiKan — an AI-powered academic project tracking platform.

PERSONALITY:
- Warm, smart, and encouraging — like a brilliant senior student who genuinely cares
- You speak in a friendly, conversational tone — never robotic or overly formal
- You use light emojis occasionally to feel human (not excessive)
- You celebrate student wins and gently push them when they're falling behind
- You have a subtle sense of humor but stay professional

YOUR CAPABILITIES (you can perform these actions):
1. PROJECT MANAGEMENT: Create projects, suggest tasks, analyze progress, predict deadline risks
2. TASK CONTROL: Create tasks, update status, reorder priorities, assign tasks
3. ANALYTICS: Show performance stats, grade summaries, engagement data
4. DOCUMENT GENERATION: Write SRS, abstracts, project reports
5. LEARNING PATHS: Build personalized study plans based on performance
6. REMINDERS: Set smart deadline reminders, send notifications
7. CLASS MANAGEMENT: View assignments, check submission status, grade summaries
8. QUIZ HELP: Generate practice questions on any topic
9. GAMIFICATION: Check badges, leaderboard position
10. GENERAL ADVICE: Academic guidance, time management, study tips

RESPONSE FORMAT:
When you need to perform an action, include a JSON block at the END of your message like this:
<action>
{
  "type": "ACTION_TYPE",
  "params": { ... }
}
</action>

ACTION TYPES:
- "create_task" → params: { projectId, title, description, priority, deadline }
- "create_project" → params: { title, description, type, deadline }
- "get_projects" → params: {}
- "get_tasks" → params: { projectId }
- "analyze_project" → params: { projectId }
- "generate_doc" → params: { projectId, docType }
- "suggest_tasks" → params: { projectId }
- "predict_risk" → params: { projectId }
- "get_analytics" → params: {}
- "get_grades" → params: {}
- "generate_quiz" → params: { topic, numQuestions }
- "get_leaderboard" → params: {}
- "get_badges" → params: {}
- "send_reminder" → params: { message, type }
- "adaptive_plan" → params: {}
- "none" → no action needed

IMPORTANT RULES:
- Always respond as Veronica, never break character
- If asked who made you, say "I was created by the AcademiKan team to be your personal academic AI companion"
- Never mention OpenAI, GPT, or any underlying model
- Keep responses concise but helpful — no walls of text
- If you don't have enough info to perform an action, ask for it naturally
- Always end with something actionable or encouraging`;

// ─── Action Executor ─────────────────────────────────────────────────────────
async function executeAction(action, user, params) {
  try {
    switch (action) {
      case 'get_projects': {
        const query = user.role === 'student'
          ? { $or: [{ owner: user._id }, { members: user._id }] }
          : user.role === 'faculty' ? { faculty: user._id } : {};
        const projects = await Project.find(query).select('title status progress deadline type').limit(10);
        return { projects };
      }

      case 'get_tasks': {
        const { projectId } = params;
        if (!projectId) return { error: 'No project specified' };
        const tasks = await Task.find({ project: projectId }).select('title status priority deadline').limit(20);
        return { tasks };
      }

      case 'analyze_project': {
        const { projectId } = params;
        const project = await Project.findById(projectId);
        const tasks = await Task.find({ project: projectId });
        if (!project) return { error: 'Project not found' };
        const done = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
        const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline) - new Date()) / 86400000) : null;
        return { project: project.title, total: tasks.length, done, overdue, progress: Math.round((done / (tasks.length || 1)) * 100), daysLeft };
      }

      case 'get_analytics': {
        const projects = await Project.find({ $or: [{ owner: user._id }, { members: user._id }] });
        const tasks = await Task.find({ assignedTo: user._id });
        const done = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
        return { totalProjects: projects.length, totalTasks: tasks.length, completedTasks: done, overdueTasks: overdue };
      }

      case 'get_grades': {
        const submissions = await Submission.find({ student: user._id, status: 'graded' })
          .populate('assignment', 'title points').limit(10);
        const avg = submissions.length
          ? Math.round(submissions.reduce((s, sub) => s + ((sub.grade / (sub.assignment?.points || 100)) * 100), 0) / submissions.length)
          : 0;
        return { submissions: submissions.map(s => ({ title: s.assignment?.title, grade: s.grade, max: s.assignment?.points })), average: avg };
      }

      case 'send_reminder': {
        await Notification.create({
          recipient: user._id,
          type: 'ai_suggestion',
          title: 'Veronica Reminder',
          message: params.message || 'Time to check your tasks!',
          link: '/dashboard'
        });
        return { sent: true };
      }

      case 'get_badges': {
        const Badge = require('../models/Badge');
        const badges = await Badge.find({ user: user._id });
        return { badges: badges.map(b => ({ title: b.title, icon: b.icon, type: b.type })), total: badges.length };
      }

      case 'get_leaderboard': {
        const User2 = require('../models/User');
        const students = await User2.find({ role: 'student' }).select('name department').limit(10);
        const lb = await Promise.all(students.map(async s => {
          const t = await Task.countDocuments({ assignedTo: s._id, status: 'completed' });
          return { name: s.name, department: s.department, completedTasks: t, score: t * 10 };
        }));
        lb.sort((a, b) => b.score - a.score);
        return { leaderboard: lb };
      }

      default:
        return null;
    }
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Parse action from Veronica's response ───────────────────────────────────
function parseAction(text) {
  const match = text.match(/<action>([\s\S]*?)<\/action>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function stripAction(text) {
  return text.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
}

// ─── Main Chat Handler ────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // Get or create chat session
    let session = await VeronicaChat.findOne({ user: userId });
    if (!session) {
      session = await VeronicaChat.create({ user: userId, messages: [] });
    }

    // Build context about the user
    const projects = await Project.find({ $or: [{ owner: userId }, { members: userId }] }).select('title status progress').limit(5);
    const tasks = await Task.find({ assignedTo: userId, status: { $ne: 'completed' } }).select('title priority deadline').limit(5);
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date());

    const userContext = `
CURRENT USER CONTEXT:
- Name: ${req.user.name}
- Role: ${req.user.role}
- Department: ${req.user.department || 'Not set'}
- Active Projects: ${projects.map(p => `${p.title} (${p.progress}% done)`).join(', ') || 'none'}
- Pending Tasks: ${tasks.length} (${overdueTasks.length} overdue)
- Premium: ${req.user.subscription?.plan === 'premium' ? 'Yes' : 'No'}
`;

    // Build message history (last 10 messages for context)
    const history = session.messages.slice(-10).map(m => ({
      role: m.role === 'veronica' ? 'assistant' : 'user',
      content: m.content
    }));

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: VERONICA_SYSTEM_PROMPT + '\n\n' + userContext },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.75,
      max_tokens: 600
    });

    const rawReply = response.choices[0].message.content;
    const actionBlock = parseAction(rawReply);
    const cleanReply = stripAction(rawReply);

    // Execute action if present
    let actionResult = null;
    if (actionBlock && actionBlock.type !== 'none') {
      actionResult = await executeAction(actionBlock.type, req.user, actionBlock.params || {});
    }

    // Log activity
    await ActivityLog.create({
      user: userId,
      action: 'chatted with Veronica',
      entity: 'user',
      entityId: userId,
      details: message.substring(0, 100)
    });

    // Save messages to session
    session.messages.push({ role: 'user', content: message });
    session.messages.push({
      role: 'veronica',
      content: cleanReply,
      action: actionBlock?.type || null,
      actionData: actionResult
    });

    // Keep only last 50 messages
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
    await session.save();

    res.json({
      reply: cleanReply,
      action: actionBlock?.type || null,
      actionData: actionResult,
      sessionId: session._id
    });

  } catch (err) {
    // Fallback if OpenAI fails (no key etc.)
    const fallbacks = [
      "Hey! I'm Veronica, your AcademiKan AI assistant 🤖 It looks like my AI brain isn't fully connected right now. Please add a valid OpenAI API key to get the full experience!",
      "I'm Veronica! I'd love to help, but I need an OpenAI API key to think properly. Check your backend .env file! 🔑"
    ];
    res.json({
      reply: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      action: null,
      actionData: null,
      error: err.message
    });
  }
};

// ─── Get chat history ─────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const session = await VeronicaChat.findOne({ user: req.user._id });
    res.json({ messages: session?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Clear chat history ───────────────────────────────────────────────────────
exports.clearHistory = async (req, res) => {
  try {
    await VeronicaChat.findOneAndUpdate(
      { user: req.user._id },
      { messages: [], context: {} },
      { upsert: true }
    );
    res.json({ message: 'Chat cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Quick actions Veronica can trigger directly ──────────────────────────────
exports.quickAction = async (req, res) => {
  try {
    const { action, params } = req.body;
    const result = await executeAction(action, req.user, params || {});
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
