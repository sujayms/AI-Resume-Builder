import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('templates')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.15),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute top-[400px] -left-40 w-96 h-96 bg-purple-500/10 blur-[128px] rounded-full pointer-events-none" />
      <div className="absolute top-[200px] -right-40 w-96 h-96 bg-indigo-500/10 blur-[128px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
                ResuAI
              </span>
              <span className="text-[10px] block font-mono text-indigo-400 tracking-wider uppercase -mt-1 font-bold">
                Builder Studio
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#templates" className="hover:text-indigo-400 transition-colors">Templates</a>
            <a href="#about" className="hover:text-indigo-400 transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Milestone 1 Setup Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-24">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Craft the Perfect Resume with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              Generative AI
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            ResuAI is a next-generation resume platform that optimizes your professional achievements for ATS filters, helps you polish bullet points, and generates stunning custom templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#setup-details"
              className="px-8 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all shadow-lg shadow-indigo-600/30 text-white cursor-pointer"
            >
              Explore Milestone Config
            </a>
            <a
              href="https://github.com/sujayms/AI-Resume-Builder"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-850 active:scale-98 transition-all border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              View Repository
            </a>
          </div>
        </section>

        {/* Milestone 1 Status Grid */}
        <section id="setup-details" className="grid md:grid-cols-2 gap-8 mb-24">
          {/* Frontend Card */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase">
                Frontend Architecture
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active & Styled
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">
              React + Vite + Tailwind CSS v4
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Fully scaffolded React framework powered by Vite for instant Hot Module Replacement (HMR). Styled with the newly configured Tailwind CSS v4 engine.
            </p>
            <div className="space-y-3 font-mono text-xs text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-900">
              <div className="flex justify-between">
                <span>Vite Plugin:</span>
                <span className="text-slate-200">@tailwindcss/vite</span>
              </div>
              <div className="flex justify-between">
                <span>Styling Engine:</span>
                <span className="text-slate-200">Tailwind v4 (CSS-first)</span>
              </div>
              <div className="flex justify-between">
                <span>Development Port:</span>
                <span className="text-slate-200">http://localhost:5173</span>
              </div>
            </div>
          </div>

          {/* Backend Card */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-md hover:border-violet-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold tracking-wider text-violet-400 uppercase">
                Backend Architecture
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Setup Complete
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-violet-300 transition-colors">
              Flask Rest Server
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              A light, robust Flask application initialized inside a clean workspace folder. Set up with an isolated Python Virtual Environment (`.venv`) for safe dependency management.
            </p>
            <div className="space-y-3 font-mono text-xs text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-900">
              <div className="flex justify-between">
                <span>Runtime:</span>
                <span className="text-slate-200">Python 3.14.0 (venv)</span>
              </div>
              <div className="flex justify-between">
                <span>CORS Policy:</span>
                <span className="text-slate-200">Flask-Cors Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Development Port:</span>
                <span className="text-slate-200">http://localhost:5000</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Teasers */}
        <section id="features" className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-4">Milestone Roadmap</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We are establishing the core skeleton first, with feature modules planned for subsequent sprints.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 font-bold">
                M1
              </div>
              <h4 className="text-lg font-semibold mb-2">Environment Setup</h4>
              <p className="text-slate-400 text-sm">
                Framework installation, stylesheet bindings, clean folder hierarchies, and local verification.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 opacity-50">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mb-4 font-bold">
                M2
              </div>
              <h4 className="text-lg font-semibold mb-2">Auth & DB Schema</h4>
              <p className="text-slate-400 text-sm">
                Integrate PostgreSQL, design JWT auth flows, and write models for user and resume profiles.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 opacity-50">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mb-4 font-bold">
                M3
              </div>
              <h4 className="text-lg font-semibold mb-2">AI Bullet Points</h4>
              <p className="text-slate-400 text-sm">
                Connect the Gemini API to analyze text, suggest action verbs, and optimize for ATS compatibility.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 ResuAI Builder Studio. Pair programmed in local workspace mode.</p>
      </footer>
    </div>
  )
}

export default App
