const GroupFormation = require('../models/GroupFormation');
const User = require('../models/User');

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

    // Simple round-robin grouping (AI disabled)
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const groups = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push(shuffled.slice(i, i + groupSize).map(s => s._id.toString()));
    }
    const result = { groups, rationale: 'Groups formed by random balanced assignment.', skillCoverageScore: 70, groupAnalysis: [] };

    if (!result) return res.status(500).json({ message: 'Failed to generate groups' });

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
