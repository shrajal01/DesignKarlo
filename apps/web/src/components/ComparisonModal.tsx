import { X, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, GitCompare } from 'lucide-react';
import type { ComparisonSummary } from '../types';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: ComparisonSummary | null;
  revisionA: { revisionNumber: number; overallScore?: number; submittedAt: string };
  revisionB: { revisionNumber: number; overallScore?: number; submittedAt: string };
}

export function ComparisonModal({
  isOpen,
  onClose,
  comparison,
  revisionA,
  revisionB,
}: ComparisonModalProps) {
  if (!isOpen || !comparison) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-4 border-black shadow-neo-xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-neutral-800" />
            <h3 className="text-2xl font-black tracking-tight">
              Revision #{revisionA.revisionNumber} vs Revision #{revisionB.revisionNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-cream hover:bg-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Evolution Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-cream border-2 border-black p-4 text-center">
            <span className="text-xs font-black uppercase text-neutral-600 block">
              Revision #{revisionA.revisionNumber}
            </span>
            <div className="text-3xl font-black mt-1">
              {revisionA.overallScore ?? '—'}
              <span className="text-sm font-bold text-neutral-500">/100</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 block mt-1">
              {new Date(revisionA.submittedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="bg-lime/30 border-2 border-black p-4 text-center">
            <span className="text-xs font-black uppercase text-neutral-600 block">
              Revision #{revisionB.revisionNumber}
            </span>
            <div className="text-3xl font-black mt-1 flex items-center justify-center gap-1.5">
              <span>{revisionB.overallScore ?? '—'}</span>
              <span className="text-sm font-bold text-neutral-500">/100</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 block mt-1">
              {new Date(revisionB.submittedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Score Delta Badge */}
        <div className="bg-white border-2 border-black p-3.5 shadow-neo-sm mb-6 flex items-center justify-between">
          <span className="font-bold text-xs text-neutral-800">Overall Score Evolution:</span>
          <div
            className={`neo-badge font-black text-xs flex items-center gap-1 ${
              comparison.scoreDelta >= 0 ? 'bg-lime text-black' : 'bg-red-200 text-red-950'
            }`}
          >
            {comparison.scoreDelta >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta} points
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="bg-cream border-2 border-black p-4 text-xs font-bold leading-relaxed mb-6">
          {comparison.summary}
        </div>

        {/* Resolved Concerns */}
        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Resolved Concerns ({comparison.resolvedConcerns.length})
            </h4>
            {comparison.resolvedConcerns.length > 0 ? (
              <ul className="space-y-1.5 pl-2">
                {comparison.resolvedConcerns.map((rc, idx) => (
                  <li
                    key={idx}
                    className="bg-emerald-50 border border-emerald-300 p-2 font-medium text-emerald-950 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {rc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 italic pl-2">No previously flagged concerns were resolved.</p>
            )}
          </div>

          {/* Unresolved Concerns */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Remaining Architectural Concerns ({comparison.unresolvedConcerns.length})
            </h4>
            {comparison.unresolvedConcerns.length > 0 ? (
              <ul className="space-y-1.5 pl-2">
                {comparison.unresolvedConcerns.map((uc, idx) => (
                  <li
                    key={idx}
                    className="bg-amber-50 border border-amber-300 p-2 font-medium text-amber-950 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {uc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 italic pl-2">No remaining concerns.</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t-2 border-black flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="neo-btn-secondary py-2 px-6 text-xs"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
