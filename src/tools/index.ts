import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  generatePrdSchema,
  generatePRD,
  listAiProviders,
  type GeneratePrdParams
} from './prd-generator.js';
import {
  validatePrdSchema,
  validatePRD,
  listValidationRules,
  type ValidatePrdParams
} from './prd-validator.js';
import { logger } from '../config/logging.js';
import { createTemplateSchema, createTemplate } from './template-creator.js';
import {
  listTemplatesSchema, listTemplates,
  getTemplateSchema, getTemplate,
  updateTemplateSchema, updateTemplate,
  deleteTemplateSchema, deleteTemplate,
  exportTemplatesSchema, exportTemplates,
  importTemplatesSchema, importTemplates
} from './template-manager.js';
import {
  listAllRulesSchema, listAllRules,
  addRuleSchema, addRule,
  updateRuleSchema, updateRule,
  deleteRuleSchema, deleteRule
} from './validation-rule-manager.js';
import { statsSchema, stats } from './metrics-manager.js';
import { getProviderConfigSchema, getProviderConfig, updateProviderConfigSchema, updateProviderConfig } from './provider-config-manager.js';
import { renderTemplateSchema, renderTemplate } from './render-template.js';
import { healthCheckSchema, healthCheck } from './health-manager.js';
import { getLogsSchema, getLogs } from './logs-manager.js';

