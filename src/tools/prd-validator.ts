import { z } from 'zod';
import { logger } from '../config/logging.js';

/**
 * Input schema for the PRD Validator tool
 */
export const validatePrdSchema = z.object({
  prdContent: z.string().min(1, "PRD content is required"),
  validationRules: z.array(z.string()).optional(),
});

// Type for the input parameters
export type ValidatePrdParams = z.infer<typeof validatePrdSchema>;

// Validation rule types
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (content: string) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

/**
 * Default validation rules for PRDs
 */
const defaultRules: ValidationRule[] = [
  {
    id: 'has-introduction',
    name: 'Has Introduction',
    description: 'PRD must have an introduction section',
    validate: (content) => {
      const hasIntro = /^#+\s*introduction/mi.test(content);
      return {
        passed: hasIntro,
        message: hasIntro ? 'Introduction section found' : 'Missing introduction section',
      };
    }
  },
  {
    id: 'has-target-users',
    name: 'Has Target Users',
    description: 'PRD must define target users or audience',
    validate: (content) => {
      const hasTargetUsers = /^#+\s*(target\s*users|audience|users)/mi.test(content);
      return {
        passed: hasTargetUsers,
        message: hasTargetUsers ? 'Target users section found' : 'Missing target users or audience section',
      };
    }
  },
  {
    id: 'has-features',
    name: 'Has Features',
    description: 'PRD must describe features or requirements',
    validate: (content) => {
      const hasFeatures = /^#+\s*(features|requirements)/mi.test(content);
      return {
        passed: hasFeatures,
        message: hasFeatures ? 'Features or requirements section found' : 'Missing features or requirements section',
      };
    }
  },
  {
    id: 'has-acceptance-criteria',
    name: 'Has Acceptance Criteria',
    description: 'Features should have acceptance criteria',
    validate: (content) => {
      const hasAcceptanceCriteria = /acceptance\s*criteria/mi.test(content);
      return {
        passed: hasAcceptanceCriteria,
        message: hasAcceptanceCriteria ? 'Acceptance criteria found' : 'No acceptance criteria found in document',
      };
    }
  },
  {
    id: 'minimum-length',
    name: 'Minimum Length',
    description: 'PRD should have sufficient detail (at least 1000 characters)',
    validate: (content) => {
      const passed = content.length >= 1000;
      return {
        passed,
        message: passed ? 'PRD has sufficient length' : 'PRD is too short (less than 1000 characters)',
        details: `Current length: ${content.length} characters`,
      };
    }
  },
  {
    id: 'has-timeline',
    name: 'Has Timeline',
    description: 'PRD should include timeline or delivery information',
    validate: (content) => {
      const hasTimeline = /^#+\s*(timeline|schedule|delivery|roadmap)/mi.test(content);
      return {
        passed: hasTimeline,
        message: hasTimeline ? 'Timeline section found' : 'Missing timeline or delivery information',
      };
    }
  },
  {
    id: 'has-product-name',
    name: 'Has Product Name',
    description: 'PRD should clearly state the product name',
    validate: (content) => {
      // Check if there's a heading that likely contains the product name
      const hasProductName = /^#\s+.+/m.test(content);
      return {
        passed: hasProductName,
        message: hasProductName ? 'Product name found in title' : 'Missing clear product name in document title',
      };
    }
  }
];

/**
 * Get rules by ID
 * 
 * @param ruleIds - Optional array of rule IDs to filter
 * @returns Array of validation rules
 */
function getRules(ruleIds?: string[]): ValidationRule[] {
  if (!ruleIds || ruleIds.length === 0) {
    return defaultRules;
  }
  
  return defaultRules.filter(rule => ruleIds.includes(rule.id));
}

/**
 * Validate PRD against rules
 * 
 * @param content - PRD content to validate
 * @param ruleIds - Optional rule IDs to validate against
 * @returns Validation results and summary
 */
export async function validatePRD(content: string, ruleIds?: string[]): Promise<{
  results: Array<ValidationResult & { rule: string }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    score: number;
  }
}> {
  logger.info('Validating PRD content');
  
  const rules = getRules(ruleIds);
  const results = rules.map(rule => {
    const result = rule.validate(content);
    return {
      rule: rule.name,
      ...result
    };
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  logger.info(`PRD validation complete: ${passed}/${total} checks passed`);
  
  return {
    results,
    summary: {
      total,
      passed,
      failed: total - passed,
      score: Math.round((passed / total) * 100)
    }
  };
}

/**
 * List all available validation rules
 */
export function listValidationRules(): Array<Omit<ValidationRule, 'validate'>> {
  return defaultRules.map(({ id, name, description }) => ({
    id,
    name,
    description
  }));
}