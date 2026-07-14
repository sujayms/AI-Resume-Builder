import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Account Verification</h2>
          <p className="text-sm text-slate-400 mt-1">Successfully Authenticated Session</p>
        </div>

        <div className="space-y-4 mb-8 bg-slate-950 p-5 rounded-lg border border-slate-800/60 font-mono text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-sans">Name:</span>
            <span className="text-slate-200 font-sans">{user?.name || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-sans">Email:</span>
            <span className="text-slate-200 font-sans">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-800/60 mt-3 pt-3">
            <span className="text-slate-500 font-sans">Auth Status:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase">
              Active JWT
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-800/40 text-red-400 font-semibold rounded-lg text-sm transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
