import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Submission } from '../types';

interface EvaluationViewProps {
  submission: Submission;
  onRevise: () => void;
  onOpenCompare?: () => void;
  hasPreviousRevision: boolean;
}

export function EvaluationView({
  submission,
  onRevise,
  onOpenCompare,
}: EvaluationViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'concerns' | 'strengths'>('all');

  const evaluation = submission.evaluation;
  if (!evaluation) {
    return (
      <div className="neo-card p-12 text-center">
        <p className="font-bold text-neutral-600">No evaluation available for this submission.</p>
      </div>
    );
  }

  const comparison = evaluation.comparisonWithPrevious;

  const filteredItems = evaluation.feedbackItems.filter((item) => {
    if (filterType === 'concerns') return item.type === 'concern';
    if (filterType === 'strengths') return item.type === 'strength';
    return true;
  });

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'bg-lime text-black';
      case 'Good':
        return 'bg-emerald-100 text-emerald-950';
      case 'Needs Improvement':
        return 'bg-amber-100 text-amber-950';
      default:
        return 'bg-red-100 text-red-950';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Score & Overview Hero Card */}
      <div className="bg-white border-4 border-black shadow-neo-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-4 border-black pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="neo-badge bg-black text-lime font-black">
                Revision #{submission.revisionNumber}
              </span>
              <span className="text-xs font-bold text-neutral-600">
                Evaluation Completed • {new Date(submission.submittedAt).toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              Architectural Scorecard
              <Award className="w-8 h-8 text-neutral-800" />
            </h2>
          </div>

          {/* Big Neo-Brutalist Score Badge */}
          <div className="flex items-center gap-4 bg-cream border-4 border-black shadow-neo-lg px-6 py-4">
            <div>
              <span className="text-xs font-black uppercase text-neutral-600 tracking-wider block">
                Total Score
              </span>
              <div className="text-5xl font-black tracking-tight leading-none">
                {evaluation.overallScore}
                <span className="text-xl font-bold text-neutral-500">/100</span>
              </div>
            </div>

            {comparison && (
              <div
                className={`neo-badge border-2 border-black flex items-center gap-1 font-black text-xs ${
                  comparison.scoreDelta >= 0 ? 'bg-lime text-black' : 'bg-red-300 text-black'
                }`}
              >
                {comparison.scoreDelta >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta} pts
              </div>
            )}
          </div>
        </div>

        {/* 2. Multi-Attempt Progression Banner (If Revision >= 2) */}
        {comparison && (
          <div className="bg-[#F0FDF4] border-2 border-black p-4 shadow-neo-sm mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" /> Multi-Attempt Progression
              </span>
              {onOpenCompare && (
                <button
                  type="button"
                  onClick={onOpenCompare}
                  className="neo-badge bg-white text-black hover:bg-neutral-100 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <GitCompare className="w-3 h-3" /> Compare Revisions Side-by-Side
                </button>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-800 leading-relaxed">
              {comparison.summary}
            </p>

            {comparison.resolvedConcerns.length > 0 && (
              <div className="pt-2 border-t border-emerald-300 mt-1">
                <span className="text-[11px] font-black uppercase text-emerald-900 block mb-1">
                  Resolved from Revision #{comparison.previousRevisionNumber}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {comparison.resolvedConcerns.map((rc, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-200 border border-black text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 text-emerald-950"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-900" /> {rc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Rubric Criteria 4-Dimension Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {evaluation.criterionScores.map((c) => (
            <div
              key={c.criterionId}
              className="bg-cream border-2 border-black p-4 shadow-neo-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`neo-badge text-[10px] ${getRatingBadgeClass(c.rating)}`}>
                    {c.rating}
                  </span>
                  <span className="font-mono text-sm font-black">
                    {c.score}/{c.maxScore}
                  </span>
                </div>
                <h4 className="font-black text-sm tracking-tight mb-1">{c.title}</h4>
                <p className="text-[11px] font-medium text-neutral-700 leading-snug">
                  {c.summary}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200 border border-black h-2.5 mt-3 overflow-hidden">
                <div
                  className="bg-lime h-full border-r border-black"
                  style={{ width: `${(c.score / c.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Actionable Feedback List */}
      <div className="bg-white border-4 border-black shadow-neo-xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-neutral-800" />
              Evidence-Backed Feedback ({filteredItems.length})
            </h3>
            <span className="text-xs font-bold text-neutral-600">
              Actionable critiques anchored directly in your submitted architecture
            </span>
          </div>

          {/* Filter Pills */}
          <div className="border-2 border-black bg-cream p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                filterType === 'all' ? 'bg-black text-white' : 'hover:bg-neutral-200'
              }`}
            >
              All ({evaluation.feedbackItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('concerns')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                filterType === 'concerns' ? 'bg-black text-white' : 'hover:bg-neutral-200'
              }`}
            >
              Concerns ({evaluation.feedbackItems.filter((i) => i.type === 'concern').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('strengths')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                filterType === 'strengths' ? 'bg-black text-white' : 'hover:bg-neutral-200'
              }`}
            >
              Strengths ({evaluation.feedbackItems.filter((i) => i.type === 'strength').length})
            </button>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isConcern = item.type === 'concern';
            return (
              <div
                key={item.id}
                className={`border-2 border-black p-5 shadow-neo-sm ${
                  isConcern
                    ? item.priority === 'high'
                      ? 'bg-red-50/70 border-l-8 border-l-red-600'
                      : 'bg-amber-50/70 border-l-8 border-l-amber-500'
                    : 'bg-emerald-50/70 border-l-8 border-l-emerald-600'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isConcern ? (
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          item.priority === 'high' ? 'text-red-700' : 'text-amber-700'
                        }`}
                      />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                    <h4 className="font-black text-base tracking-tight">{item.title}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConcern && (
                      <span
                        className={`neo-badge text-[10px] uppercase ${
                          item.priority === 'high'
                            ? 'bg-red-200 text-red-950'
                            : 'bg-amber-200 text-amber-950'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    )}
                    <span className="neo-badge bg-white text-neutral-800 text-[10px] uppercase font-mono">
                      {item.criterionId.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Evidence Section */}
                <div className="bg-white/80 border border-black p-2.5 my-2.5 font-mono text-xs">
                  <span className="font-bold text-neutral-600 uppercase text-[10px] block mb-0.5">
                    Submission Evidence:
                  </span>
                  <span className="text-neutral-900 font-semibold">{item.evidence}</span>
                </div>

                {/* Impact & Suggestion */}
                <div className="space-y-1.5 text-xs text-neutral-800 leading-relaxed mt-3">
                  <p>
                    <strong>Architectural Impact:</strong> {item.impact}
                  </p>
                  <p className="flex items-start gap-1.5 font-bold text-neutral-950 pt-1">
                    <Lightbulb className="w-4 h-4 text-lime-accent shrink-0 mt-0.5 fill-lime" />
                    <span>
                      <strong className="underline">Suggested Improvement:</strong> {item.suggestion}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footer: Revise Design Button */}
        <div className="mt-8 pt-6 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-neutral-600">
            Address the feedback items above to evolve your design and increase your score.
          </p>

          <button
            type="button"
            onClick={onRevise}
            className="neo-btn-primary gap-2 text-base w-full sm:w-auto"
          >
            Revise Solution (Attempt Revision #{submission.revisionNumber + 1})
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
