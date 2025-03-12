#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { configureLogging, logger } from './config/logging.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { initializeStorage } from './storage/index.js';

/**
 * Main function to initialize and start the PRD Creator MCP server
 */
async function main() {
  try {
    // Configure logging
    configureLogging();
    logger.info('Starting PRD Creator MCP Server...');
    
    // Initialize storage
    logger.info('Initializing storage...');
    await initializeStorage();
    
    // Create MCP server
    logger.info('Creating MCP server...');
    const server = new Server(
      {
        name: 'PRD Creator',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );
    
    // Register tools and resources
    registerTools(server);
    registerResources(server);
    
    // Register ListTools handler to show available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_prd',
          description: 'Generate a Product Requirements Document from a template',
          inputSchema: {
            type: 'object',
            properties: {
              productName: {
                type: 'string',
                description: 'The name of the product'
              },
              productDescription: {
                type: 'string',
                description: 'Description of the product'
              },
              targetAudience: {
                type: 'string',
                description: 'Description of the target audience'
              },
              coreFeatures: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of core feature descriptions'
              },
              constraints: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Optional array of constraints or limitations'
              },
              templateName: {
                type: 'string',
                description: 'Optional template name to use (defaults to "standard")'
              }
            },
            required: ['productName', 'productDescription', 'targetAudience', 'coreFeatures']
          }
        },
        {
          name: 'validate_prd',
          description: 'Validate a PRD against best practices',
          inputSchema: {
            type: 'object',
            properties: {
              prdContent: {
                type: 'string',
                description: 'The PRD content to validate'
              },
              validationRules: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Optional array of validation rule IDs to check'
              }
            },
            required: ['prdContent']
          }
        },
        {
          name: 'list_validation_rules',
          description: 'List all available validation rules',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));
    
    // Set up error handling
    server.onerror = (error) => {
      logger.error('Server error:', error);
    };
    
    // Connect using STDIO transport
    logger.info('Connecting server with STDIO transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('PRD Creator MCP Server running with STDIO transport');
  } catch (error) {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the server
main();