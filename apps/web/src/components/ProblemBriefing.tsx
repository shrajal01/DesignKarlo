import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import type { Problem } from '../types';

interface ProblemBriefingProps {
  problem: Problem;
  onBack: () => void;
  onStartDesigning: () => void;
  loading?: boolean;
}

export function ProblemBriefing({
  problem,
  onBack,
  onStartDesigning,
  loading = false,
}: ProblemBriefingProps) {
  const assumptions = problem.starterTemplate?.assumptions || [];
  const edgeCases = problem.starterTemplate?.edgeCasesConsidered || [];

  return (
    <div className="flex flex-col gap-6" data-testid="problem-briefing-screen">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <button
          type="button"
          onClick={onBack}
          className="neo-badge bg-white hover:bg-neutral-100 flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Problem Catalog
        </button>

        <div className="flex items-center gap-2">
          <span className="neo-badge bg-lime text-black font-black">
            {problem.difficulty}
          </span>
          <span className="text-xs font-bold text-neutral-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 45 mins
          </span>
        </div>
      </div>

      {/* Hero Briefing Card */}
      <div className="bg-white border-4 border-black shadow-neo-lg p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="neo-badge bg-black text-lime font-black">
            <Compass className="w-3.5 h-3.5 mr-1" /> Problem Briefing
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {problem.slug}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 flex items-center justify-between">
          <span>{problem.title}</span>
          <BookOpen className="w-8 h-8 text-neutral-700 hidden sm:block" />
        </h1>

        <p className="text-base font-semibold text-neutral-800 mb-6 leading-relaxed">
          {problem.summary}
        </p>

        <div className="border-t-2 border-black pt-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
            Detailed Problem Statement
          </h2>
          <div className="prose max-w-none text-neutral-800 text-sm leading-relaxed whitespace-pre-line font-medium bg-cream border-2 border-black p-4">
            {problem.description}
          </div>
        </div>
      </div>

      {/* Requirements & Constraints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Functional Requirements */}
        <div className="bg-white border-4 border-black shadow-neo p-6">
          <h3 className="font-black text-base uppercase tracking-tight mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
            <Layers className="w-5 h-5 text-black" /> Functional Requirements
          </h3>
          <ul className="space-y-2.5 text-xs font-semibold text-neutral-800">
            {(problem.functionalRequirements || []).map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Architectural & SOLID Constraints */}
        <div className="bg-white border-4 border-black shadow-neo p-6">
          <h3 className="font-black text-base uppercase tracking-tight mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
            <ShieldCheck className="w-5 h-5 text-black" /> Architectural & SOLID Constraints
          </h3>
          <ul className="space-y-2.5 text-xs font-semibold text-neutral-800">
            {(problem.nonFunctionalConstraints || []).map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-neutral-800 shrink-0 mt-0.5" />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Assumptions and Edge Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Assumptions */}
        <div className="bg-cream border-2 border-black shadow-neo-sm p-5">
          <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-neutral-800" /> Operational Assumptions
          </h3>
          {assumptions.length > 0 ? (
            <ul className="space-y-2 text-xs font-semibold text-neutral-800 list-disc list-inside">
              {assumptions.map((assumption, idx) => (
                <li key={idx} className="leading-relaxed">
                  {assumption}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-600 font-medium italic">
              Formulate standard operational assumptions during your design decomposition.
            </p>
          )}
        </div>

        {/* Edge Cases to Consider */}
        <div className="bg-cream border-2 border-black shadow-neo-sm p-5">
          <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-800" /> Edge Cases & Concurrency
          </h3>
          {edgeCases.length > 0 ? (
            <ul className="space-y-2 text-xs font-semibold text-neutral-800 list-disc list-inside">
              {edgeCases.map((edgeCase, idx) => (
                <li key={idx} className="leading-relaxed">
                  {edgeCase}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-600 font-medium italic">
              Account for system capacity, race conditions, and error recovery in your submission.
            </p>
          )}
        </div>
      </div>

      {/* Rubric Overview */}
      {problem.rubric?.criteria && problem.rubric.criteria.length > 0 && (
        <div className="bg-white border-4 border-black shadow-neo p-6">
          <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-900" /> Evaluation Rubric Dimensions (100 pts)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {problem.rubric.criteria.map((dim) => (
              <div
                key={dim.id}
                className="bg-cream border border-black p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-neutral-900">{dim.title}</span>
                    <span className="neo-badge bg-white py-0 px-1 text-[10px] shrink-0 font-bold">
                      {dim.weight}%
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-700 leading-snug line-clamp-3">
                    {dim.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="bg-white border-4 border-black shadow-neo-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight">Ready to tackle this problem?</h3>
          <p className="text-xs font-medium text-neutral-700">
            Open the structured design studio to formulate your entities, relationships, and patterns.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="neo-btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto"
          >
            Back to Catalog
          </button>
          <button
            type="button"
            onClick={onStartDesigning}
            disabled={loading}
            className="neo-btn-primary text-sm py-2.5 px-6 gap-2 w-full sm:w-auto"
          >
            {loading ? 'Preparing Attempt...' : 'Start Designing'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
