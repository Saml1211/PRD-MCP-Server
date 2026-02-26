import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, AiProviderConfig, AiProviderOptions, PrdGenerationInput } from './provider.js';
import { logger } from '../../config/logging.js';

/**
 * Google Gemini provider implementation
 */
export class GeminiProvider implements AiProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';

  private client: GoogleGenerativeAI | null = null;
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      logger.warn("[GeminiProvider] No API key provided. Provider will be unavailable.");
    } else {
      this.client = new GoogleGenerativeAI(config.apiKey);
    }
  }

  /**
   * Check if the provider is properly configured and available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.client;
  }

  /**
   * Generate a PRD using Google's Gemini API
   */
  async generatePrd(input: PrdGenerationInput, options?: AiProviderOptions): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key configuration.');
    }

    try {
      logger.info(`Generating PRD with Gemini for product: ${input.productName}`);

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

      const model = this.client.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: mergedOptions.temperature,
          maxOutputTokens: mergedOptions.maxTokens,
        },
      });

      const result = await model.generateContent(userPrompt);
      const prdContent = result.response.text();

      if (!prdContent) {
        throw new Error('Empty response from Gemini');
      }

      logger.info(`PRD generated successfully for "${input.productName}" using Gemini`);
      return prdContent;

    } catch (error) {
      logger.error(`Error generating PRD with Gemini: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate PRD with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
