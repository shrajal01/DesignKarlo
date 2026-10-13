import type { StructuredDesign } from '../../schemas/submission';
import type { CriterionScore, FeedbackItem, ScoreRating } from '../../types/evaluation';

export function evaluateExtensibilityPatterns(design: StructuredDesign): {
  score: CriterionScore;
  feedback: FeedbackItem[];
} {
  const feedback: FeedbackItem[] = [];
  let score = 10; // Baseline for structured design

  const patterns = design.designPatterns;
  const entities = design.entities;

  // 1. Evaluate declared design patterns
  if (patterns.length > 0) {
    const validPatterns = patterns.filter((p) =>
      /strategy|factory|singleton|observer|facade|state|command|template/i.test(p.patternName)
    );

    if (validPatterns.length > 0) {
      score += Math.min(10, validPatterns.length * 5);
      const patternSummary = validPatterns
        .map((p) => `${p.patternName} on ${p.targetEntity}`)
        .join(', ');

      feedback.push({
        id: 'fb_pattern_applied',
        criterionId: 'extensibility_patterns',
        type: 'strength',
        title: 'Architectural Design Pattern(s) Applied',
        evidence: `Declared pattern usage: ${patternSummary}.`,
        impact:
          'Utilizing standard design patterns creates predictable extension points and simplifies testing.',
        suggestion:
          'Ensure the declared patterns are backed by clear interfaces in your method contracts.',
        priority: 'low',
      });
    }
  } else {
    feedback.push({
      id: 'fb_pattern_none',
      criterionId: 'extensibility_patterns',
      type: 'concern',
      title: 'No Explicit Design Patterns Declared',
      evidence: 'No design pattern usage was declared in the designPatterns section.',
      impact:
        'Without patterns such as Strategy or Factory, adding alternative algorithms requires modifying existing classes directly.',
      suggestion:
        'Consider applying the Strategy Pattern for spot allocation algorithms or fee calculation rules.',
      priority: 'medium',
    });
  }

  // 2. Check for Strategy pattern specifically for allocation or pricing
  const hasStrategyPattern =
    patterns.some((p) => /strategy/i.test(p.patternName)) ||
    entities.some((e) => /strategy|policy|algorithm/i.test(e.name));

  if (hasStrategyPattern) {
    score += 4;
  } else {
    score -= 2;
  }

  // 3. Check for Polymorphism / Open-Closed Principle via interfaces or abstract classes
  const polymorphicEntities = entities.filter(
    (e) => e.type === 'interface' || e.type === 'abstract_class'
  );

  if (polymorphicEntities.length > 0) {
    score += 3;
    feedback.push({
      id: 'fb_pattern_polymorphic_types',
      criterionId: 'extensibility_patterns',
      type: 'strength',
      title: 'Polymorphic Abstractions for Open/Closed Extensibility',
      evidence: `Found abstract/interface entities: ${polymorphicEntities.map((e) => e.name).join(', ')}.`,
      impact:
        'Enables introducing new spot or vehicle subtypes without modifying existing coordination code.',
      suggestion:
        'Keep contracts focused on minimal interfaces (Interface Segregation Principle).',
      priority: 'low',
    });
  } else {
    feedback.push({
      id: 'fb_pattern_no_polymorphism',
      criterionId: 'extensibility_patterns',
      type: 'suggestion',
      title: 'Opportunity for Interface Abstraction',
      evidence: 'All declared entities are concrete classes with no interfaces or abstract classes.',
      impact:
        'Direct dependency on concrete classes limits substitutability and increases coupling.',
      suggestion:
        'Extract interfaces for key behaviors (e.g., SpotAllocationStrategy or Vehicle hierarchy) to enhance flexibility.',
      priority: 'medium',
    });
  }

  const finalScore = Math.min(25, Math.max(0, score));

  let rating: ScoreRating = 'Needs Improvement';
  if (finalScore >= 21) rating = 'Excellent';
  else if (finalScore >= 16) rating = 'Good';

  return {
    score: {
      criterionId: 'extensibility_patterns',
      title: 'Extensibility & Pattern Application',
      score: finalScore,
      maxScore: 25,
      rating,
      summary: hasStrategyPattern
        ? 'Good extensible architecture with Strategy patterns and polymorphic contracts.'
        : 'Basic extensibility. Applying Strategy patterns for pricing or allocation would improve modularity.',
    },
    feedback,
  };
}
