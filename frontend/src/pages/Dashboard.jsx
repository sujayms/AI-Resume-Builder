import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all resumes on mount
  useEffect(() => {
    async function fetchResumes() {
      try {
        setLoading(true);
        const response = await api.get('/resumes');
        if (response?.success) {
          setResumes(response.data || []);
        } else {
          setError('Failed to fetch resumes.');
        }
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError(err.message || 'An error occurred while loading your resumes.');
      } finally {
        setLoading(false);
      }
    }
    fetchResumes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resume?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await api.delete(`/resumes/${id}`);
      if (response?.success) {
        setResumes((prev) => prev.filter((resume) => resume.id !== id));
      } else {
        alert('Failed to delete the resume.');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert(err.message || 'An error occurred while deleting the resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Create, edit, and manage your professional resumes.
            </p>
          </div>
          <Link
            to="/resumes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-650/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Resume
          </Link>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="mb-8 p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-850 hover:bg-red-800 text-white text-xs font-semibold rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{resumes.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Resumes</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Active</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-pink-600/10 text-pink-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {resumes.length > 0 ? formatDate(resumes[0].updatedAt) : 'No updates'}
                </div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Last Modified</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumes Grid / List */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-48 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="h-5 bg-slate-850 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-slate-850 rounded w-5/6 mb-2.5"></div>
                  <div className="h-4 bg-slate-850 rounded w-1/2"></div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-4">
                  <div className="h-4 bg-slate-850 rounded w-1/4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-850 rounded w-12"></div>
                    <div className="h-8 bg-slate-850 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto flex flex-col items-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No resumes found</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
              Create your very first resume to begin. You'll be able to fill in your personal details, summary, and technical skills.
            </p>
            <Link
              to="/resumes/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Create Resume
            </Link>
          </div>
        ) : (
          /* Resume Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-slate-900 hover:bg-slate-850/80 border border-slate-800/80 hover:border-slate-700/60 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {resume.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed h-10">
                    {resume.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-800/60 pt-4 mt-4 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">
                    Updated {formatDate(resume.updatedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/resumes/${resume.id}`)}
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                      className="p-1.5 bg-red-600/10 hover:bg-red-650 text-red-400 hover:text-white rounded-lg border border-red-800/20 hover:border-red-700/50 transition-colors flex items-center justify-center cursor-pointer"
                      title="Delete Resume"
                    >
                      {deletingId === resume.id ? (
                        <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
