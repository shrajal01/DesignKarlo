import { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  ArrowLeft,
  User,
  RotateCcw,
} from 'lucide-react';
import type {
  Problem,
  ProblemSummary,
  Attempt,
  Submission,
  StructuredDesign,
  ComparisonSummary,
} from './types';
import { api, getOrCreateAnonymousUserId } from './api/client';
import { StorageBanner } from './components/StorageBanner';
import { ProblemCatalog } from './components/ProblemCatalog';
import { StructuredEditor } from './components/StructuredEditor';
import { EvaluationView } from './components/EvaluationView';
import { ComparisonModal } from './components/ComparisonModal';
import { AttemptHistory } from './components/AttemptHistory';

type AppView = 'catalog' | 'editor' | 'evaluation';

export function App() {
  const [anonymousUserId] = useState(() => getOrCreateAnonymousUserId());
  const [persistenceMode, setPersistenceMode] = useState<'in-memory' | 'mongodb'>('in-memory');

  const [view, setView] = useState<AppView>('catalog');
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [editorDraft, setEditorDraft] = useState<StructuredDesign | null>(null);

  const [loadingProblems, setLoadingProblems] = useState(false);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Comparison Modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    comparison: ComparisonSummary;
    revisionA: { revisionNumber: number; overallScore?: number; submittedAt: string };
    revisionB: { revisionNumber: number; overallScore?: number; submittedAt: string };
  } | null>(null);

  // Initial load: Fetch problems and system health/persistence
  useEffect(() => {
    async function init() {
      setLoadingProblems(true);
      try {
        const problemList = await api.getProblems();
        setProblems(problemList);

        if (problemList.length > 0) {
          const defaultProblem = await api.getProblem(problemList[0].slug);
          setSelectedProblem(defaultProblem);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to DesignKarlo API');
      } finally {
        setLoadingProblems(false);
      }
    }
    init();
  }, []);

  const handleSelectProblem = async (slug: string) => {
    try {
      const problem = await api.getProblem(slug);
      setSelectedProblem(problem);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load problem');
    }
  };

  const handleStartAttempt = async (slug: string) => {
    setAttemptLoading(true);
    setErrorMessage(null);
    try {
      const problem = await api.getProblem(slug);
      setSelectedProblem(problem);

      const { attempt } = await api.startOrResumeAttempt(slug, anonymousUserId);
      const { attempt: fullAttempt, persistenceMode: pMode } = await api.getAttempt(attempt.id);

      setActiveAttempt(fullAttempt);
      setPersistenceMode(pMode);

      if (fullAttempt.submissions && fullAttempt.submissions.length > 0) {
        // Resume on the latest submission scorecard
        const latestSub = fullAttempt.submissions[fullAttempt.submissions.length - 1];
        setActiveSubmission(latestSub);
        setView('evaluation');
      } else {
        // Fresh attempt: initialize editor with starter template
        setEditorDraft(JSON.parse(JSON.stringify(problem.starterTemplate)));
        setView('editor');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize attempt');
    } finally {
      setAttemptLoading(false);
    }
  };

  const handleSubmitDesign = async () => {
    if (!activeAttempt || !editorDraft) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { submission, persistenceMode: pMode } = await api.submitDesign(
        activeAttempt.id,
        editorDraft
      );

      setPersistenceMode(pMode);
      setActiveSubmission(submission);

      // Refresh attempt details to have full history
      const { attempt: updatedAttempt } = await api.getAttempt(activeAttempt.id);
      setActiveAttempt(updatedAttempt);

      setView('evaluation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission evaluation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevise = () => {
    if (!activeSubmission) return;
    // Clone previous submission design into editor draft
    setEditorDraft(JSON.parse(JSON.stringify(activeSubmission.design)));
    setView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenComparison = async (revA: number, revB: number) => {
    if (!activeAttempt) return;
    try {
      const res = await api.compareRevisions(activeAttempt.id, revA, revB);
      setComparisonData(res);
      setIsCompareOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Comparison failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between selection:bg-lime selection:text-black">
      {/* Top Header */}
      <header className="border-b-4 border-black bg-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setView('catalog')}
              className="w-10 h-10 bg-lime border-2 border-black shadow-neo-sm flex items-center justify-center font-black text-xl cursor-pointer"
            >
              DK
            </div>
            <div>
              <span
                onClick={() => setView('catalog')}
                className="text-2xl font-black tracking-tight uppercase cursor-pointer"
              >
                Design<span className="bg-lime px-1 ml-0.5 border border-black shadow-neo-sm">Karlo</span>
              </span>
            </div>
          </div>

          {/* Navigation & Status Pills */}
          <div className="flex items-center gap-3">
            {view !== 'catalog' && (
              <button
                type="button"
                onClick={() => setView('catalog')}
                className="neo-badge bg-white hover:bg-neutral-100 text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Problems
              </button>
            )}

            <span className="neo-badge bg-cream text-neutral-800 text-[11px] hidden sm:inline-flex items-center gap-1">
              <User className="w-3 h-3 text-neutral-600" />
              <span className="font-mono">{anonymousUserId.slice(0, 12)}...</span>
            </span>

            <div className="flex items-center gap-2 border-2 border-black bg-cream px-3 py-1 text-xs font-bold shadow-neo-sm">
              <span
                className={`w-2.5 h-2.5 rounded-full border border-black ${
                  persistenceMode === 'mongodb' ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              <span className="uppercase tracking-wider text-[10px]">
                {persistenceMode === 'mongodb' ? 'MongoDB' : 'In-Memory'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex-1 w-full flex flex-col gap-6">
        {/* Ephemeral In-Memory Warning Banner */}
        <StorageBanner persistenceMode={persistenceMode} />

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="bg-red-100 border-2 border-black p-4 text-red-950 font-bold text-xs flex items-center justify-between shadow-neo-sm">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="neo-badge bg-white text-black text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Problem Catalog View */}
        {view === 'catalog' && (
          <>
            <div className="bg-white border-4 border-black shadow-neo-lg p-6 md:p-8 mb-2">
              <div className="inline-flex items-center gap-2 neo-badge bg-lime text-black mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Iterative Low-Level Design Practice</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
                LOW-LEVEL DESIGN STUDIO.
              </h1>
              <p className="text-neutral-800 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
                DesignKarlo helps you formulate concrete class decompositions, submit structured architecture definitions, and receive rubric-anchored critiques that track how your design improves across revisions.
              </p>
            </div>

            <ProblemCatalog
              problems={problems}
              selectedProblem={selectedProblem}
              loading={loadingProblems}
              onSelectProblem={handleSelectProblem}
              onStartAttempt={handleStartAttempt}
              attemptLoading={attemptLoading}
            />
          </>
        )}

        {/* 2. Structured Editor View */}
        {view === 'editor' && selectedProblem && editorDraft && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeSubmission) setView('evaluation');
                    else setView('catalog');
                  }}
                  className="neo-badge bg-white hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <h2 className="text-xl font-black tracking-tight">
                  {selectedProblem.title} — Practice Session
                </h2>
              </div>

              {activeSubmission && (
                <button
                  type="button"
                  onClick={() => setView('evaluation')}
                  className="neo-badge bg-lime text-black flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Layers className="w-3.5 h-3.5" /> View Scorecard (Rev #{activeSubmission.revisionNumber})
                </button>
              )}
            </div>

            <StructuredEditor
              problem={selectedProblem}
              draft={editorDraft}
              onChangeDraft={setEditorDraft}
              onSubmit={handleSubmitDesign}
              isSubmitting={isSubmitting}
              revisionNumber={(activeAttempt?.currentRevisionNumber || 0) + 1}
            />
          </div>
        )}

        {/* 3. Evaluation & Feedback View */}
        {view === 'evaluation' && activeSubmission && selectedProblem && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <button
                type="button"
                onClick={() => setView('catalog')}
                className="neo-badge bg-white hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Curriculum
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRevise}
                  className="neo-btn-primary py-1 px-4 text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Revise Solution
                </button>
              </div>
            </div>

            {/* Revision Navigation History */}
            {activeAttempt?.submissions && activeAttempt.submissions.length > 1 && (
              <AttemptHistory
                submissions={activeAttempt.submissions}
                activeSubmissionId={activeSubmission.id}
                onSelectSubmission={(sub) => setActiveSubmission(sub)}
                onCompareRevisions={(revA, revB) => handleOpenComparison(revA, revB)}
              />
            )}

            <EvaluationView
              submission={activeSubmission}
              onRevise={handleRevise}
              onOpenCompare={
                activeSubmission.revisionNumber > 1
                  ? () =>
                      handleOpenComparison(
                        activeSubmission.revisionNumber - 1,
                        activeSubmission.revisionNumber
                      )
                  : undefined
              }
              hasPreviousRevision={activeSubmission.revisionNumber > 1}
            />
          </div>
        )}
      </main>

      {/* Comparison Modal */}
      {comparisonData && (
        <ComparisonModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          comparison={comparisonData.comparison}
          revisionA={comparisonData.revisionA}
          revisionB={comparisonData.revisionB}
        />
      )}

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white px-6 py-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="font-black text-black">DesignKarlo</span>
            <span>•</span>
            <span>Low-Level Design Practice & Progression Platform</span>
          </div>
          <div>
            Built with React, Vite, Express, TypeScript & Tailwind CSS • Neo-Brutalist Engineering
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
