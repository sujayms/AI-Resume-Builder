import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex w-9 h-9 rounded-lg bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-600/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                ResuAI
              </span>
            </Link>
            
            {/* Nav Links */}
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-850 text-white border-b-2 border-indigo-500 rounded-b-none'
                      : 'text-slate-350 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* User Settings and Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-850 hidden sm:block"></div>

            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-650 hover:text-white border border-red-800/30 hover:border-red-700/50 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
