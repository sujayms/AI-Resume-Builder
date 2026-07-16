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
  const [experience, setExperience] = useState('');
  const [originalSummaryForComparison, setOriginalSummaryForComparison] = useState('');

  // AI suggestion, loading, and error states
  const [aiSuggestions, setAiSuggestions] = useState({
    summary: null,
    experience: null
  });
  const [aiLoading, setAiLoading] = useState({
    summary: false,
    experience: false,
    grammar_summary: false,
    grammar_experience: false
  });
  const [aiErrors, setAiErrors] = useState({
    summary: null,
    experience: null
  });

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
          setExperience(content?.experience || '');
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
          skills: skills.trim(),
          experience: experience.trim()
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

  const handleImproveSummary = async () => {
    if (!summary.trim()) return;
    
    setAiLoading(prev => ({ ...prev, summary: true }));
    setAiErrors(prev => ({ ...prev, summary: null }));
    setAiSuggestions(prev => ({ ...prev, summary: null }));
    setOriginalSummaryForComparison(summary.trim());
    
    try {
      const response = await api.post('/ai/improve-summary', { summary: summary.trim() });
      if (response?.success && response?.data?.improved) {
        setAiSuggestions(prev => ({ ...prev, summary: response.data.improved }));
      } else {
        setAiErrors(prev => ({ ...prev, summary: 'Failed to generate summary suggestion.' }));
      }
    } catch (err) {
      console.error('Error improving summary:', err);
      setAiErrors(prev => ({ ...prev, summary: err.message || 'An error occurred while improving summary.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const handleImproveExperience = async () => {
    if (!experience.trim()) return;
    
    setAiLoading(prev => ({ ...prev, experience: true }));
    setAiErrors(prev => ({ ...prev, experience: null }));
    setAiSuggestions(prev => ({ ...prev, experience: null }));
    
    try {
      const response = await api.post('/ai/improve-experience', { experience: experience.trim() });
      if (response?.success && response?.data?.improved) {
        setAiSuggestions(prev => ({ ...prev, experience: response.data.improved }));
      } else {
        setAiErrors(prev => ({ ...prev, experience: 'Failed to generate experience suggestion.' }));
      }
    } catch (err) {
      console.error('Error improving experience:', err);
      setAiErrors(prev => ({ ...prev, experience: err.message || 'An error occurred while improving experience.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, experience: false }));
    }
  };

  const handleFixGrammar = async (field, currentValue, setter) => {
    if (!currentValue.trim()) return;
    
    const loadingKey = `grammar_${field}`;
    setAiLoading(prev => ({ ...prev, [loadingKey]: true }));
    setAiErrors(prev => ({ ...prev, [field]: null }));
    setAiSuggestions(prev => ({ ...prev, [field]: null }));
    
    try {
      const response = await api.post('/ai/grammar', { text: currentValue.trim() });
      if (response?.success && response?.data?.improved) {
        setAiSuggestions(prev => ({ ...prev, [field]: response.data.improved }));
      } else {
        setAiErrors(prev => ({ ...prev, [field]: 'Failed to check grammar.' }));
      }
    } catch (err) {
      console.error('Error checking grammar:', err);
      setAiErrors(prev => ({ ...prev, [field]: err.message || 'An error occurred during grammar check.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleAcceptSuggestion = (field, setter) => {
    if (aiSuggestions[field]) {
      setter(aiSuggestions[field]);
      setAiSuggestions(prev => ({ ...prev, [field]: null }));
      if (field === 'summary') {
        setOriginalSummaryForComparison('');
      }
    }
  };

  const handleDiscardSuggestion = (field) => {
    setAiSuggestions(prev => ({ ...prev, [field]: null }));
    setAiErrors(prev => ({ ...prev, [field]: null }));
    if (field === 'summary') {
      setOriginalSummaryForComparison('');
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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  Professional Summary
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleImproveSummary()}
                    disabled={aiLoading.summary || !summary.trim() || saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 hover:text-indigo-200 border border-indigo-800/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {aiLoading.summary ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
                        Improving...
                      </>
                    ) : (
                      "✨ Improve with AI"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFixGrammar('summary', summary, setSummary)}
                    disabled={aiLoading.grammar_summary || !summary.trim() || saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {aiLoading.grammar_summary ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                        Checking...
                      </>
                    ) : (
                      "✍️ Fix Grammar"
                    )}
                  </button>
                </div>
              </div>
              
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

              {/* Suggestion Card for Summary */}
              {aiSuggestions.summary && (
                <div className="mt-5 border border-indigo-500/40 rounded-xl overflow-hidden bg-slate-950/50 shadow-xl shadow-indigo-950/10 animate-fadeIn">
                  {/* Header */}
                  <div className="bg-indigo-950/40 border-b border-indigo-800/30 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                        ✨ AI Summary Suggestion
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Review changes side-by-side</span>
                  </div>
                  
                  {/* Body: Two columns (or stacked on mobile) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                    {/* Left: Original */}
                    <div className="p-5">
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Original Summary
                      </div>
                      <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/40 border border-slate-850 p-3 rounded-lg min-h-[120px]">
                        {originalSummaryForComparison || 'No summary entered.'}
                      </div>
                    </div>

                    {/* Right: AI Suggestion */}
                    <div className="p-5 bg-indigo-950/10">
                      <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Improved Suggestion
                      </div>
                      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/80 border border-indigo-500/20 p-3 rounded-lg min-h-[120px] shadow-inner">
                        {aiSuggestions.summary}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-slate-900/60 border-t border-slate-850 px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="text-[11px] text-slate-400 hidden sm:block">
                      Click Accept to update your professional summary.
                    </div>
                    <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleAcceptSuggestion('summary', setSummary)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/20 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Accept Suggestion
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscardSuggestion('summary')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {aiErrors.summary && (
                <div className="mt-4 p-4 bg-red-950/30 border border-red-800/40 rounded-xl text-sm text-red-300 flex gap-3 items-start animate-fadeIn">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-200 text-xs uppercase tracking-wider mb-1">AI Enhancement Failed</h4>
                    <p className="text-xs text-red-300/90 leading-relaxed">{aiErrors.summary}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAiErrors(prev => ({ ...prev, summary: null }))}
                    className="p-1 hover:bg-red-900/30 rounded text-red-400 hover:text-red-200 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* 3.5. Work Experience Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  Work Experience
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleImproveExperience()}
                    disabled={aiLoading.experience || !experience.trim() || saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 hover:text-indigo-200 border border-indigo-800/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {aiLoading.experience ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
                        Improving...
                      </>
                    ) : (
                      "✨ Improve with AI"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFixGrammar('experience', experience, setExperience)}
                    disabled={aiLoading.grammar_experience || !experience.trim() || saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {aiLoading.grammar_experience ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                        Checking...
                      </>
                    ) : (
                      "✍️ Fix Grammar"
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="experience">
                  Experience Details / Bullet Points
                </label>
                <textarea
                  id="experience"
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  placeholder="Describe your previous work experience and bullet points..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* Suggestion Card for Experience */}
              {aiSuggestions.experience && (
                <div className="mt-4 p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-lg animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      ✨ AI Experience Suggestion
                    </span>
                    <span className="text-[10px] text-slate-500">AI-generated — review before use</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap">
                    {aiSuggestions.experience}
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAcceptSuggestion('experience', setExperience)}
                      className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      Accept Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscardSuggestion('experience')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {aiErrors.experience && (
                <div className="mt-4 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">
                  {aiErrors.experience}
                </div>
              )}
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
