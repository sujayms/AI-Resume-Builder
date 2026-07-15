import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading, saving, error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Content sub-states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');

  // Fetch resume data on mount
  useEffect(() => {
    async function fetchResume() {
      try {
        setLoading(true);
        const response = await api.get(`/resumes/${id}`);
        if (response?.success && response?.data) {
          const { title, description, content } = response.data;
          setTitle(title || '');
          setDescription(description || '');
          
          // Seed content fields
          setFullName(content?.fullName || '');
          setEmail(content?.email || '');
          setPhone(content?.phone || '');
          setSummary(content?.summary || '');
          setSkills(content?.skills || '');
        } else {
          setError('Failed to load resume details.');
        }
      } catch (err) {
        console.error('Error fetching resume:', err);
        setError(err.message || 'An error occurred while loading the resume.');
      } finally {
        setLoading(false);
      }
    }
    fetchResume();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setFieldErrors({});

    // Client-side title validation
    if (!title.trim()) {
      setFieldErrors({ title: 'Resume title is required.' });
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/resumes/${id}`, {
        title: title.trim(),
        description: description.trim(),
        content: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          summary: summary.trim(),
          skills: skills.trim()
        }
      });

      if (response?.success) {
        setSuccessMsg('Resume saved successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMsg(null);
        }, 3000);
      } else {
        setError('Failed to save resume changes.');
      }
    } catch (err) {
      console.error('Error saving resume:', err);
      if (err.code === 'VALIDATION_ERROR' && err.details) {
        const errorsObj = {};
        err.details.forEach((d) => {
          errorsObj[d.field] = d.issue;
        });
        setFieldErrors(errorsObj);
        setError('Please check the highlighted fields.');
      } else {
        setError(err.message || 'An error occurred while saving your changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Editor Subheader */}
      <div className="bg-slate-900 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h2 className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Editing Resume</h2>
              <h1 className="text-xl font-bold text-white tracking-tight line-clamp-1">
                {title || 'Loading...'}
              </h1>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-650/10 transition-colors cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-sm text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          /* Editor Loading Skeleton */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse space-y-6">
              <div className="h-6 bg-slate-850 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-850 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-850 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-850 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-850 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse space-y-6">
              <div className="h-6 bg-slate-850 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-850 rounded w-1/3"></div>
                <div className="h-28 bg-slate-850 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* 1. Resume Settings Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                Resume Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="resume-title">
                    Resume Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="resume-title"
                    type="text"
                    className={`w-full px-4 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors ${
                      fieldErrors.title ? 'border-red-500' : 'border-slate-800'
                    }`}
                    placeholder="e.g., Software Engineer Resume"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) {
                        setFieldErrors((prev) => ({ ...prev, title: null }));
                      }
                    }}
                    disabled={saving}
                    required
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-400 mt-1.5">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="resume-desc">
                    Dashboard Description
                  </label>
                  <input
                    id="resume-desc"
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g., Primary resume for frontend developer roles"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* 2. Personal Information Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="email">
                    Contact Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* 3. Professional Summary Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                Professional Summary
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="summary">
                  Summary Text
                </label>
                <textarea
                  id="summary"
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  placeholder="Describe your career goals, primary skills, and accomplishments..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* 4. Skills Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                Key Skills
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="skills">
                  Technical or Professional Skills
                </label>
                <input
                  id="skills"
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g., React, Node.js, Python, Project Management, SQL (separated by commas)"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  disabled={saving}
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  Tip: Separate individual skills with a comma (e.g. Python, SQL, JavaScript).
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-800/40">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-650/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  'Save Resume'
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
