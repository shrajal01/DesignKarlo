import { z } from 'zod';

export const EntityTypeEnum = z.enum(['class', 'interface', 'abstract_class', 'enum']);
export type EntityType = z.infer<typeof EntityTypeEnum>;

export const RelationshipTypeEnum = z.enum([
  'has_a',
  'has_many',
  'inherits',
  'implements',
  'uses',
  'aggregates',
  'composes',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

export const EntityDefinitionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Entity name must be at least 2 characters')
    .regex(
      /^[A-Za-z][A-Za-z0-9_]*$/,
      'Entity name must start with a letter and contain only alphanumeric characters or underscores (no spaces or parentheses; select "interface" from the type dropdown instead)'
    ),
  type: EntityTypeEnum,
  responsibilities: z
    .array(z.string().trim().min(3, 'Responsibility description must be at least 3 characters'))
    .min(1, 'Each entity must declare at least one primary responsibility'),
  attributes: z.array(z.string().trim()).default([]),
  methods: z.array(z.string().trim()).default([]),
});
export type EntityDefinition = z.infer<typeof EntityDefinitionSchema>;

export const RelationshipDefinitionSchema = z.object({
  source: z.string().trim().min(1, 'Source entity is required'),
  target: z.string().trim().min(1, 'Target entity is required'),
  type: RelationshipTypeEnum,
  description: z.string().trim().optional(),
});
export type RelationshipDefinition = z.infer<typeof RelationshipDefinitionSchema>;

export const DesignPatternUsageSchema = z.object({
  patternName: z.string().trim().min(2, 'Pattern name is required'),
  targetEntity: z.string().trim().min(1, 'Target entity is required'),
  justification: z
    .string()
    .trim()
    .min(5, 'Justification must explain why this design pattern was chosen (min 5 characters)'),
});
export type DesignPatternUsage = z.infer<typeof DesignPatternUsageSchema>;

export const StructuredDesignSchema = z
  .object({
    problemSlug: z.string().trim().min(1, 'Problem slug is required'),
    assumptions: z
      .array(z.string().trim().min(3, 'Assumption must be at least 3 characters'))
      .min(1, 'Please state at least one domain assumption'),
    entities: z
      .array(EntityDefinitionSchema)
      .min(2, 'Design must declare at least 2 entities to form an object model'),
    relationships: z.array(RelationshipDefinitionSchema).default([]),
    designPatterns: z.array(DesignPatternUsageSchema).default([]),
    edgeCasesConsidered: z
      .array(z.string().trim().min(3, 'Edge case description must be at least 3 characters'))
      .min(1, 'Please document at least one operational or capacity edge case'),
  })
  .superRefine((data, ctx) => {
    // Check for duplicate entity names
    const entityNames = new Set<string>();
    for (let i = 0; i < data.entities.length; i++) {
      const name = data.entities[i].name.toLowerCase();
      if (entityNames.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate entity name "${data.entities[i].name}" detected. Entity names must be unique.`,
          path: ['entities', i, 'name'],
        });
      }
      entityNames.add(name);
    }

    // Check that relationships reference declared entities
    for (let i = 0; i < data.relationships.length; i++) {
      const rel = data.relationships[i];
      if (!entityNames.has(rel.source.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Relationship source entity "${rel.source}" is not declared in the entities list.`,
          path: ['relationships', i, 'source'],
        });
      }
      if (!entityNames.has(rel.target.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Relationship target entity "${rel.target}" is not declared in the entities list.`,
          path: ['relationships', i, 'target'],
        });
      }
    }

    // Check that design patterns target declared entities
    for (let i = 0; i < data.designPatterns.length; i++) {
      const pattern = data.designPatterns[i];
      if (!entityNames.has(pattern.targetEntity.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Design pattern target entity "${pattern.targetEntity}" is not declared in the entities list.`,
          path: ['designPatterns', i, 'targetEntity'],
        });
      }
    }
  });

export type StructuredDesign = z.infer<typeof StructuredDesignSchema>;
