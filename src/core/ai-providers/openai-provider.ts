import { OpenAI } from 'openai';
import { AiProvider, AiProviderConfig, AiProviderOptions, PrdGenerationInput } from './provider.js';
import { logger } from '../../config/logging.js';

/**
 * OpenAI provider implementation
 */
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  
  private client: OpenAI | null = null;
  private config: AiProviderConfig;
  
  constructor(config: AiProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      logger.warn("[OpenAiProvider] No API key provided. Provider will be unavailable.");
    } else {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl
      });
    }
  }
  
  /**
   * Check if the provider is properly configured and available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.client;
  }
  
  /**
   * Generate a PRD using OpenAI's API
   */
  async generatePrd(input: PrdGenerationInput, options?: AiProviderOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Check your API key configuration.');
    }
    
    try {
      logger.info(`Generating PRD with OpenAI for product: ${input.productName}`);
      
      // Default options
      const defaultOptions = {
        temperature: 0.7,
        maxTokens: 4000,
      };
      
      // Merge with user-provided options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Format features and constraints as bullet points
      const featuresFormatted = input.coreFeatures.map(f => `• ${f}`).join('\n');
      const constraintsFormatted = input.constraints ? input.constraints.map(c => `• ${c}`).join('\n') : 'None specified';
      
      // Build system prompt
      const systemPrompt = `You are an expert product manager with deep experience in writing detailed, professional Product Requirements Documents (PRDs).
Your task is to create a comprehensive PRD for the product described by the user.
Structure the PRD with clear sections including:
- Introduction and product overview
- Target audience analysis
- Detailed core features explanation
- Technical and business constraints
- Implementation considerations
- Success metrics
Use professional language, be thorough, and format the document in clean markdown.`;

      // Build user prompt
      const userPrompt = `Please create a detailed PRD for the following product:

Product Name: ${input.productName}

Product Description: ${input.productDescription}

Target Audience: ${input.targetAudience}

Core Features:
${featuresFormatted}

Constraints:
${constraintsFormatted}

${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Format the PRD as a well-structured markdown document with appropriate headings, bullet points, and sections.`;

      // Call OpenAI
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
      });
      
      // Extract PRD content from the response
      const prdContent = response.choices[0]?.message?.content || '';
      
      if (!prdContent) {
        throw new Error('Empty response from OpenAI');
      }
      
      logger.info(`PRD generated successfully for "${input.productName}" using OpenAI`);
      return prdContent;
      
    } catch (error) {
      logger.error(`Error generating PRD with OpenAI: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate PRD with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 