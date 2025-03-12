import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ReadResourceRequestSchema, 
  ListResourceTemplatesRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../config/logging.js';
import { getTemplate } from '../storage/templates.js';

// Simple cache implementation for templates
const templateCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Register the PRD Templates resource with the MCP server
 * 
 * @param server - The MCP server instance
 */
export function registerTemplateResources(server: McpServer) {
  logger.info('Registering PRD Templates resources');
  
  // Register resource templates handler
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'prd://templates/{templateName}',
          name: 'PRD Template',
          description: 'Access product requirement document templates.',
          mimeType: 'text/markdown'
        }
      ]
    };
  });
  
  // Register the resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    
    logger.info(`Resource read request received for: ${uri}`);
    
    // Check if this is a template resource
    if (!uri.startsWith('prd://templates/')) {
      logger.error(`Unsupported resource URI: ${uri}`);
      return {
        contents: [],
        isError: true,
        error: `Unsupported resource URI: ${uri}`
      };
    }
    
    // Extract the template name from the URI
    const templateName = uri.replace('prd://templates/', '');
    
    if (!templateName) {
      logger.error('Template name not provided in URI');
      return {
        contents: [],
        isError: true,
        error: 'Template name not provided in URI'
      };
    }
    
    try {
      // Check cache first
      const now = Date.now();
      const cached = templateCache.get(templateName);
      
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        logger.info(`Serving cached template: ${templateName}`);
        return {
          contents: [{ uri, text: cached.content, mimeType: 'text/markdown' }],
        };
      }
      
      // Get the template from storage
      const template = await getTemplate(templateName);
      
      // Cache the template
      templateCache.set(templateName, {
        content: template.content,
        timestamp: now
      });
      
      logger.info(`Retrieved template: ${templateName}`);
      
      // Return the template
      return {
        contents: [{ uri, text: template.content, mimeType: 'text/markdown' }],
      };
    } catch (error) {
      logger.error(`Template not found: ${templateName}`, { error });
      return {
        contents: [],
        isError: true,
        error: `Template not found: ${templateName}`
      };
    }
  });
  
  logger.info('PRD Templates resources registered successfully');
}