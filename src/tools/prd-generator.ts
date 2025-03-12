import { z } from 'zod';
import { logger } from '../config/logging.js';
import { getTemplate } from '../storage/templates.js';

/**
 * Input schema for the PRD Generator tool
 */
export const generatePrdSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  coreFeatures: z.array(z.string()).min(1, "At least one core feature is required"),
  constraints: z.array(z.string()).optional(),
  templateName: z.string().optional(),
});

// Type for the input parameters
export type GeneratePrdParams = z.infer<typeof generatePrdSchema>;

/**
 * Generate a PRD from the given parameters
 * 
 * @param productName - The name of the product
 * @param productDescription - Description of the product
 * @param targetAudience - Description of the target audience
 * @param coreFeatures - Array of core features
 * @param constraints - Optional array of constraints
 * @param templateName - Optional template name to use (defaults to 'standard')
 * @returns The generated PRD as a markdown string
 */
export async function generatePRD(
  productName: string,
  productDescription: string,
  targetAudience: string,
  coreFeatures: string[],
  constraints?: string[],
  templateName: string = 'standard'
): Promise<string> {
  logger.info(`Generating PRD for "${productName}" using template: ${templateName}`);
  
  try {
    // Get the template
    const template = await getTemplate(templateName);
    
    // Simple template variable replacement
    let content = template.content;
    
    // Replace product name
    content = content.replace(/\{\{PRODUCT_NAME\}\}/g, productName);
    
    // Replace product description
    content = content.replace(/\{\{PRODUCT_DESCRIPTION\}\}/g, productDescription);
    
    // Replace target audience
    content = content.replace(/\{\{TARGET_AUDIENCE\}\}/g, targetAudience);
    
    // Replace features list
    const featuresContent = coreFeatures.map(feature => `- ${feature}`).join('\n');
    content = content.replace(/\{\{CORE_FEATURES\}\}/g, featuresContent);
    
    // Replace constraints if provided
    if (constraints && constraints.length > 0) {
      const constraintsContent = constraints.map(constraint => `- ${constraint}`).join('\n');
      content = content.replace(/\{\{CONSTRAINTS\}\}/g, constraintsContent);
    } else {
      content = content.replace(/\{\{CONSTRAINTS\}\}/g, 'No specific constraints identified.');
    }
    
    // Replace date
    content = content.replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString());
    
    logger.info(`PRD generated successfully for "${productName}"`);
    return content;
  } catch (error) {
    logger.error(`Error generating PRD: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to generate PRD: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}