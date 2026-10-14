import { BookOpen, Layers, ArrowRight, ShieldCheck, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import type { Problem, ProblemSummary } from '../types';

interface ProblemCatalogProps {
  problems: ProblemSummary[];
  selectedProblem: Problem | null;
  loading: boolean;
  errorMessage?: string | null;
  onSelectProblem: (slug: string) => void;
  onStartAttempt: (slug: string) => void;
  onRetry?: () => void;
  attemptLoading: boolean;
}

export function ProblemCatalog({
  problems,
  selectedProblem,
  loading,
  errorMessage,
  onSelectProblem,
  onStartAttempt,
  onRetry,
  attemptLoading,
}: ProblemCatalogProps) {
  if (loading) {
    return (
      <div className="neo-card p-12 text-center">
        <div className="w-8 h-8 border-4 border-black border-t-lime rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold text-neutral-700">Loading Low-Level Design curriculum...</p>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="neo-card p-10 text-center flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 bg-amber-100 border-2 border-black rounded-none flex items-center justify-center shadow-neo-sm">
          <AlertTriangle className="w-6 h-6 text-amber-900" />
        </div>
        <div>
          <h3 className="text-xl font-black mb-1 tracking-tight">Unable to Load Curriculum</h3>
          <p className="text-neutral-700 text-sm font-medium max-w-md mx-auto leading-relaxed">
            {errorMessage || 'Could not connect to the DesignKarlo API. The server might be waking up or unreachable.'}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="neo-btn-primary gap-2 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problems.map((problem) => {
          const isSelected = selectedProblem?.slug === problem.slug;
          return (
            <div
              key={problem.id}
              onClick={() => onSelectProblem(problem.slug)}
              className={`neo-card cursor-pointer transition-all duration-150 ${
                isSelected ? 'ring-4 ring-black bg-[#FFFDF5]' : 'hover:-translate-x-1 hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="neo-badge bg-lime text-black font-black">
                    {problem.difficulty}
                  </span>
                  <span className="text-xs font-bold text-neutral-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 45 mins
                  </span>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  {problem.slug}
                </span>
              </div>

              <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center justify-between">
                {problem.title}
                <BookOpen className="w-5 h-5 text-neutral-700" />
              </h3>

              <p className="text-sm font-medium text-neutral-700 mb-6 leading-relaxed">
                {problem.summary}
              </p>

              {/* Rubric Dimensions Preview */}
              <div className="border-t-2 border-black pt-4 mb-6">
                <p className="text-xs font-black uppercase tracking-wider mb-2 text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-900" /> Evaluation Rubric (100 pts)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {problem.rubricDimensions.map((dim) => (
                    <div
                      key={dim.id}
                      className="bg-cream border border-black p-1.5 text-[11px] font-bold flex justify-between items-center"
                    >
                      <span className="truncate pr-1">{dim.title}</span>
                      <span className="neo-badge bg-white py-0 px-1 text-[10px] shrink-0">
                        {dim.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartAttempt(problem.slug);
                  }}
                  disabled={attemptLoading}
                  className="neo-btn-primary w-full gap-2 text-sm"
                >
                  {attemptLoading ? 'Preparing Attempt...' : 'Start Practice Session'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Problem Detailed Specification Accordion */}
      {selectedProblem && (
        <div className="bg-white border-4 border-black shadow-neo-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-6">
            <div>
              <span className="neo-badge bg-black text-lime font-black mb-2 inline-block">
                Problem Specification
              </span>
              <h2 className="text-3xl font-black tracking-tight">
                {selectedProblem.title}
              </h2>
            </div>
            <button
              onClick={() => onStartAttempt(selectedProblem.slug)}
              disabled={attemptLoading}
              className="neo-btn-primary gap-2"
            >
              Start Attempt
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="prose max-w-none text-neutral-800 text-sm leading-relaxed mb-6">
            <p className="font-medium whitespace-pre-line">{selectedProblem.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-black">
            {/* Functional Requirements */}
            <div className="bg-cream border-2 border-black p-5 shadow-neo-sm">
              <h4 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Functional Requirements
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-neutral-800 list-disc list-inside">
                {(selectedProblem.functionalRequirements || []).map((req, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Non-Functional Constraints */}
            <div className="bg-cream border-2 border-black p-5 shadow-neo-sm">
              <h4 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Architectural & SOLID Constraints
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-neutral-800 list-disc list-inside">
                {(selectedProblem.nonFunctionalConstraints || []).map((constraint, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
