import type { StructuredDesign, ValidationErrorDetail } from '../types';

/**
 * Validates a structured design draft against the domain schema requirements.
 * Returns an array of field-level validation error details.
 */
export function validateStructuredDesign(draft: StructuredDesign): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  // 1. Operational Assumptions
  if (!draft.assumptions || draft.assumptions.length === 0) {
    errors.push({
      path: 'assumptions',
      message: 'Please state at least one domain assumption.',
    });
  } else {
    draft.assumptions.forEach((assumption, idx) => {
      if (!assumption || assumption.trim().length < 3) {
        errors.push({
          path: `assumptions.${idx}`,
          message: 'Assumption must be at least 3 characters.',
        });
      }
    });
  }

  // 2. Entities & Responsibilities
  if (!draft.entities || draft.entities.length < 2) {
    errors.push({
      path: 'entities',
      message: 'Design must declare at least 2 entities to form an object model.',
    });
  }

  const entityNameSet = new Set<string>();

  draft.entities?.forEach((entity, idx) => {
    const trimmedName = (entity.name || '').trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.push({
        path: `entities.${idx}.name`,
        message: 'Entity name must be at least 2 characters.',
      });
    } else if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(trimmedName)) {
      errors.push({
        path: `entities.${idx}.name`,
        message:
          'Entity name must start with a letter and contain only alphanumeric characters or underscores (no spaces or parentheses like "(INTERFACE)"; select the interface type from the dropdown instead).',
      });
    } else {
      const lower = trimmedName.toLowerCase();
      if (entityNameSet.has(lower)) {
        errors.push({
          path: `entities.${idx}.name`,
          message: `Duplicate entity name "${trimmedName}" detected. Entity names must be unique.`,
        });
      }
      entityNameSet.add(lower);
    }

    // Responsibilities
    const validResponsibilities = (entity.responsibilities || []).filter((r) => r.trim().length > 0);
    if (validResponsibilities.length === 0) {
      errors.push({
        path: `entities.${idx}.responsibilities`,
        message: 'Each entity must declare at least one primary responsibility.',
      });
    } else {
      validResponsibilities.forEach((resp) => {
        if (resp.trim().length < 3) {
          errors.push({
            path: `entities.${idx}.responsibilities`,
            message: 'Responsibility description must be at least 3 characters.',
          });
        }
      });
    }
  });

  // Valid entity names for referential integrity checks (case-insensitive)
  const declaredNames = new Set(
    (draft.entities || []).map((e) => (e.name || '').trim().toLowerCase()).filter(Boolean)
  );

  // 3. Relationships
  draft.relationships?.forEach((rel, idx) => {
    const sourceTrimmed = (rel.source || '').trim();
    const targetTrimmed = (rel.target || '').trim();

    if (!sourceTrimmed) {
      errors.push({
        path: `relationships.${idx}.source`,
        message: 'Source entity is required.',
      });
    } else if (!declaredNames.has(sourceTrimmed.toLowerCase())) {
      errors.push({
        path: `relationships.${idx}.source`,
        message: `Relationship source entity "${rel.source}" is not declared in the entities list.`,
      });
    }

    if (!targetTrimmed) {
      errors.push({
        path: `relationships.${idx}.target`,
        message: 'Target entity is required.',
      });
    } else if (!declaredNames.has(targetTrimmed.toLowerCase())) {
      errors.push({
        path: `relationships.${idx}.target`,
        message: `Relationship target entity "${rel.target}" is not declared in the entities list.`,
      });
    }
  });

  // 4. Design Patterns
  draft.designPatterns?.forEach((pat, idx) => {
    const patternNameTrimmed = (pat.patternName || '').trim();
    const targetTrimmed = (pat.targetEntity || '').trim();
    const justificationTrimmed = (pat.justification || '').trim();

    if (!patternNameTrimmed || patternNameTrimmed.length < 2) {
      errors.push({
        path: `designPatterns.${idx}.patternName`,
        message: 'Pattern name is required (at least 2 characters).',
      });
    }

    if (!targetTrimmed) {
      errors.push({
        path: `designPatterns.${idx}.targetEntity`,
        message: 'Target entity is required.',
      });
    } else if (!declaredNames.has(targetTrimmed.toLowerCase())) {
      errors.push({
        path: `designPatterns.${idx}.targetEntity`,
        message: `Design pattern target entity "${pat.targetEntity}" is not declared in the entities list.`,
      });
    }

    if (!justificationTrimmed || justificationTrimmed.length < 5) {
      errors.push({
        path: `designPatterns.${idx}.justification`,
        message: 'Justification must explain why this design pattern was chosen (min 5 characters).',
      });
    }
  });

  // 5. Edge Cases
  if (!draft.edgeCasesConsidered || draft.edgeCasesConsidered.length === 0) {
    errors.push({
      path: 'edgeCasesConsidered',
      message: 'Please document at least one operational or capacity edge case.',
    });
  } else {
    draft.edgeCasesConsidered.forEach((edgeCase, idx) => {
      if (!edgeCase || edgeCase.trim().length < 3) {
        errors.push({
          path: `edgeCasesConsidered.${idx}`,
          message: 'Edge case description must be at least 3 characters.',
        });
      }
    });
  }

  return errors;
}

