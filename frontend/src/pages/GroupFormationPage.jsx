import { useEffect, useState } from 'react';
import { groupAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const SKILL_CATEGORIES = ['technical', 'research', 'design', 'communication', 'management'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'expert'];

export default function GroupFormationPage() {
  const { user } = useAuth();
  const [mySkills, setMySkills] = useState({ skills: [], preferredRoles: [], availability: 20 });
  const [students, setStudents] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [form, setForm] = useState({
    projectTitle: '',
    groupSize: 4,
    requirements: [{ skill: '', level: 'intermediate', count: 1 }],
    studentPool: []
  });

  useEffect(() => {
    groupAPI.getMySkills().then(({ data }) => {
      setMySkills({ skills: data.skills || [], preferredRoles: data.preferredRoles || [], availability: data.availability || 20 });
    }).finally(() => setSkillsLoading(false));

    if (user.role === 'faculty' || user.role === 'admin') {
      userAPI.getAll({ role: 'student' }).then(({ data }) => setStudents(data));
    }
  }, []);

  const saveSkills = async () => {
    try {
      await groupAPI.updateSkills(mySkills);
      toast.success('Skills updated!');
    } catch { toast.error('Failed to save'); }
  };

  const addSkill = () => setMySkills(prev => ({ ...prev, skills: [...prev.skills, { name: '', category: 'technical', level: 'beginner' }] }));
  const removeSkill = (i) => setMySkills(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));
  const updateSkill = (i, field, val) => setMySkills(prev => ({
    ...prev, skills: prev.skills.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
  }));

  const addRequirement = () => setForm(prev => ({ ...prev, requirements: [...prev.requirements, { skill: '', level: 'intermediate', count: 1 }] }));
  const removeReq = (i) => setForm(prev => ({ ...prev, requirements: prev.requirements.filter((_, idx) => idx !== i) }));

  const generateGroups = async () => {
    if (!form.projectTitle) return toast.error('Enter project title');
    if (form.studentPool.length < form.groupSize) return toast.error(`Select at least ${form.groupSize} students`);
    setLoading(true);
    try {
      const { data } = await groupAPI.generate({
        projectTitle: form.projectTitle,
        projectRequirements: form.requirements,
        studentPool: form.studentPool,
        groupSize: form.groupSize
      });
      setResult(data);
      toast.success('Groups generated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const groupColors = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200', 'bg-yellow-50 border-yellow-200', 'bg-pink-50 border-pink-200'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skills & Group Formation</h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered balanced team formation</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Skills Profile */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">My Skills Profile</h2>
          {skillsLoading ? <div className="animate-pulse h-20 bg-gray-100 rounded" /> : (
            <div className="space-y-4">
              <div className="space-y-2">
                {mySkills.skills.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className="input flex-1" placeholder="Skill name" value={s.name}
                      onChange={e => updateSkill(i, 'name', e.target.value)} />
                    <select className="input w-28" value={s.category} onChange={e => updateSkill(i, 'category', e.target.value)}>
                      {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="input w-28" value={s.level} onChange={e => updateSkill(i, 'level', e.target.value)}>
                      {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={() => removeSkill(i)} className="btn-ghost text-red-400 p-1.5">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addSkill} className="btn-secondary text-sm w-full justify-center">
                <PlusIcon className="w-4 h-4" /> Add Skill
              </button>
              <div>
                <label className="label">Availability (hours/week)</label>
                <input type="number" className="input" value={mySkills.availability} min={1} max={40}
                  onChange={e => setMySkills(prev => ({ ...prev, availability: parseInt(e.target.value) }))} />
              </div>
              <button onClick={saveSkills} className="btn-primary w-full justify-center">Save Skills</button>
            </div>
          )}
        </div>

        {/* Group Formation (Faculty only) */}
        {(user.role === 'faculty' || user.role === 'admin') && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-yellow-500" /> AI Group Formation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Project Title</label>
                <input className="input" placeholder="e.g. Smart Campus IoT System" value={form.projectTitle}
                  onChange={e => setForm({ ...form, projectTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">Group Size</label>
                <input type="number" className="input" value={form.groupSize} min={2} max={8}
                  onChange={e => setForm({ ...form, groupSize: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="label">Required Skills</label>
                <div className="space-y-2">
                  {form.requirements.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input flex-1" placeholder="Skill" value={r.skill}
                        onChange={e => setForm(prev => ({ ...prev, requirements: prev.requirements.map((x, idx) => idx === i ? { ...x, skill: e.target.value } : x) }))} />
                      <select className="input w-28" value={r.level}
                        onChange={e => setForm(prev => ({ ...prev, requirements: prev.requirements.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x) }))}>
                        {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <input type="number" className="input w-16" value={r.count} min={1}
                        onChange={e => setForm(prev => ({ ...prev, requirements: prev.requirements.map((x, idx) => idx === i ? { ...x, count: parseInt(e.target.value) } : x) }))} />
                      <button onClick={() => removeReq(i)} className="btn-ghost text-red-400 p-1.5"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addRequirement} className="btn-secondary text-sm w-full justify-center">
                    <PlusIcon className="w-4 h-4" /> Add Requirement
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Select Students ({form.studentPool.length} selected)</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {students.map(s => (
                    <label key={s._id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={form.studentPool.includes(s._id)}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          studentPool: e.target.checked ? [...prev.studentPool, s._id] : prev.studentPool.filter(id => id !== s._id)
                        }))} />
                      <span className="text-sm">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.department}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={generateGroups} disabled={loading} className="btn-primary w-full justify-center">
                <SparklesIcon className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Balanced Groups'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="card p-4 bg-green-50 border border-green-200">
            <p className="font-semibold text-green-800">Groups Generated — Skill Coverage: {result.skillCoverageScore}%</p>
            <p className="text-sm text-green-700 mt-1">{result.rationale}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.groupsWithStudents?.map((group, i) => (
              <div key={i} className={`card p-4 border ${groupColors[i % groupColors.length]}`}>
                <h3 className="font-semibold text-gray-900 mb-3">Group {i + 1}</h3>
                <div className="space-y-2">
                  {group.map(s => s && (
                    <div key={s._id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.skills?.slice(0, 2).map(sk => sk.name).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {result.groupAnalysis?.[i] && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                    <p>✅ {result.groupAnalysis[i].strengths}</p>
                    {result.groupAnalysis[i].gaps && <p className="text-orange-600 mt-1">⚠️ {result.groupAnalysis[i].gaps}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
