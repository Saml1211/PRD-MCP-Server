import { AiProviderConfig } from '../core/ai-providers/provider.js';
import { logger } from './logging.js';

/**
 * Load provider configurations from environment variables
 */
import { getStoredProviderConfig } from '../storage/provider-config.js';

/**
 * Async: Load provider configurations from persistent storage and environment variables.
 * If a config is set in storage, it takes precedence; otherwise, environment variables are used.
 */
export async function getProviderConfigs(): Promise<Record<string, AiProviderConfig>> {
  const stored = await getStoredProviderConfig();
  const configs: Record<string, AiProviderConfig> = {};

  // Helper to merge stored config with env config
  function mergeConfig(id: string, envConfig: Partial<AiProviderConfig>): AiProviderConfig {
    return {
      id,
      ...envConfig,
      ...(stored[id] || {}),
    };
  }

  configs['openai'] = mergeConfig('openai', {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_API_BASE_URL,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  });

  configs['anthropic'] = mergeConfig('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_API_BASE_URL,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
  });

  configs['gemini'] = mergeConfig('gemini', {
    apiKey: process.env.GEMINI_API_KEY,
    const modelName = options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
  });

  configs['local'] = mergeConfig('local', {
    baseUrl: process.env.LOCAL_MODEL_API_URL,
    model: process.env.LOCAL_MODEL_NAME || 'llama3',
  });

  configs['template'] = { id: 'template' };

  logger.info('Loaded AI provider configurations (merged env + persistent config)');

  // Log which providers have config
  const configuredProviders = Object.entries(configs)
    .filter(([id, config]) => config.apiKey || (id === 'local' && config.baseUrl) || id === 'template')
    .map(([id]) => id);

  logger.info(`Configured providers: ${configuredProviders.join(', ')}`);

  return configs;
}

/**
 * Get the default provider ID from environment variables or use template fallback
 */
export function getDefaultProviderId(): string {
  return process.env.DEFAULT_AI_PROVIDER || 'template';
}

/**
 * Get provider configuration for all providers
 */
/* Deprecated: Old sync getProviderConfigs removed, replaced by async version above. */