/**
 * Register all tools with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerTools(server: McpServer) {
  logger.info('Registering PRD Creator tools');

  // Register request handler for tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Handle PRD Generator tool
    if (name === 'generate_prd') {
      try {
        // Validate parameters
        const validatedParams = generatePrdSchema.parse(args);

        // Generate PRD
        const prd = await generatePRD(
          validatedParams.productName,
          validatedParams.productDescription,
          validatedParams.targetAudience,
          validatedParams.coreFeatures,
          validatedParams.constraints,
          validatedParams.templateName,
          validatedParams.providerId,
          validatedParams.additionalContext,
          validatedParams.providerOptions
        );

        return {
          content: [{ type: 'text', text: prd }],
        };
      } catch (error) {
        logger.error(`Error generating PRD: ${error instanceof Error ? error.message : String(error)}`);
        return {
          content: [{ type: 'text', text: `Error generating PRD: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }

    // Handle PRD Validator tool
    if (name === 'validate_prd') {
      try {
        // Validate parameters
        const validatedParams = validatePrdSchema.parse(args);

        // Validate PRD
        const validation = await validatePRD(
          validatedParams.prdContent,
          validatedParams.validationRules
        );

        return {
          content: [{ type: 'text', text: JSON.stringify(validation, null, 2) }],
        };
      } catch (error) {
        logger.error(`Error validating PRD: ${error instanceof Error ? error.message : String(error)}`);
        return {
          content: [{ type: 'text', text: `Error validating PRD: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }

    // Handle list validation rules tool
    if (name === 'list_validation_rules') {
      try {
        const rules = listValidationRules();

        return {
          content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }],
        };
      } catch (error) {
        logger.error(`Error listing validation rules: ${error instanceof Error ? error.message : String(error)}`);
        return {
          content: [{ type: 'text', text: `Error listing validation rules: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }

    // Handle list AI providers tool
    if (name === 'list_ai_providers') {
      try {
        const providers = await listAiProviders();

        return {
          content: [{ type: 'text', text: JSON.stringify(providers, null, 2) }],
        };
      } catch (error) {
        logger.error(`Error listing AI providers: ${error instanceof Error ? error.message : String(error)}`);
        return {
          content: [{ type: 'text', text: `Error listing AI providers: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }

    // Handle Create Template tool
    if (name === 'create_template') {
      try {
        const validatedParams = createTemplateSchema.parse(args);
        const template = await createTemplate(
          validatedParams.name,
          validatedParams.description,
          validatedParams.content,
          validatedParams.tags
        );
        return { content: [{ type: 'text', text: JSON.stringify(template, null, 2) }] };
      } catch (error) {
        logger.error(`Error creating template: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error creating template: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle List Templates tool
    if (name === 'list_templates') {
      try {
        listTemplatesSchema.parse(args);
        const templates = await listTemplates();
        return { content: [{ type: 'text', text: JSON.stringify(templates, null, 2) }] };
      } catch (error) {
        logger.error(`Error listing templates: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error listing templates: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Get Template tool
    if (name === 'get_template') {
      try {
        const { idOrName } = getTemplateSchema.parse(args);
        const template = await getTemplate(idOrName);
        return { content: [{ type: 'text', text: JSON.stringify(template, null, 2) }] };
      } catch (error) {
        logger.error(`Error getting template: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error getting template: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Update Template tool
    if (name === 'update_template') {
      try {
        const { id, name: newName, description, content, tags } = updateTemplateSchema.parse(args);
        const updated = await updateTemplate(id, newName, description, content, tags);
        return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
      } catch (error) {
        logger.error(`Error updating template: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error updating template: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Delete Template tool
    if (name === 'delete_template') {
      try {
        const { id } = deleteTemplateSchema.parse(args);
        await deleteTemplate(id);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
      } catch (error) {
        logger.error(`Error deleting template: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error deleting template: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Export Templates tool
    if (name === 'export_templates') {
      try {
        const { filePath } = exportTemplatesSchema.parse(args);
        await exportTemplates(filePath);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, filePath }) }] };
      } catch (error) {
        logger.error(`Error exporting templates: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error exporting templates: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Import Templates tool
    if (name === 'import_templates') {
      try {
        const { filePath } = importTemplatesSchema.parse(args);
        await importTemplates(filePath);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, filePath }) }] };
      } catch (error) {
        logger.error(`Error importing templates: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error importing templates: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle List All Rules tool
    if (name === 'list_all_rules') {
      try {
        listAllRulesSchema.parse(args);
        const rules = await listAllRules();
        return { content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }] };
      } catch (error) {
        logger.error(`Error listing validation rules: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error listing validation rules: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Add Validation Rule tool
    if (name === 'add_validation_rule') {
      try {
        const { id, name: rn, description, pattern } = addRuleSchema.parse(args);
        await addRule(id, rn, description, pattern);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
      } catch (error) {
        logger.error(`Error adding validation rule: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error adding validation rule: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Update Validation Rule tool
    if (name === 'update_validation_rule') {
      try {
        const { id, name: rn, description, pattern } = updateRuleSchema.parse(args);
        await updateRule(id, rn, description, pattern);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
      } catch (error) {
        logger.error(`Error updating validation rule: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error updating validation rule: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Delete Validation Rule tool
    if (name === 'delete_validation_rule') {
      try {
        const { id } = deleteRuleSchema.parse(args);
        await deleteRule(id);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
      } catch (error) {
        logger.error(`Error deleting validation rule: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error deleting validation rule: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Stats tool
    if (name === 'stats') {
      try {
        statsSchema.parse(args);
        const metrics = await stats();
        return { content: [{ type: 'text', text: JSON.stringify(metrics, null, 2) }] };
      } catch (error) {
        logger.error(`Error retrieving stats: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error retrieving stats: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Get Provider Config tool
    if (name === 'get_provider_config') {
      try {
        getProviderConfigSchema.parse(args);
        const configs = await getProviderConfig();
        return { content: [{ type: 'text', text: JSON.stringify(configs, null, 2) }] };
      } catch (error) {
        logger.error(`Error retrieving provider config: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error retrieving provider config: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Update Provider Config tool
    if (name === 'update_provider_config') {
      try {
        const { providerId, apiKey, baseUrl, model } = updateProviderConfigSchema.parse(args);
        await updateProviderConfig(providerId, apiKey, baseUrl, model);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
      } catch (error) {
        logger.error(`Error updating provider config: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error updating provider config: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Render Template tool
    if (name === 'render_template') {
      try {
        const params = renderTemplateSchema.parse(args);
        const content = await renderTemplate(
          params.productName, params.productDescription, params.targetAudience,
          params.coreFeatures, params.constraints, params.templateName
        );
        return { content: [{ type: 'text', text: content }] };
      } catch (error) {
        logger.error(`Error rendering template: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error rendering template: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Health Check tool
    if (name === 'health_check') {
      try {
        healthCheckSchema.parse(args);
        const result = await healthCheck();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        logger.error(`Error running health check: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error running health check: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Handle Get Logs tool
    if (name === 'get_logs') {
      try {
        const params = getLogsSchema.parse(args);
        const logs = await getLogs(params.fileName, params.lines);
        return { content: [{ type: 'text', text: logs }] };
      } catch (error) {
        logger.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);
        return { content: [{ type: 'text', text: `Error getting logs: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
      }
    }

    // Unknown tool
    logger.error(`Unknown tool requested: ${name}`);
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });

  // Register ListTools handler with all tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'generate_prd',
        description: 'Generate a complete PRD document using AI or template-based generation',
        inputSchema: {
          type: 'object',
          properties: {
            productName: { type: 'string', description: 'The name of the product' },
            productDescription: { type: 'string', description: 'Description of the product' },
            targetAudience: { type: 'string', description: 'Description of the target audience' },
            coreFeatures: { type: 'array', items: { type: 'string' }, description: 'Array of core feature descriptions' },
            constraints: { type: 'array', items: { type: 'string' }, description: 'Array of constraints or limitations' },
            templateName: { type: 'string', description: 'Template name to use (defaults to "standard")' },
            providerId: { type: 'string', description: 'Specific AI provider to use (openai, anthropic, gemini, local, template)' },
            additionalContext: { type: 'string', description: 'Additional context or instructions for the AI provider' },
            providerOptions: { type: 'object', description: 'Provider-specific options like temperature, maxTokens, etc.' },
          },
          required: ['productName', 'productDescription', 'targetAudience', 'coreFeatures'],
        },
      },
      {
        name: 'validate_prd',
        description: 'Validate a PRD document against best practices and customizable rules',
        inputSchema: {
          type: 'object',
          properties: {
            prdContent: { type: 'string', description: 'The PRD content to validate' },
            validationRules: { type: 'array', items: { type: 'string' }, description: 'Array of validation rule IDs to check' },
          },
          required: ['prdContent'],
        },
      },
      {
        name: 'list_validation_rules',
        description: 'List all available built-in validation rules',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_ai_providers',
        description: 'List all AI providers and their availability status',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_template',
        description: 'Create a new PRD template',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Template name' },
            description: { type: 'string', description: 'Template description' },
            content: { type: 'string', description: 'Markdown content of the template' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Array of tags' },
          },
          required: ['name', 'content'],
        },
      },
      {
        name: 'list_templates',
        description: 'List all available PRD templates',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_template',
        description: 'Get a specific template by ID or name',
        inputSchema: {
          type: 'object',
          properties: {
            idOrName: { type: 'string', description: 'Template ID or name' },
          },
          required: ['idOrName'],
        },
      },
      {
        name: 'update_template',
        description: 'Update an existing PRD template',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Template ID' },
            name: { type: 'string', description: 'New template name' },
            description: { type: 'string', description: 'New template description' },
            content: { type: 'string', description: 'New template content' },
            tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_template',
        description: 'Delete a PRD template',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Template ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'export_templates',
        description: 'Export all templates to a JSON file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to export to' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'import_templates',
        description: 'Import templates from a JSON file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path to import from' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'list_all_rules',
        description: 'List all validation rules (built-in and custom)',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'add_validation_rule',
        description: 'Add a custom validation rule',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Rule ID' },
            name: { type: 'string', description: 'Rule name' },
            description: { type: 'string', description: 'Rule description' },
            pattern: { type: 'string', description: 'Regex pattern for the rule' },
          },
          required: ['id', 'name', 'pattern'],
        },
      },
      {
        name: 'update_validation_rule',
        description: 'Update a custom validation rule',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Rule ID' },
            name: { type: 'string', description: 'New rule name' },
            description: { type: 'string', description: 'New rule description' },
            pattern: { type: 'string', description: 'New regex pattern' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_validation_rule',
        description: 'Delete a custom validation rule',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Rule ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'stats',
        description: 'Get usage statistics and metrics',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_provider_config',
        description: 'Get current AI provider configurations',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'update_provider_config',
        description: 'Update AI provider configuration (API key, base URL, model)',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID (openai, anthropic, gemini, local)' },
            apiKey: { type: 'string', description: 'New API key' },
            baseUrl: { type: 'string', description: 'New base URL' },
            model: { type: 'string', description: 'New model name' },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'render_template',
        description: 'Render a PRD template with placeholder substitution (no AI)',
        inputSchema: {
          type: 'object',
          properties: {
            productName: { type: 'string', description: 'The name of the product' },
            productDescription: { type: 'string', description: 'Description of the product' },
            targetAudience: { type: 'string', description: 'Description of the target audience' },
            coreFeatures: { type: 'array', items: { type: 'string' }, description: 'Array of core feature descriptions' },
            constraints: { type: 'array', items: { type: 'string' }, description: 'Array of constraints or limitations' },
            templateName: { type: 'string', description: 'Template name to use' },
          },
          required: ['productName', 'productDescription', 'targetAudience', 'coreFeatures'],
        },
      },
      {
        name: 'health_check',
        description: 'Check system health: database connectivity and AI provider availability',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_logs',
        description: 'Get recent system log entries',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'Log file name (default: combined.log)' },
            lines: { type: 'number', description: 'Number of lines to return (default: 100)' },
          },
        },
      },
    ],
  }));

  logger.info('All PRD Creator tools registered successfully');
}
