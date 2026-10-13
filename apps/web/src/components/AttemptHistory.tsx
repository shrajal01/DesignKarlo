import { History, Eye, GitCompare } from 'lucide-react';
import type { Submission } from '../types';

interface AttemptHistoryProps {
  submissions: Submission[];
  activeSubmissionId: string;
  onSelectSubmission: (sub: Submission) => void;
  onCompareRevisions?: (revA: number, revB: number) => void;
}

export function AttemptHistory({
  submissions,
  activeSubmissionId,
  onSelectSubmission,
  onCompareRevisions,
}: AttemptHistoryProps) {
  if (submissions.length <= 1) return null;

  return (
    <div className="bg-white border-2 border-black p-4 shadow-neo-sm">
      <div className="flex items-center justify-between mb-3 border-b border-black pb-2">
        <h4 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4" /> Attempt Revision History ({submissions.length})
        </h4>
        {submissions.length >= 2 && onCompareRevisions && (
          <button
            type="button"
            onClick={() => onCompareRevisions(1, submissions.length)}
            className="neo-badge bg-cream hover:bg-neutral-200 text-black text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <GitCompare className="w-3 h-3" /> Compare First vs Latest
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {submissions.map((sub) => {
          const isActive = sub.id === activeSubmissionId;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSelectSubmission(sub)}
              className={`p-2.5 border-2 border-black text-left flex items-center gap-3 transition-transform cursor-pointer ${
                isActive
                  ? 'bg-lime shadow-neo-sm -translate-y-0.5'
                  : 'bg-cream hover:bg-neutral-100 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase text-neutral-600 block">
                  Revision #{sub.revisionNumber}
                </span>
                <span className="font-mono text-sm font-black">
                  {sub.evaluation?.overallScore ?? '—'}
                  <span className="text-xs font-normal text-neutral-600">/100</span>
                </span>
              </div>
              <Eye className="w-3.5 h-3.5 text-neutral-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
