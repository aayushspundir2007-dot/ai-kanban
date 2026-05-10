import { useEffect, useState } from 'react';
import { portfolioAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    Promise.all([
      portfolioAPI.getMy(),
      projectAPI.getAll({ status: 'completed' })
    ]).then(([p, pr]) => {
      setPortfolios(p.data);
      setProjects(pr.data.filter(p => p.progress === 100));
    }).finally(() => setLoading(false));
  }, []);

  const generate = async (projectId) => {
    setGenerating(projectId);
    try {
      const { data } = await portfolioAPI.generate(projectId);
      setPortfolios(prev => {
        const exists = prev.find(p => p.project?._id === projectId);
        return exists ? prev.map(p => p.project?._id === projectId ? data.portfolio : p) : [data.portfolio, ...prev];
      });
      toast.success('Portfolio generated!');
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share URL copied to clipboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally { setGenerating(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Portfolio</h1>
        <p className="text-gray-500 text-sm mt-1">AI-generated professional summaries of your completed projects</p>
      </div>

      {/* Eligible projects */}
      {projects.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Generate Portfolio</h2>
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.type} · 100% complete</p>
                </div>
                <button onClick={() => generate(p._id)} disabled={generating === p._id} className="btn-primary text-sm">
                  <SparklesIcon className="w-4 h-4" />
                  {generating === p._id ? 'Generating...' : 'Generate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing portfolios */}
      {portfolios.length === 0 ? (
        <div className="card p-12 text-center">
          <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No portfolios yet. Complete a project to generate one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {portfolios.map(p => (
            <div key={p._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{p.project?.type}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/portfolio/${p.publicSlug}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3">
                    <EyeIcon className="w-3.5 h-3.5" /> View
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/portfolio/${p.publicSlug}`); toast.success('Copied!'); }}
                    className="btn-secondary text-xs py-1.5 px-3">
                    <ShareIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-3">{p.aiGeneratedSummary}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {p.skills?.slice(0, 5).map(s => (
                  <span key={s} className="badge bg-primary-50 text-primary-700">{s}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{p.contributions?.length} contributions</span>
                <span>{p.views} views</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
