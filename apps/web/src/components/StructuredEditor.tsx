import { useState } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Code2,
  Send,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  Cpu,
  AlertCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type {
  StructuredDesign,
  EntityDefinition,
  RelationshipDefinition,
  DesignPatternUsage,
  EntityType,
  RelationshipType,
  Problem,
  ValidationErrorDetail,
} from '../types';
import { formatErrorLocation } from '../utils/validation';
import { normalizeAndValidateImportJson } from '../utils/importer';

interface StructuredEditorProps {
  problem: Problem;
  draft: StructuredDesign;
  onChangeDraft: (draft: StructuredDesign) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  revisionNumber: number;
  validationErrors?: ValidationErrorDetail[];
}

export function StructuredEditor({
  problem,
  draft,
  onChangeDraft,
  onSubmit,
  isSubmitting,
  revisionNumber,
  validationErrors = [],
}: StructuredEditorProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(draft, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [replacementTarget, setReplacementTarget] = useState<'starter' | 'sample' | null>(null);

  // Helper to query errors by path
  const getFieldError = (path: string): string | undefined => {
    return validationErrors.find((e) => e.path === path)?.message;
  };

  const getFieldErrorsPrefix = (prefix: string): string[] => {
    return validationErrors
      .filter((e) => e.path === prefix || e.path.startsWith(`${prefix}.`))
      .map((e) => e.message);
  };

  const scrollToError = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el && typeof (el as HTMLElement).focus === 'function') {
        (el as HTMLElement).focus();
      }
    }
  };

  // Sync JSON text when switching to JSON tab
  const handleTabChange = (tab: 'form' | 'json') => {
    if (tab === 'json') {
      setJsonText(JSON.stringify(draft, null, 2));
      setJsonError(null);
    }
    setActiveTab(tab);
  };

  const handleJsonApply = () => {
    const result = normalizeAndValidateImportJson(jsonText, problem.slug);
    if (!result.success || !result.design) {
      setJsonError(result.error || 'Failed to import JSON.');
      return;
    }

    onChangeDraft(result.design);
    setJsonError(null);
    setActiveTab('form');
  };

  // Helper mutators for Draft & Safe Replacement
  const isDraftEmpty = (d: StructuredDesign): boolean => {
    const hasEntities = (d.entities || []).some((e) => e.name && e.name.trim().length > 0);
    const hasAssumptions = (d.assumptions || []).some((a) => a && a.trim().length > 0);
    const hasRelationships = (d.relationships || []).length > 0;
    const hasPatterns = (d.designPatterns || []).length > 0;
    const hasEdgeCases = (d.edgeCasesConsidered || []).some((ec) => ec && ec.trim().length > 0);
    return !hasEntities && !hasAssumptions && !hasRelationships && !hasPatterns && !hasEdgeCases;
  };

  const areDesignsEqual = (a: StructuredDesign, b: StructuredDesign): boolean => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const applyReplacement = (target: 'starter' | 'sample') => {
    const targetDesign = target === 'starter' ? problem.starterTemplate : problem.sampleSolution;
    const cloned = JSON.parse(JSON.stringify(targetDesign));
    onChangeDraft(cloned);
    setJsonText(JSON.stringify(cloned, null, 2));
    setJsonError(null);
    setReplacementTarget(null);
  };

  const handleLoadSample = () => {
    // If draft is empty, unchanged from initial starter state, or already matches sample solution:
    // Avoid unnecessary confirmation dialogs
    const isUnchangedOrEmpty =
      isDraftEmpty(draft) ||
      areDesignsEqual(draft, problem.starterTemplate) ||
      areDesignsEqual(draft, problem.sampleSolution);

    if (isUnchangedOrEmpty) {
      applyReplacement('sample');
      return;
    }

    // Current editor contains user-entered modifications -> ask for confirmation
    setReplacementTarget('sample');
  };

  const handleLoadStarter = () => {
    // If draft is empty or already matches starter template:
    // Avoid unnecessary confirmation dialogs
    const isUnchangedOrEmpty =
      isDraftEmpty(draft) || areDesignsEqual(draft, problem.starterTemplate);

    if (isUnchangedOrEmpty) {
      applyReplacement('starter');
      return;
    }

    // Current editor contains user-entered modifications -> ask for confirmation
    setReplacementTarget('starter');
  };

  // 1. Assumptions
  const handleAddAssumption = () => {
    onChangeDraft({
      ...draft,
      assumptions: [...(draft.assumptions || []), ''],
    });
  };

  const handleUpdateAssumption = (index: number, val: string) => {
    const updated = [...(draft.assumptions || [])];
    updated[index] = val;
    onChangeDraft({ ...draft, assumptions: updated });
  };

  const handleRemoveAssumption = (index: number) => {
    onChangeDraft({
      ...draft,
      assumptions: (draft.assumptions || []).filter((_, i) => i !== index),
    });
  };

  // 2. Entities
  const handleAddEntity = () => {
    const newEntity: EntityDefinition = {
      name: `Entity${(draft.entities || []).length + 1}`,
      type: 'class',
      responsibilities: ['Defines core responsibility'],
      attributes: [],
      methods: [],
    };
    onChangeDraft({ ...draft, entities: [...(draft.entities || []), newEntity] });
  };

  const handleUpdateEntity = (index: number, entity: EntityDefinition) => {
    const oldName = draft.entities?.[index]?.name;
    const newName = entity.name;
    const updatedEntities = [...(draft.entities || [])];
    updatedEntities[index] = entity;

    let updatedRelationships = draft.relationships || [];
    let updatedPatterns = draft.designPatterns || [];

    // If entity was renamed and had an old name, cascade rename to relationships & patterns
    if (oldName && newName && oldName !== newName) {
      updatedRelationships = (draft.relationships || []).map((rel) => ({
        ...rel,
        source: rel.source === oldName ? newName : rel.source,
        target: rel.target === oldName ? newName : rel.target,
      }));

      updatedPatterns = (draft.designPatterns || []).map((pat) => ({
        ...pat,
        targetEntity: pat.targetEntity === oldName ? newName : pat.targetEntity,
      }));
    }

    onChangeDraft({
      ...draft,
      entities: updatedEntities,
      relationships: updatedRelationships,
      designPatterns: updatedPatterns,
    });
  };

  const handleRemoveEntity = (index: number) => {
    const entityToRemove = draft.entities?.[index]?.name;
    const updatedEntities = (draft.entities || []).filter((_, i) => i !== index);
    // Remove relations pointing to deleted entity
    const updatedRelations = (draft.relationships || []).filter(
      (r) => r.source !== entityToRemove && r.target !== entityToRemove
    );
    const updatedPatterns = (draft.designPatterns || []).filter(
      (p) => p.targetEntity !== entityToRemove
    );
    onChangeDraft({
      ...draft,
      entities: updatedEntities,
      relationships: updatedRelations,
      designPatterns: updatedPatterns,
    });
  };

  // 3. Relationships
  const handleAddRelationship = () => {
    if (!draft.entities || draft.entities.length < 2) return;
    const newRel: RelationshipDefinition = {
      source: draft.entities[0].name,
      target: draft.entities[1].name,
      type: 'has_a',
      description: '',
    };
    onChangeDraft({ ...draft, relationships: [...(draft.relationships || []), newRel] });
  };

  const handleUpdateRelationship = (index: number, rel: RelationshipDefinition) => {
    const updated = [...(draft.relationships || [])];
    updated[index] = rel;
    onChangeDraft({ ...draft, relationships: updated });
  };

  const handleRemoveRelationship = (index: number) => {
    onChangeDraft({
      ...draft,
      relationships: (draft.relationships || []).filter((_, i) => i !== index),
    });
  };

  // 4. Design Patterns
  const handleAddPattern = () => {
    if (!draft.entities || draft.entities.length === 0) return;
    const newPattern: DesignPatternUsage = {
      patternName: 'Strategy Pattern',
      targetEntity: draft.entities[0].name,
      justification: 'Decouples implementation logic and allows dynamic swapping.',
    };
    onChangeDraft({ ...draft, designPatterns: [...(draft.designPatterns || []), newPattern] });
  };

  const handleUpdatePattern = (index: number, pattern: DesignPatternUsage) => {
    const updated = [...(draft.designPatterns || [])];
    updated[index] = pattern;
    onChangeDraft({ ...draft, designPatterns: updated });
  };

  const handleRemovePattern = (index: number) => {
    onChangeDraft({
      ...draft,
      designPatterns: (draft.designPatterns || []).filter((_, i) => i !== index),
    });
  };

  // 5. Edge Cases
  const handleAddEdgeCase = () => {
    onChangeDraft({
      ...draft,
      edgeCasesConsidered: [...(draft.edgeCasesConsidered || []), ''],
    });
  };

  const handleUpdateEdgeCase = (index: number, val: string) => {
    const updated = [...(draft.edgeCasesConsidered || [])];
    updated[index] = val;
    onChangeDraft({ ...draft, edgeCasesConsidered: updated });
  };

  const handleRemoveEdgeCase = (index: number) => {
    onChangeDraft({
      ...draft,
      edgeCasesConsidered: (draft.edgeCasesConsidered || []).filter((_, i) => i !== index),
    });
  };

  const entityNames = (draft.entities || []).map((e) => e.name);

  return (
    <div className="bg-white border-4 border-black shadow-neo-xl flex flex-col">
      {/* Editor Action Header */}
      <div
        id="section-editor-header"
        className="border-b-4 border-black bg-cream p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-lime text-black font-black">
              Revision #{revisionNumber}
            </span>
            <span className="text-xs font-bold text-neutral-600">
              Interactive Design Studio
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Structure Your Solution
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Starter Template Action */}
          <button
            type="button"
            onClick={handleLoadStarter}
            className="neo-badge bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            title="Populates the minimal, basic starting structure"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-700" />
            Load Starter
          </button>

          {/* Sample Architecture Action */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="neo-badge bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            title="Populates a complete, illustrative example architecture with allocation and pricing strategies"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-accent fill-lime" />
            Load Sample Architecture
          </button>

          {/* View Mode Toggle */}
          <div className="border-2 border-black p-0.5 bg-white flex shadow-neo-sm">
            <button
              type="button"
              onClick={() => handleTabChange('form')}
              className={`px-3 py-1 text-xs font-black uppercase transition-colors cursor-pointer ${
                activeTab === 'form' ? 'bg-black text-lime' : 'text-black hover:bg-neutral-100'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('json')}
              className={`px-3 py-1 text-xs font-black uppercase flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'json' ? 'bg-black text-lime' : 'text-black hover:bg-neutral-100'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'json' ? (
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
            <span>Edit or inspect raw JSON specification:</span>
            <button
              type="button"
              onClick={handleJsonApply}
              className="neo-btn-primary py-1 px-4 text-xs"
            >
              Apply JSON to Form
            </button>
          </div>

          {jsonError && (
            <div className="bg-red-100 border-2 border-black p-3 text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {jsonError}
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={22}
            className="w-full font-mono text-xs p-4 bg-cream border-2 border-black focus:outline-none focus:ring-2 focus:ring-black selection:bg-lime selection:text-black leading-relaxed"
          />
        </div>
      ) : (
        <div className="p-6 md:p-8 flex flex-col gap-10">
          {/* Validation Summary Box */}
          {validationErrors.length > 0 && (
            <div
              id="validation-summary-box"
              className="border-4 border-black bg-red-50 p-4 md:p-6 shadow-neo-md flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-red-500 border-2 border-black shadow-neo-sm flex items-center justify-center text-white font-black text-sm">
                    !
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-base text-red-950 uppercase tracking-tight">
                      Submission has {validationErrors.length} validation{' '}
                      {validationErrors.length === 1 ? 'error' : 'errors'}.
                    </h3>
                    <p className="text-xs font-bold text-red-800">
                      Fix the highlighted fields below. Click any item to jump directly to the field.
                    </p>
                  </div>
                </div>
                <span className="neo-badge bg-red-200 text-red-950 border border-black font-mono text-[11px]">
                  {validationErrors.length} {validationErrors.length === 1 ? 'ISSUE' : 'ISSUES'}
                </span>
              </div>

              <ul className="space-y-2 mt-1">
                {validationErrors.map((err, errIdx) => {
                  const loc = formatErrorLocation(err.path, draft);
                  return (
                    <li key={errIdx}>
                      <button
                        type="button"
                        onClick={() => scrollToError(loc.elementId)}
                        className="w-full text-left bg-white hover:bg-red-100 border-2 border-black p-2.5 shadow-neo-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start sm:items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                          <span className="neo-badge bg-red-100 group-hover:bg-red-200 text-red-950 text-[10px] font-mono shrink-0">
                            {loc.label}
                          </span>
                          <span className="text-xs font-bold text-red-950">{err.message}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-neutral-600 group-hover:text-black shrink-0 underline">
                          Jump to field →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* SECTION 1: Assumptions */}
          <section id="section-assumptions" className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> 1. Operational Assumptions
              </h3>
              <button
                type="button"
                onClick={handleAddAssumption}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Assumption
              </button>
            </div>

            {getFieldError('assumptions') && (
              <div className="bg-red-100 border-2 border-black p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{getFieldError('assumptions')}</span>
              </div>
            )}

            <div className="space-y-3">
              {(draft.assumptions || []).map((assumption, idx) => {
                const assumptionError = getFieldError(`assumptions.${idx}`);
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        id={`field-assumptions-${idx}`}
                        type="text"
                        value={assumption}
                        onChange={(e) => handleUpdateAssumption(idx, e.target.value)}
                        placeholder="e.g. Multi-level structure with separate gates for entry and exit"
                        className={`flex-1 p-2 text-xs font-medium focus:outline-none focus:ring-2 border-2 ${
                          assumptionError
                            ? 'border-red-600 bg-red-50 ring-2 ring-red-400 focus:ring-red-600'
                            : 'bg-cream border-black focus:ring-black'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAssumption(idx)}
                        className="p-2 border-2 border-black bg-white hover:bg-red-100 text-black shadow-neo-sm cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {assumptionError && (
                      <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                        <span>{assumptionError}</span>
                      </p>
                    )}
                  </div>
                );
              })}
              {(!draft.assumptions || draft.assumptions.length === 0) && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No assumptions added yet. Click &quot;Add Assumption&quot; to declare system boundaries.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 2: Entities & Responsibilities */}
          <section id="section-entities" className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. Classes & Responsibilities ({(draft.entities || []).length})
                </h3>
                <span className="text-xs font-bold text-neutral-600">
                  Define your object model with cohesive boundaries
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddEntity}
                className="neo-btn-primary py-1.5 px-3 text-xs gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Class / Entity
              </button>
            </div>

            {getFieldError('entities') && (
              <div className="bg-red-100 border-2 border-black p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{getFieldError('entities')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(draft.entities || []).map((entity, idx) => {
                const nameError = getFieldError(`entities.${idx}.name`);
                const respErrors = getFieldErrorsPrefix(`entities.${idx}.responsibilities`);
                const attrError = getFieldError(`entities.${idx}.attributes`);
                const methodError = getFieldError(`entities.${idx}.methods`);
                const hasEntityError = Boolean(
                  nameError || respErrors.length > 0 || attrError || methodError
                );

                return (
                  <div
                    key={idx}
                    className={`border-2 p-4 shadow-neo-sm flex flex-col justify-between gap-3 ${
                      hasEntityError
                        ? 'bg-red-50/40 border-red-600 ring-2 ring-red-300'
                        : 'bg-cream border-black'
                    }`}
                  >
                    <div>
                      {/* Name & Type row */}
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            id={`field-entities-${idx}-name`}
                            type="text"
                            value={entity.name || ''}
                            onChange={(e) =>
                              handleUpdateEntity(idx, { ...entity, name: e.target.value })
                            }
                            placeholder="ClassName"
                            className={`font-black text-base px-2 py-1 w-2/3 focus:outline-none border-2 ${
                              nameError
                                ? 'border-red-600 bg-red-50 ring-2 ring-red-400 focus:ring-red-600'
                                : 'bg-white border-black'
                            }`}
                          />

                          <select
                            id={`field-entities-${idx}-type`}
                            value={entity.type || 'class'}
                            onChange={(e) =>
                              handleUpdateEntity(idx, {
                                ...entity,
                                type: e.target.value as EntityType,
                              })
                            }
                            className="bg-white border-2 border-black px-2 py-1 text-xs font-bold uppercase focus:outline-none cursor-pointer"
                          >
                            <option value="class">class</option>
                            <option value="abstract_class">abstract class</option>
                            <option value="interface">interface</option>
                            <option value="enum">enum</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveEntity(idx)}
                            className="p-1 border border-black bg-white hover:bg-red-100 cursor-pointer"
                            title="Delete entity"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-neutral-800" />
                          </button>
                        </div>

                        {nameError && (
                          <p className="text-[11px] font-bold text-red-700 mt-1 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>{nameError}</span>
                          </p>
                        )}
                      </div>

                      {/* Responsibilities */}
                      <div className="mb-3">
                        <label className="text-[11px] font-black uppercase text-neutral-700 block mb-1">
                          Primary Responsibilities (1 per line):
                        </label>
                        <textarea
                          id={`field-entities-${idx}-responsibilities`}
                          rows={2}
                          value={(entity.responsibilities || []).join('\n')}
                          onChange={(e) =>
                            handleUpdateEntity(idx, {
                              ...entity,
                              responsibilities: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          placeholder="Coordinates spots and gates..."
                          className={`w-full text-xs p-2 focus:outline-none font-medium border ${
                            respErrors.length > 0
                              ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                              : 'bg-white border-black'
                          }`}
                        />
                        {respErrors.map((msg, rIdx) => (
                          <p
                            key={rIdx}
                            className="text-[11px] font-bold text-red-700 flex items-start gap-1 mt-0.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>{msg}</span>
                          </p>
                        ))}
                      </div>

                      {/* Methods & Attributes */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-black uppercase text-neutral-700 block mb-0.5">
                            Attributes:
                          </label>
                          <textarea
                            id={`field-entities-${idx}-attributes`}
                            rows={2}
                            value={(entity.attributes || []).join('\n')}
                            onChange={(e) =>
                              handleUpdateEntity(idx, {
                                ...entity,
                                attributes: e.target.value.split('\n').filter(Boolean),
                              })
                            }
                            placeholder="id: string"
                            className={`w-full text-[11px] font-mono p-1.5 focus:outline-none border ${
                              attrError
                                ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                                : 'bg-white border-black'
                            }`}
                          />
                          {attrError && (
                            <p className="text-[10px] font-bold text-red-700 flex items-start gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0 text-red-600 mt-0.5" />
                              <span>{attrError}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-neutral-700 block mb-0.5">
                            Methods:
                          </label>
                          <textarea
                            id={`field-entities-${idx}-methods`}
                            rows={2}
                            value={(entity.methods || []).join('\n')}
                            onChange={(e) =>
                              handleUpdateEntity(idx, {
                                ...entity,
                                methods: e.target.value.split('\n').filter(Boolean),
                              })
                            }
                            placeholder="park(): void"
                            className={`w-full text-[11px] font-mono p-1.5 focus:outline-none border ${
                              methodError
                                ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                                : 'bg-white border-black'
                            }`}
                          />
                          {methodError && (
                            <p className="text-[10px] font-bold text-red-700 flex items-start gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0 text-red-600 mt-0.5" />
                              <span>{methodError}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: Relationships */}
          <section id="section-relationships" className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> 3. Relationships ({(draft.relationships || []).length})
              </h3>
              <button
                type="button"
                onClick={handleAddRelationship}
                disabled={!draft.entities || draft.entities.length < 2}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Add Relationship
              </button>
            </div>

            {getFieldError('relationships') && (
              <div className="bg-red-100 border-2 border-black p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{getFieldError('relationships')}</span>
              </div>
            )}

            <div className="space-y-3">
              {(draft.relationships || []).map((rel, idx) => {
                const sourceError = getFieldError(`relationships.${idx}.source`);
                const targetError = getFieldError(`relationships.${idx}.target`);
                const hasRelError = Boolean(sourceError || targetError);

                return (
                  <div
                    key={idx}
                    id={`field-relationships-${idx}`}
                    className={`border p-2.5 flex flex-wrap items-center gap-2 text-xs font-bold ${
                      hasRelError
                        ? 'bg-red-50/50 border-red-600 ring-2 ring-red-300'
                        : 'bg-cream border-black'
                    }`}
                  >
                    <select
                      value={rel.source}
                      onChange={(e) =>
                        handleUpdateRelationship(idx, { ...rel, source: e.target.value })
                      }
                      className={`px-2 py-1 border cursor-pointer ${
                        sourceError
                          ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                          : 'bg-white border-black'
                      }`}
                    >
                      {entityNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={rel.type}
                      onChange={(e) =>
                        handleUpdateRelationship(idx, {
                          ...rel,
                          type: e.target.value as RelationshipType,
                        })
                      }
                      className="bg-white border border-black px-2 py-1 font-mono uppercase text-[11px] cursor-pointer"
                    >
                      <option value="has_many">has_many</option>
                      <option value="has_a">has_a</option>
                      <option value="uses">uses</option>
                      <option value="implements">implements</option>
                      <option value="inherits">inherits</option>
                      <option value="aggregates">aggregates</option>
                      <option value="composes">composes</option>
                    </select>

                    <select
                      value={rel.target}
                      onChange={(e) =>
                        handleUpdateRelationship(idx, { ...rel, target: e.target.value })
                      }
                      className={`px-2 py-1 border cursor-pointer ${
                        targetError
                          ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                          : 'bg-white border-black'
                      }`}
                    >
                      {entityNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={rel.description || ''}
                      onChange={(e) =>
                        handleUpdateRelationship(idx, { ...rel, description: e.target.value })
                      }
                      placeholder="Description / Context (optional)"
                      className="flex-1 min-w-[150px] bg-white border border-black px-2 py-1 font-normal text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveRelationship(idx)}
                      className="p-1 border border-black bg-white hover:bg-red-100 cursor-pointer"
                      title="Remove relation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {hasRelError && (
                      <div className="w-full mt-1.5 pt-1.5 border-t border-red-300 space-y-1">
                        {sourceError && (
                          <p className="text-[11px] font-bold text-red-700 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>
                              <strong>Source Entity:</strong> {sourceError}
                            </span>
                          </p>
                        )}
                        {targetError && (
                          <p className="text-[11px] font-bold text-red-700 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>
                              <strong>Target Entity:</strong> {targetError}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!draft.relationships || draft.relationships.length === 0) && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No relationships declared. Connect classes to show containment and dependencies.
                </p>
              )}
            </div>
          </section>          {/* SECTION 4: Design Patterns */}
          <section id="section-designPatterns" className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4" /> 4. Design Patterns Applied ({(draft.designPatterns || []).length})
              </h3>
              <button
                type="button"
                onClick={handleAddPattern}
                disabled={!draft.entities || draft.entities.length === 0}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Declare Pattern
              </button>
            </div>

            {getFieldError('designPatterns') && (
              <div className="bg-red-100 border-2 border-black p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{getFieldError('designPatterns')}</span>
              </div>
            )}

            <div className="space-y-3">
              {(draft.designPatterns || []).map((pat, idx) => {
                const patNameError = getFieldError(`designPatterns.${idx}.patternName`);
                const targetEntityError = getFieldError(`designPatterns.${idx}.targetEntity`);
                const justificationError = getFieldError(`designPatterns.${idx}.justification`);
                const hasPatternError = Boolean(
                  patNameError || targetEntityError || justificationError
                );

                return (
                  <div
                    key={idx}
                    id={`field-designPatterns-${idx}`}
                    className={`border p-3 flex flex-col md:flex-row items-start md:items-center gap-3 text-xs font-bold flex-wrap ${
                      hasPatternError
                        ? 'bg-red-50/50 border-red-600 ring-2 ring-red-300'
                        : 'bg-cream border-black'
                    }`}
                  >
                    <input
                      type="text"
                      value={pat.patternName || ''}
                      onChange={(e) =>
                        handleUpdatePattern(idx, { ...pat, patternName: e.target.value })
                      }
                      placeholder="Pattern Name (e.g. Strategy Pattern)"
                      className={`px-2 py-1 w-full md:w-1/4 border ${
                        patNameError
                          ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                          : 'bg-white border-black'
                      }`}
                    />

                    <div className="flex items-center gap-1 w-full md:w-1/4">
                      <span className="text-[10px] font-black uppercase text-neutral-600">On:</span>
                      <select
                        value={pat.targetEntity}
                        onChange={(e) =>
                          handleUpdatePattern(idx, { ...pat, targetEntity: e.target.value })
                        }
                        className={`px-2 py-1 w-full font-bold border cursor-pointer ${
                          targetEntityError
                            ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                            : 'bg-white border-black'
                        }`}
                      >
                        {entityNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={pat.justification || ''}
                      onChange={(e) =>
                        handleUpdatePattern(idx, { ...pat, justification: e.target.value })
                      }
                      placeholder="Justification (e.g. allows pluggable spot search heuristics)"
                      className={`px-2 py-1 flex-1 w-full font-normal border ${
                        justificationError
                          ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                          : 'bg-white border-black'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemovePattern(idx)}
                      className="p-1 border border-black bg-white hover:bg-red-100 shrink-0 cursor-pointer"
                      title="Remove pattern"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {hasPatternError && (
                      <div className="w-full mt-1.5 pt-1.5 border-t border-red-300 space-y-1">
                        {patNameError && (
                          <p className="text-[11px] font-bold text-red-700 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>
                              <strong>Pattern Name:</strong> {patNameError}
                            </span>
                          </p>
                        )}
                        {targetEntityError && (
                          <p className="text-[11px] font-bold text-red-700 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>
                              <strong>Target Entity:</strong> {targetEntityError}
                            </span>
                          </p>
                        )}
                        {justificationError && (
                          <p className="text-[11px] font-bold text-red-700 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                            <span>
                              <strong>Justification:</strong> {justificationError}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!draft.designPatterns || draft.designPatterns.length === 0) && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No patterns declared. Applying Strategy or Factory patterns enhances extensibility scores.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 5: Edge Cases */}
          <section id="section-edgeCases" className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> 5. Edge Cases & Concurrency ({(draft.edgeCasesConsidered || []).length})
              </h3>
              <button
                type="button"
                onClick={handleAddEdgeCase}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Edge Case
              </button>
            </div>

            {getFieldError('edgeCasesConsidered') && (
              <div className="bg-red-100 border-2 border-black p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{getFieldError('edgeCasesConsidered')}</span>
              </div>
            )}

            <div className="space-y-3">
              {(draft.edgeCasesConsidered || []).map((edgeCase, idx) => {
                const edgeError = getFieldError(`edgeCasesConsidered.${idx}`);

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        id={`field-edgeCases-${idx}`}
                        type="text"
                        value={edgeCase}
                        onChange={(e) => handleUpdateEdgeCase(idx, e.target.value)}
                        placeholder="e.g. Simultaneous gate entry handled via atomic spot reservation"
                        className={`flex-1 p-2 text-xs font-medium focus:outline-none focus:ring-2 border-2 ${
                          edgeError
                            ? 'border-red-600 bg-red-50 ring-2 ring-red-400 focus:ring-red-600'
                            : 'bg-cream border-black focus:ring-black'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEdgeCase(idx)}
                        className="p-2 border-2 border-black bg-white hover:bg-red-100 shadow-neo-sm cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {edgeError && (
                      <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                        <span>{edgeError}</span>
                      </p>
                    )}
                  </div>
                );
              })}
              {(!draft.edgeCasesConsidered || draft.edgeCasesConsidered.length === 0) && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No edge cases documented yet. Document full-lot handling and multi-gate race conditions.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Submit Action Footer */}
      <div className="border-t-4 border-black bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-40">
        <div className="flex items-center gap-3 text-xs font-bold text-neutral-600">
          <span>{(draft.entities || []).length} classes declared</span> •{' '}
          <span>{(draft.relationships || []).length} relationships</span> •{' '}
          <span>{(draft.designPatterns || []).length} patterns</span>
          {validationErrors.length > 0 && (
            <span className="neo-badge bg-red-200 text-red-950 border border-black text-[11px]">
              {validationErrors.length} {validationErrors.length === 1 ? 'error' : 'errors'} to fix
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !draft.entities || draft.entities.length < 2}
          className="neo-btn-primary w-full sm:w-auto px-8 gap-2 text-base cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-white rounded-full animate-spin" />
              Evaluating Architecture...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Revision #{revisionNumber} for Evaluation
            </>
          )}
        </button>
      </div>

      {/* Draft Replacement Confirmation Modal */}
      {replacementTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="replacement-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white border-4 border-black shadow-neo-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-200 border-2 border-black flex items-center justify-center shadow-neo-sm shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <span className="neo-badge bg-black text-lime font-black text-[10px] py-0 px-1.5 mb-1 inline-block">
                  Confirm Replacement
                </span>
                <h3 id="replacement-dialog-title" className="text-xl font-black tracking-tight leading-snug">
                  {replacementTarget === 'starter'
                    ? 'Load Starter Structure?'
                    : 'Load Sample Architecture?'}
                </h3>
              </div>
            </div>

            <p className="text-sm font-medium text-neutral-800 leading-relaxed mb-6">
              {replacementTarget === 'starter'
                ? 'Your current editor draft contains modified data. Loading the starter will replace your draft with a basic starting structure (minimal entities and core responsibilities, leaving design decisions to you). Any unsaved changes will be lost.'
                : 'Your current editor draft contains modified data. Loading the sample architecture will replace your draft with a complete example architecture illustrating component separation, allocation, and pricing strategies. Any unsaved changes will be lost.'}
            </p>

            <div className="flex items-center justify-end gap-3 border-t-2 border-black pt-4">
              <button
                type="button"
                onClick={() => setReplacementTarget(null)}
                className="neo-btn-secondary py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyReplacement(replacementTarget)}
                className="neo-btn-primary py-2 px-4 text-xs font-black gap-1.5"
              >
                {replacementTarget === 'starter'
                  ? 'Confirm & Load Starter'
                  : 'Confirm & Load Sample'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
