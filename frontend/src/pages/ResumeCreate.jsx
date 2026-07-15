import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function ResumeCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setFieldErrors({ title: 'Resume title is required.' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/resumes', {
        title: title.trim(),
        description: description.trim(),
        content: {} // API automatically seeds with defaults
      });

      if (response?.success && response?.data?.id) {
        // Redirect directly to the editor for this new resume
        navigate(`/resumes/${response.data.id}`);
      } else {
        setError('Failed to create resume. Unexpected response from server.');
      }
    } catch (err) {
      console.error('Error creating resume:', err);
      if (err.code === 'VALIDATION_ERROR' && err.details) {
        const errorsObj = {};
        err.details.forEach((d) => {
          errorsObj[d.field] = d.issue;
        });
        setFieldErrors(errorsObj);
        setError('Please check the highlighted fields.');
      } else {
        setError(err.message || 'An error occurred while creating your resume. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Create Resume</h2>
              <p className="text-sm text-slate-400 mt-1">Start by defining basic details</p>
            </div>
            <Link
              to="/dashboard"
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="title">
                Resume Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors ${
                  fieldErrors.title ? 'border-red-500' : 'border-slate-800'
                }`}
                placeholder="e.g., Software Engineer - Python"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: null }));
                  }
                }}
                disabled={loading}
                required
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-400 mt-1.5">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="description">
                Short Description
              </label>
              <textarea
                id="description"
                rows="3"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="e.g., General resume focused on backend development positions."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Resume...
                </>
              ) : (
                'Create Resume'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
