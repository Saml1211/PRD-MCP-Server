import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { registerTemplateResources } from './templates.js';
import { logger } from '../config/logging.js';

/**
 * Register all resources with the MCP server
 * 
 * @param server - The MCP server instance
 */
export function registerResources(server: McpServer) {
  logger.info('Registering PRD Creator resources');
  
  // Register template resources
  registerTemplateResources(server);
  
  logger.info('All PRD Creator resources registered successfully');
}