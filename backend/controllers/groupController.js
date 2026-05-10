const GroupFormation = require('../models/GroupFormation');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── AI Group Formation (Feature 10) ─────────────────────────────────────────
exports.generateGroups = async (req, res) => {
  try {
    const { projectTitle, projectRequirements, studentPool, groupSize = 4 } = req.body;

    // Fetch students with their skills
    const students = await User.find({
      _id: { $in: studentPool },
      role: 'student'
    }).select('name skills preferredRoles availability department');

    if (students.length < groupSize) {
      return res.status(400).json({ message: `Need at least ${groupSize} students` });
    }

    const studentData = students.map(s => ({
      id: s._id.toString(),
      name: s.name,
      skills: s.skills?.map(sk => `${sk.name}(${sk.level})`).join(', ') || 'none listed',
      roles: s.preferredRoles?.join(', ') || 'flexible',
      availability: s.availability || 20,
      department: s.department
    }));

    const prompt = `You are forming balanced project groups for a university.

Project: "${projectTitle}"
Required skills: ${projectRequirements.map(r => `${r.count}x ${r.skill}(${r.level})`).join(', ')}
Group size: ${groupSize}

Students:
${studentData.map((s, i) => `${i + 1}. ${s.name} | Skills: ${s.skills} | Roles: ${s.roles} | Dept: ${s.department}`).join('\n')}

Form ${Math.floor(students.length / groupSize)} balanced groups. Each group should have diverse skills covering the requirements.

Return JSON:
{
  "groups": [["studentId1", "studentId2", ...], ...],
  "rationale": "explanation of grouping strategy",
  "skillCoverageScore": 0-100,
  "groupAnalysis": [{"groupIndex": 0, "strengths": "...", "gaps": "..."}]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : null;

    if (!result) return res.status(500).json({ message: 'AI failed to generate groups' });

    // Map IDs back to student objects
    const groupsWithStudents = result.groups.map(group =>
      group.map(id => students.find(s => s._id.toString() === id)).filter(Boolean)
    );

    const formation = await GroupFormation.create({
      requestedBy: req.user._id,
      projectTitle,
      projectRequirements,
      groupSize,
      studentPool,
      generatedGroups: result.groups,
      aiRationale: result.rationale,
      skillCoverageScore: result.skillCoverageScore || 0
    });

    res.status(201).json({
      formation,
      groupsWithStudents,
      rationale: result.rationale,
      skillCoverageScore: result.skillCoverageScore,
      groupAnalysis: result.groupAnalysis || []
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get formation result ─────────────────────────────────────────────────────
exports.getFormation = async (req, res) => {
  try {
    const formation = await GroupFormation.findById(req.params.id)
      .populate('requestedBy', 'name')
      .populate({ path: 'generatedGroups', populate: { path: 'students', model: 'User', select: 'name skills department' } });
    res.json(formation);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Update skills profile ────────────────────────────────────────────────────
exports.updateSkills = async (req, res) => {
  try {
    const { skills, preferredRoles, availability } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { skills, preferredRoles, availability },
      { new: true }
    );
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMySkills = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('skills preferredRoles availability');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
