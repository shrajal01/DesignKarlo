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
} from '../types';

interface StructuredEditorProps {
  problem: Problem;
  draft: StructuredDesign;
  onChangeDraft: (draft: StructuredDesign) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  revisionNumber: number;
}

export function StructuredEditor({
  problem,
  draft,
  onChangeDraft,
  onSubmit,
  isSubmitting,
  revisionNumber,
}: StructuredEditorProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(draft, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync JSON text when switching to JSON tab
  const handleTabChange = (tab: 'form' | 'json') => {
    if (tab === 'json') {
      setJsonText(JSON.stringify(draft, null, 2));
      setJsonError(null);
    }
    setActiveTab(tab);
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onChangeDraft(parsed);
      setJsonError(null);
      setActiveTab('form');
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  // Helper mutators for Draft
  const handleLoadSample = () => {
    if (window.confirm('Load the sample architecture? This will replace your current editor draft.')) {
      onChangeDraft(JSON.parse(JSON.stringify(problem.sampleSolution)));
      setJsonText(JSON.stringify(problem.sampleSolution, null, 2));
    }
  };

  const handleLoadStarter = () => {
    if (window.confirm('Load the starter template? This will replace your current editor draft.')) {
      onChangeDraft(JSON.parse(JSON.stringify(problem.starterTemplate)));
      setJsonText(JSON.stringify(problem.starterTemplate, null, 2));
    }
  };

  // 1. Assumptions
  const handleAddAssumption = () => {
    onChangeDraft({
      ...draft,
      assumptions: [...draft.assumptions, ''],
    });
  };

  const handleUpdateAssumption = (index: number, val: string) => {
    const updated = [...draft.assumptions];
    updated[index] = val;
    onChangeDraft({ ...draft, assumptions: updated });
  };

  const handleRemoveAssumption = (index: number) => {
    onChangeDraft({
      ...draft,
      assumptions: draft.assumptions.filter((_, i) => i !== index),
    });
  };

  // 2. Entities
  const handleAddEntity = () => {
    const newEntity: EntityDefinition = {
      name: `Entity${draft.entities.length + 1}`,
      type: 'class',
      responsibilities: ['Defines core responsibility'],
      attributes: [],
      methods: [],
    };
    onChangeDraft({ ...draft, entities: [...draft.entities, newEntity] });
  };

  const handleUpdateEntity = (index: number, entity: EntityDefinition) => {
    const updated = [...draft.entities];
    updated[index] = entity;
    onChangeDraft({ ...draft, entities: updated });
  };

  const handleRemoveEntity = (index: number) => {
    const entityToRemove = draft.entities[index].name;
    const updatedEntities = draft.entities.filter((_, i) => i !== index);
    // Remove relations pointing to deleted entity
    const updatedRelations = draft.relationships.filter(
      (r) => r.source !== entityToRemove && r.target !== entityToRemove
    );
    onChangeDraft({
      ...draft,
      entities: updatedEntities,
      relationships: updatedRelations,
    });
  };

  // 3. Relationships
  const handleAddRelationship = () => {
    if (draft.entities.length < 2) return;
    const newRel: RelationshipDefinition = {
      source: draft.entities[0].name,
      target: draft.entities[1].name,
      type: 'has_a',
      description: '',
    };
    onChangeDraft({ ...draft, relationships: [...draft.relationships, newRel] });
  };

  const handleUpdateRelationship = (index: number, rel: RelationshipDefinition) => {
    const updated = [...draft.relationships];
    updated[index] = rel;
    onChangeDraft({ ...draft, relationships: updated });
  };

  const handleRemoveRelationship = (index: number) => {
    onChangeDraft({
      ...draft,
      relationships: draft.relationships.filter((_, i) => i !== index),
    });
  };

  // 4. Design Patterns
  const handleAddPattern = () => {
    if (draft.entities.length === 0) return;
    const newPattern: DesignPatternUsage = {
      patternName: 'Strategy Pattern',
      targetEntity: draft.entities[0].name,
      justification: 'Decouples implementation logic and allows dynamic swapping.',
    };
    onChangeDraft({ ...draft, designPatterns: [...draft.designPatterns, newPattern] });
  };

  const handleUpdatePattern = (index: number, pattern: DesignPatternUsage) => {
    const updated = [...draft.designPatterns];
    updated[index] = pattern;
    onChangeDraft({ ...draft, designPatterns: updated });
  };

  const handleRemovePattern = (index: number) => {
    onChangeDraft({
      ...draft,
      designPatterns: draft.designPatterns.filter((_, i) => i !== index),
    });
  };

  // 5. Edge Cases
  const handleAddEdgeCase = () => {
    onChangeDraft({
      ...draft,
      edgeCasesConsidered: [...draft.edgeCasesConsidered, ''],
    });
  };

  const handleUpdateEdgeCase = (index: number, val: string) => {
    const updated = [...draft.edgeCasesConsidered];
    updated[index] = val;
    onChangeDraft({ ...draft, edgeCasesConsidered: updated });
  };

  const handleRemoveEdgeCase = (index: number) => {
    onChangeDraft({
      ...draft,
      edgeCasesConsidered: draft.edgeCasesConsidered.filter((_, i) => i !== index),
    });
  };

  const entityNames = draft.entities.map((e) => e.name);

  return (
    <div className="bg-white border-4 border-black shadow-neo-xl flex flex-col">
      {/* Editor Action Header */}
      <div className="border-b-4 border-black bg-cream p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          {/* Quick Demo Pre-fill Action */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="neo-badge bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            title="Populates a complete, multi-class architecture for quick demonstration"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-accent fill-lime" />
            Load Sample Architecture
          </button>

          <button
            type="button"
            onClick={handleLoadStarter}
            className="neo-badge bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            title="Populates the minimal starting template"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-700" />
            Load Starter
          </button>

          {/* View Mode Toggle */}
          <div className="border-2 border-black p-0.5 bg-white flex shadow-neo-sm">
            <button
              type="button"
              onClick={() => handleTabChange('form')}
              className={`px-3 py-1 text-xs font-black uppercase transition-colors ${
                activeTab === 'form' ? 'bg-black text-lime' : 'text-black hover:bg-neutral-100'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('json')}
              className={`px-3 py-1 text-xs font-black uppercase flex items-center gap-1 transition-colors ${
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
          {/* SECTION 1: Assumptions */}
          <section className="flex flex-col gap-3">
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

            <div className="space-y-2">
              {draft.assumptions.map((assumption, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={assumption}
                    onChange={(e) => handleUpdateAssumption(idx, e.target.value)}
                    placeholder="e.g. Multi-level structure with separate gates for entry and exit"
                    className="flex-1 bg-cream border-2 border-black p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAssumption(idx)}
                    className="p-2 border-2 border-black bg-white hover:bg-red-100 text-black shadow-neo-sm"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {draft.assumptions.length === 0 && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No assumptions added yet. Click &quot;Add Assumption&quot; to declare system boundaries.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 2: Entities & Responsibilities */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. Classes & Responsibilities ({draft.entities.length})
                </h3>
                <span className="text-xs font-bold text-neutral-600">
                  Define your object model with cohesive boundaries
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddEntity}
                className="neo-btn-primary py-1.5 px-3 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Class / Entity
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draft.entities.map((entity, idx) => (
                <div
                  key={idx}
                  className="bg-cream border-2 border-black p-4 shadow-neo-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <input
                        type="text"
                        value={entity.name}
                        onChange={(e) =>
                          handleUpdateEntity(idx, { ...entity, name: e.target.value })
                        }
                        placeholder="ClassName"
                        className="font-black text-base bg-white border-2 border-black px-2 py-1 w-2/3 focus:outline-none"
                      />

                      <select
                        value={entity.type}
                        onChange={(e) =>
                          handleUpdateEntity(idx, {
                            ...entity,
                            type: e.target.value as EntityType,
                          })
                        }
                        className="bg-white border-2 border-black px-2 py-1 text-xs font-bold uppercase focus:outline-none"
                      >
                        <option value="class">class</option>
                        <option value="abstract_class">abstract class</option>
                        <option value="interface">interface</option>
                        <option value="enum">enum</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveEntity(idx)}
                        className="p-1 border border-black bg-white hover:bg-red-100"
                        title="Delete entity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-neutral-800" />
                      </button>
                    </div>

                    {/* Responsibilities */}
                    <div className="mb-3">
                      <label className="text-[11px] font-black uppercase text-neutral-700 block mb-1">
                        Primary Responsibilities (1 per line):
                      </label>
                      <textarea
                        rows={2}
                        value={entity.responsibilities.join('\n')}
                        onChange={(e) =>
                          handleUpdateEntity(idx, {
                            ...entity,
                            responsibilities: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        placeholder="Coordinates spots and gates..."
                        className="w-full text-xs bg-white border border-black p-2 focus:outline-none font-medium"
                      />
                    </div>

                    {/* Methods & Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-700 block mb-0.5">
                          Attributes:
                        </label>
                        <textarea
                          rows={2}
                          value={entity.attributes.join('\n')}
                          onChange={(e) =>
                            handleUpdateEntity(idx, {
                              ...entity,
                              attributes: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          placeholder="id: string"
                          className="w-full text-[11px] font-mono bg-white border border-black p-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-700 block mb-0.5">
                          Methods:
                        </label>
                        <textarea
                          rows={2}
                          value={entity.methods.join('\n')}
                          onChange={(e) =>
                            handleUpdateEntity(idx, {
                              ...entity,
                              methods: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          placeholder="park(): void"
                          className="w-full text-[11px] font-mono bg-white border border-black p-1.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Relationships */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> 3. Relationships ({draft.relationships.length})
              </h3>
              <button
                type="button"
                onClick={handleAddRelationship}
                disabled={draft.entities.length < 2}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Add Relationship
              </button>
            </div>

            <div className="space-y-2">
              {draft.relationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="bg-cream border border-black p-2.5 flex flex-wrap items-center gap-2 text-xs font-bold"
                >
                  <select
                    value={rel.source}
                    onChange={(e) =>
                      handleUpdateRelationship(idx, { ...rel, source: e.target.value })
                    }
                    className="bg-white border border-black px-2 py-1"
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
                    className="bg-white border border-black px-2 py-1 font-mono uppercase text-[11px]"
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
                    className="bg-white border border-black px-2 py-1"
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
                    className="p-1 border border-black bg-white hover:bg-red-100"
                    title="Remove relation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {draft.relationships.length === 0 && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No relationships declared. Connect classes to show containment and dependencies.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 4: Design Patterns */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4" /> 4. Design Patterns Applied ({draft.designPatterns.length})
              </h3>
              <button
                type="button"
                onClick={handleAddPattern}
                disabled={draft.entities.length === 0}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Declare Pattern
              </button>
            </div>

            <div className="space-y-3">
              {draft.designPatterns.map((pat, idx) => (
                <div
                  key={idx}
                  className="bg-cream border border-black p-3 flex flex-col md:flex-row items-start md:items-center gap-3 text-xs font-bold"
                >
                  <input
                    type="text"
                    value={pat.patternName}
                    onChange={(e) =>
                      handleUpdatePattern(idx, { ...pat, patternName: e.target.value })
                    }
                    placeholder="Pattern Name (e.g. Strategy Pattern)"
                    className="bg-white border border-black px-2 py-1 w-full md:w-1/4"
                  />

                  <div className="flex items-center gap-1 w-full md:w-1/4">
                    <span className="text-[10px] font-black uppercase text-neutral-600">On:</span>
                    <select
                      value={pat.targetEntity}
                      onChange={(e) =>
                        handleUpdatePattern(idx, { ...pat, targetEntity: e.target.value })
                      }
                      className="bg-white border border-black px-2 py-1 w-full font-bold"
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
                    value={pat.justification}
                    onChange={(e) =>
                      handleUpdatePattern(idx, { ...pat, justification: e.target.value })
                    }
                    placeholder="Justification (e.g. allows pluggable spot search heuristics)"
                    className="bg-white border border-black px-2 py-1 flex-1 w-full font-normal"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemovePattern(idx)}
                    className="p-1 border border-black bg-white hover:bg-red-100 shrink-0"
                    title="Remove pattern"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {draft.designPatterns.length === 0 && (
                <p className="text-xs font-bold text-neutral-500 italic">
                  No patterns declared. Applying Strategy or Factory patterns enhances extensibility scores.
                </p>
              )}
            </div>
          </section>

          {/* SECTION 5: Edge Cases */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> 5. Edge Cases & Concurrency ({draft.edgeCasesConsidered.length})
              </h3>
              <button
                type="button"
                onClick={handleAddEdgeCase}
                className="neo-badge bg-lime text-black hover:bg-lime-hover text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Edge Case
              </button>
            </div>

            <div className="space-y-2">
              {draft.edgeCasesConsidered.map((edgeCase, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={edgeCase}
                    onChange={(e) => handleUpdateEdgeCase(idx, e.target.value)}
                    placeholder="e.g. Simultaneous gate entry handled via atomic spot reservation"
                    className="flex-1 bg-cream border-2 border-black p-2 text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEdgeCase(idx)}
                    className="p-2 border-2 border-black bg-white hover:bg-red-100 shadow-neo-sm"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {draft.edgeCasesConsidered.length === 0 && (
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
        <div className="text-xs font-bold text-neutral-600">
          <span>{draft.entities.length} classes declared</span> •{' '}
          <span>{draft.relationships.length} relationships</span> •{' '}
          <span>{draft.designPatterns.length} patterns</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || draft.entities.length < 2}
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
    </div>
  );
}