/**
 * Returns a human-friendly label, section, and DOM element ID for a given error path.
 */
export function formatErrorLocation(
  path: string,
  draft: StructuredDesign
): { section: string; label: string; elementId: string } {
  const parts = path.split('.');
  const [section, indexStr, field] = parts;
  const index = indexStr !== undefined ? parseInt(indexStr, 10) : undefined;

  if (section === 'entities') {
    if (index !== undefined && !isNaN(index)) {
      const entity = draft.entities?.[index];
      const name = entity?.name ? `"${entity.name}"` : `#${index + 1}`;
      let fieldLabel = 'Field';
      if (field === 'name') fieldLabel = 'Name';
      else if (field === 'responsibilities') fieldLabel = 'Responsibilities';
      else if (field === 'attributes') fieldLabel = 'Attributes';
      else if (field === 'methods') fieldLabel = 'Methods';
      else if (field === 'type') fieldLabel = 'Type';

      return {
        section: 'Classes & Responsibilities',
        label: `Class ${name} • ${fieldLabel}`,
        elementId: `field-entities-${index}-${field || 'name'}`,
      };
    }
    return {
      section: 'Classes & Responsibilities',
      label: 'Classes & Responsibilities',
      elementId: 'section-entities',
    };
  }

  if (section === 'relationships') {
    if (index !== undefined && !isNaN(index)) {
      const rel = draft.relationships?.[index];
      const relDesc = rel
        ? `${rel.source || 'Source'} → ${rel.target || 'Target'}`
        : `#${index + 1}`;
      const fieldLabel =
        field === 'source'
          ? 'Source Entity'
          : field === 'target'
          ? 'Target Entity'
          : 'Relationship';
      return {
        section: 'Relationships',
        label: `Relationship #${index + 1} (${relDesc}) • ${fieldLabel}`,
        elementId: `field-relationships-${index}`,
      };
    }
    return {
      section: 'Relationships',
      label: 'Relationships',
      elementId: 'section-relationships',
    };
  }

  if (section === 'designPatterns') {
    if (index !== undefined && !isNaN(index)) {
      const pat = draft.designPatterns?.[index];
      const patName = pat?.patternName || `#${index + 1}`;
      let fieldLabel = 'Pattern';
      if (field === 'patternName') fieldLabel = 'Pattern Name';
      else if (field === 'targetEntity') fieldLabel = 'Target Entity';
      else if (field === 'justification') fieldLabel = 'Justification';

      return {
        section: 'Design Patterns',
        label: `Pattern: "${patName}" • ${fieldLabel}`,
        elementId: `field-designPatterns-${index}`,
      };
    }
    return {
      section: 'Design Patterns',
      label: 'Design Patterns',
      elementId: 'section-designPatterns',
    };
  }

  if (section === 'assumptions') {
    if (index !== undefined && !isNaN(index)) {
      return {
        section: 'Operational Assumptions',
        label: `Assumption #${index + 1}`,
        elementId: `field-assumptions-${index}`,
      };
    }
    return {
      section: 'Operational Assumptions',
      label: 'Operational Assumptions',
      elementId: 'section-assumptions',
    };
  }

  if (section === 'edgeCasesConsidered') {
    if (index !== undefined && !isNaN(index)) {
      return {
        section: 'Edge Cases & Concurrency',
        label: `Edge Case #${index + 1}`,
        elementId: `field-edgeCases-${index}`,
      };
    }
    return {
      section: 'Edge Cases & Concurrency',
      label: 'Edge Cases & Concurrency',
      elementId: 'section-edgeCases',
    };
  }

  return {
    section: 'Submission',
    label: path,
    elementId: 'section-editor-header',
  };
}
