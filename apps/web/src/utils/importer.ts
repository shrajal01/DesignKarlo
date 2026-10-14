import type {
  StructuredDesign,
  EntityDefinition,
  RelationshipDefinition,
  DesignPatternUsage,
  EntityType,
  RelationshipType,
} from '../types';

export interface ImportJsonResult {
  success: boolean;
  design?: StructuredDesign;
  error?: string;
}

const VALID_ENTITY_TYPES: Set<EntityType> = new Set(['class', 'interface', 'abstract_class', 'enum']);
const VALID_RELATIONSHIP_TYPES: Set<RelationshipType> = new Set([
  'has_a',
  'has_many',
  'inherits',
  'implements',
  'uses',
  'aggregates',
  'composes',
]);

/**
 * Safely parses, validates, and normalizes a raw JSON string into a valid StructuredDesign.
 * Handles missing optional fields (attributes, methods, relationships, patterns),
 * field aliases (edgeCases -> edgeCasesConsidered, relations -> relationships, patterns -> designPatterns),
 * and object/string type coercions without crashing the application.
 *
 * If parsing or structure validation fails, returns an informative error message and no design,
 * allowing the caller to display the error and preserve current form state.
 */
export function normalizeAndValidateImportJson(
  rawText: string,
  defaultProblemSlug: string = 'parking-lot'
): ImportJsonResult {
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      error: 'Please paste a JSON specification before applying.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? `Invalid JSON syntax: ${err.message}` : 'Invalid JSON format',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Imported JSON must be an object representing a structured design specification.',
    };
  }

  const record = parsed as Record<string, unknown>;

  // 1. Entities (mandatory core of any design)
  if (!record.entities || !Array.isArray(record.entities)) {
    return {
      success: false,
      error: 'Imported JSON must contain an "entities" array with at least 2 entities.',
    };
  }

  if (record.entities.length < 2) {
    return {
      success: false,
      error: 'Design must declare at least 2 entities to form an object model.',
    };
  }

  const normalizedEntities: EntityDefinition[] = [];
  for (let i = 0; i < record.entities.length; i++) {
    const rawEnt = record.entities[i];
    if (!rawEnt || typeof rawEnt !== 'object' || Array.isArray(rawEnt)) {
      return {
        success: false,
        error: `Entity at index ${i} is invalid (must be an object).`,
      };
    }

    const entObj = rawEnt as Record<string, unknown>;
    const name = typeof entObj.name === 'string' ? entObj.name.trim() : '';
    if (!name) {
      return {
        success: false,
        error: `Entity at index ${i} is missing a required "name" property.`,
      };
    }

    // Normalize entity type (case-insensitive, handles hyphen/space to underscore)
    let type: EntityType = 'class';
    if (typeof entObj.type === 'string') {
      const cleanedType = entObj.type.toLowerCase().trim().replace(/[\s-]+/g, '_');
      if (VALID_ENTITY_TYPES.has(cleanedType as EntityType)) {
        type = cleanedType as EntityType;
      }
    }

    // Normalize responsibilities
    let responsibilities: string[] = [];
    if (Array.isArray(entObj.responsibilities)) {
      responsibilities = entObj.responsibilities
        .map((r) => (typeof r === 'string' ? r.trim() : String(r || '').trim()))
        .filter(Boolean);
    } else if (typeof entObj.responsibilities === 'string' && entObj.responsibilities.trim()) {
      responsibilities = entObj.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean);
    }

    // Normalize attributes: supports string[], string (newline-separated), or object[] ({name, type})
    let attributes: string[] = [];
    if (Array.isArray(entObj.attributes)) {
      attributes = entObj.attributes
        .map((attr) => {
          if (typeof attr === 'string') return attr.trim();
          if (attr && typeof attr === 'object') {
            const a = attr as Record<string, unknown>;
            const attrName = a.name || a.fieldName || '';
            const attrType = a.type || a.dataType || '';
            return attrType ? `${attrName}: ${attrType}` : String(attrName || '').trim();
          }
          return String(attr || '').trim();
        })
        .filter(Boolean);
    } else if (typeof entObj.attributes === 'string' && entObj.attributes.trim()) {
      attributes = entObj.attributes.split('\n').map((a) => a.trim()).filter(Boolean);
    }

    // Normalize methods: supports string[], string (newline-separated), or object[] ({name, parameters, returnType})
    let methods: string[] = [];
    if (Array.isArray(entObj.methods)) {
      methods = entObj.methods
        .map((method) => {
          if (typeof method === 'string') return method.trim();
          if (method && typeof method === 'object') {
            const m = method as Record<string, unknown>;
            const mName = m.name || m.methodName || '';
            const mParams = m.parameters || m.params || '';
            const mRet = m.returnType || m.returns || '';
            return `${mName}(${mParams})${mRet ? `: ${mRet}` : ''}`;
          }
          return String(method || '').trim();
        })
        .filter(Boolean);
    } else if (typeof entObj.methods === 'string' && entObj.methods.trim()) {
      methods = entObj.methods.split('\n').map((m) => m.trim()).filter(Boolean);
    }

    normalizedEntities.push({
      name,
      type,
      responsibilities,
      attributes,
      methods,
    });
  }

  // 2. Operational Assumptions
  let assumptions: string[] = [];
  if (Array.isArray(record.assumptions)) {
    assumptions = record.assumptions
      .map((a) => (typeof a === 'string' ? a.trim() : String(a || '').trim()))
      .filter(Boolean);
  } else if (typeof record.assumptions === 'string' && record.assumptions.trim()) {
    assumptions = record.assumptions.split('\n').map((a) => a.trim()).filter(Boolean);
  }

  if (assumptions.length === 0) {
    return {
      success: false,
      error: 'Please state at least one domain assumption under "assumptions".',
    };
  }

  // 3. Edge Cases & Concurrency (supports "edgeCasesConsidered" or alias "edgeCases")
  const rawEdgeCases =
    record.edgeCasesConsidered !== undefined ? record.edgeCasesConsidered : record.edgeCases;

  let edgeCasesConsidered: string[] = [];
  if (Array.isArray(rawEdgeCases)) {
    edgeCasesConsidered = rawEdgeCases
      .map((e) => (typeof e === 'string' ? e.trim() : String(e || '').trim()))
      .filter(Boolean);
  } else if (typeof rawEdgeCases === 'string' && rawEdgeCases.trim()) {
    edgeCasesConsidered = rawEdgeCases.split('\n').map((e) => e.trim()).filter(Boolean);
  }

  if (edgeCasesConsidered.length === 0) {
    return {
      success: false,
      error: 'Please document at least one operational or capacity edge case under "edgeCasesConsidered" (or "edgeCases").',
    };
  }

  // 4. Relationships (supports "relationships" or alias "relations", plus entity-level relations)
  const normalizedRelationships: RelationshipDefinition[] = [];
  const rawRels = Array.isArray(record.relationships)
    ? record.relationships
    : Array.isArray(record.relations)
    ? record.relations
    : [];

  for (let i = 0; i < rawRels.length; i++) {
    const rawRel = rawRels[i];
    if (rawRel && typeof rawRel === 'object') {
      const relObj = rawRel as Record<string, unknown>;
      const source = typeof relObj.source === 'string' ? relObj.source.trim() : '';
      const target = typeof relObj.target === 'string' ? relObj.target.trim() : '';

      let relType: RelationshipType = 'uses';
      if (typeof relObj.type === 'string') {
        const cleanedType = relObj.type.toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (VALID_RELATIONSHIP_TYPES.has(cleanedType as RelationshipType)) {
          relType = cleanedType as RelationshipType;
        }
      }

      normalizedRelationships.push({
        source: source || normalizedEntities[0].name,
        target: target || normalizedEntities[1]?.name || normalizedEntities[0].name,
        type: relType,
        description: typeof relObj.description === 'string' ? relObj.description.trim() : undefined,
      });
    }
  }

  // Also extract relations defined on entity objects if top-level relationships was empty
  if (normalizedRelationships.length === 0 && Array.isArray(record.entities)) {
    for (const rawEnt of record.entities) {
      if (rawEnt && typeof rawEnt === 'object') {
        const entObj = rawEnt as Record<string, unknown>;
        const entName = typeof entObj.name === 'string' ? entObj.name.trim() : '';
        const entRels = Array.isArray(entObj.relationships)
          ? entObj.relationships
          : Array.isArray(entObj.relations)
          ? entObj.relations
          : [];

        for (const rel of entRels) {
          if (rel && typeof rel === 'object') {
            const relObj = rel as Record<string, unknown>;
            const target = typeof relObj.target === 'string' ? relObj.target.trim() : '';
            let relType: RelationshipType = 'uses';
            if (typeof relObj.type === 'string') {
              const cleanedType = relObj.type.toLowerCase().trim().replace(/[\s-]+/g, '_');
              if (VALID_RELATIONSHIP_TYPES.has(cleanedType as RelationshipType)) {
                relType = cleanedType as RelationshipType;
              }
            }
            if (entName && target) {
              normalizedRelationships.push({
                source: entName,
                target,
                type: relType,
                description:
                  typeof relObj.description === 'string' ? relObj.description.trim() : undefined,
              });
            }
          }
        }
      }
    }
  }

  // 5. Design Patterns (supports "designPatterns", "patterns", or "patternsUsed")
  const normalizedPatterns: DesignPatternUsage[] = [];
  const rawPatterns = Array.isArray(record.designPatterns)
    ? record.designPatterns
    : Array.isArray(record.patterns)
    ? record.patterns
    : Array.isArray(record.patternsUsed)
    ? record.patternsUsed
    : [];

  for (let i = 0; i < rawPatterns.length; i++) {
    const rawPat = rawPatterns[i];
    if (rawPat && typeof rawPat === 'object') {
      const patObj = rawPat as Record<string, unknown>;
      const patternName =
        typeof patObj.patternName === 'string'
          ? patObj.patternName.trim()
          : typeof patObj.pattern === 'string'
          ? patObj.pattern.trim()
          : '';
      const targetEntity =
        typeof patObj.targetEntity === 'string'
          ? patObj.targetEntity.trim()
          : typeof patObj.entity === 'string'
          ? patObj.entity.trim()
          : typeof patObj.target === 'string'
          ? patObj.target.trim()
          : typeof patObj.context === 'string'
          ? patObj.context.trim()
          : normalizedEntities[0].name;
      const justification =
        typeof patObj.justification === 'string'
          ? patObj.justification.trim()
          : typeof patObj.reason === 'string'
          ? patObj.reason.trim()
          : typeof patObj.description === 'string'
          ? patObj.description.trim()
          : '';

      if (patternName) {
        normalizedPatterns.push({
          patternName,
          targetEntity: targetEntity || normalizedEntities[0].name,
          justification: justification || `Applies ${patternName} to structure modular contracts.`,
        });
      }
    }
  }

  // 6. Problem Slug
  const problemSlug =
    typeof record.problemSlug === 'string' && record.problemSlug.trim()
      ? record.problemSlug.trim()
      : defaultProblemSlug;

  return {
    success: true,
    design: {
      problemSlug,
      assumptions,
      entities: normalizedEntities,
      relationships: normalizedRelationships,
      designPatterns: normalizedPatterns,
      edgeCasesConsidered,
    },
  };
}
