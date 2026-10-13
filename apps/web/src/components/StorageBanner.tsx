import { AlertTriangle, Database, Info } from 'lucide-react';

interface StorageBannerProps {
  persistenceMode: 'in-memory' | 'mongodb';
  className?: string;
}

export function StorageBanner({ persistenceMode, className = '' }: StorageBannerProps) {
  if (persistenceMode === 'mongodb') {
    return (
      <div
        className={`bg-emerald-50 border-2 border-black p-3.5 shadow-neo-sm flex items-center justify-between text-xs font-bold text-emerald-950 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>
            <strong>Persistent Mode Active:</strong> Your attempts, submissions, and feedback revisions are safely saved to MongoDB.
          </span>
        </div>
        <span className="neo-badge bg-emerald-300 text-black text-[10px] uppercase">
          MongoDB Connected
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-amber-100 border-2 border-black p-3.5 shadow-neo-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-amber-950 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>Ephemeral In-Memory Mode:</strong> Submissions and revisions are kept in server memory. They will reset if the Node backend process restarts. (Configure <code>MONGODB_URI</code> to enable permanent database storage).
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <span className="neo-badge bg-amber-300 text-black text-[10px] uppercase flex items-center gap-1">
          <Info className="w-3 h-3" />
          Standalone / In-Memory
        </span>
      </div>
    </div>
  );
}
