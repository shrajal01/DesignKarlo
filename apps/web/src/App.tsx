import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  Layers, 
  RefreshCw, 
  Sparkles,
  Server
} from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  uptime: number;
  environment: string;
  database: string;
  timestamp: string;
}

export function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reach API';
      setHealthError(message);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const workflowSteps = [
    { num: '01', title: 'Choose Problem', desc: 'Select curated real-world LLD scenarios like Parking Lot or Rate Limiter' },
    { num: '02', title: 'Design Solution', desc: 'Formulate class diagrams, design patterns, and entity relationships' },
    { num: '03', title: 'Submit', desc: 'Send structured textual architecture for automated rubric evaluation' },
    { num: '04', title: 'Receive Feedback', desc: 'Get evidence-based critiques on SOLID principles and trade-offs' },
    { num: '05', title: 'Revise', desc: 'Address architectural weaknesses and refine your object model' },
    { num: '06', title: 'Compare Attempts', desc: 'Track diffs and architectural maturity across your iteration history' },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between selection:bg-lime selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b-4 border-black bg-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime border-2 border-black shadow-neo-sm flex items-center justify-center font-black text-xl">
              DK
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight uppercase">
                Design<span className="bg-lime px-1 ml-0.5 border border-black shadow-neo-sm">Karlo</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="neo-badge bg-[#E0F2FE] text-sky-950 hidden sm:inline-flex">
              Milestone 1 • Foundation
            </span>
            <div className="flex items-center gap-2 border-2 border-black bg-cream px-3 py-1 text-xs font-bold shadow-neo-sm">
              <span className={`w-2.5 h-2.5 rounded-full border border-black ${health ? 'bg-lime' : healthError ? 'bg-red-400' : 'bg-yellow-300'}`} />
              <span className="uppercase tracking-wider">
                {health ? 'API Online' : healthLoading ? 'Checking...' : healthError ? 'API Standby' : 'Connecting'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full flex flex-col gap-12">
        {/* Hero Section */}
        <section className="bg-white border-4 border-black shadow-neo-xl p-8 md:p-12">
          <div className="inline-flex items-center gap-2 neo-badge bg-lime text-black mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Low-Level Design Practice & Iterative Mastery</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
            PRACTICE LLD. <br className="hidden md:block" />
            RECEIVE EVIDENCE. <br className="hidden md:block" />
            <span className="bg-lime px-2 py-0.5 border-2 border-black shadow-neo-sm inline-block mt-2">
              REVISE & EVOLVE.
            </span>
          </h1>

          <p className="text-lg md:text-xl font-medium text-neutral-800 max-w-3xl leading-relaxed mb-8">
            <strong>DesignKarlo</strong> is a focused practice platform for software engineers mastering Low-Level Design. Submit structured architecture solutions, receive actionable feedback anchored in design principles, and review your multi-attempt progression over time.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a 
              href="#workflow" 
              className="neo-btn-primary gap-2 text-base"
            >
              Explore Core Workflow
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#backend-status" 
              className="neo-btn-secondary gap-2 text-base"
            >
              <Server className="w-5 h-5" />
              Check API Status
            </a>
          </div>
        </section>

        {/* Product Differentiator Highlight */}
        <section className="bg-lime border-4 border-black shadow-neo-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-black/70">The Core Value</span>
              <h2 className="text-2xl font-black tracking-tight mt-1">
                Continuous & Actionable Feedback Across Attempts
              </h2>
              <p className="text-neutral-900 font-medium text-sm md:text-base mt-1 max-w-2xl">
                Unlike complex UML drag-and-drop tools or one-shot AI graders, DesignKarlo evaluates your design decisions against clear rubrics and highlights exactly how your abstractions evolve from attempt to attempt.
              </p>
            </div>
            <div className="shrink-0">
              <span className="neo-badge bg-white text-black font-black text-sm">
                No Clutter • Pure Engineering
              </span>
            </div>
          </div>
        </section>

        {/* 6-Step Workflow */}
        <section id="workflow" className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6" />
              The DesignKarlo Practice Loop
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              End-to-End Workflow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div 
                key={step.num}
                className="neo-card hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg transition-transform flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 bg-cream border-2 border-black font-black flex items-center justify-center text-sm shadow-neo-sm">
                      {step.num}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm font-medium text-neutral-700 leading-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Backend Connectivity Status Card */}
        <section id="backend-status" className="bg-white border-4 border-black shadow-neo-lg p-6">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Full-Stack Integration Verification
              </h3>
            </div>
            <button 
              onClick={fetchHealth}
              disabled={healthLoading}
              className="neo-badge bg-lime text-black hover:bg-lime-hover active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              Re-check Endpoint
            </button>
          </div>

          <div className="bg-cream border-2 border-black p-4 font-mono text-xs overflow-x-auto">
            {healthLoading && <p className="text-neutral-600">Connecting to GET /api/health ...</p>}
            {health && (
              <div className="space-y-1">
                <p className="text-green-700 font-bold">✓ Backend Connection: Active</p>
                <p>Service: <span className="font-bold">{health.service}</span></p>
                <p>Status: <span className="font-bold">{health.status}</span></p>
                <p>Environment: {health.environment}</p>
                <p>Uptime: {health.uptime}s</p>
                <p>Database: {health.database}</p>
                <p>Timestamp: {health.timestamp}</p>
              </div>
            )}
            {healthError && (
              <div className="space-y-1 text-red-700">
                <p className="font-bold">✗ Backend Not Reachable via Vite Proxy</p>
                <p>Detail: {healthError}</p>
                <p className="text-neutral-600 mt-2">
                  (Run `npm run dev` or `npm run dev:api` to start Express on port 5000)
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white px-6 py-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="font-black text-black">DesignKarlo</span>
            <span>•</span>
            <span>Low-Level Design Practice Platform</span>
          </div>
          <div>
            Built with React, Vite, Express, TypeScript & Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
