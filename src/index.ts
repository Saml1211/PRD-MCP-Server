#!/usr/bin/env node
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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

    // Detect preferred transport: HTTP or STDIO
    const preferHttp =
      process.env.MCP_TRANSPORT?.toLowerCase() === 'http' ||
      !!process.env.PORT ||
      !!process.env.HTTP_PORT;

    logger.info(
      `Detected environment: ${
        preferHttp ? 'Remote/HTTP (glama.ai, Docker, or MCP_TRANSPORT=http)' : 'Local/STDIO'
      }`
    );

    // Initialize storage
    logger.info('Initializing storage...');
    await initializeStorage();

    // Create MCP server
    logger.info('Creating MCP server...');
    const server = new Server(
      {
        name: 'PRD Creator',
        version: '0.1.1',
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

    // Set up error handling
    server.onerror = (error) => {
      logger.error('Server error:', error);
    };

    // Choose transport dynamically
    if (preferHttp) {
      // HTTP mode
      const port =
        Number(process.env.PORT) ||
        Number(process.env.HTTP_PORT) ||
        3000; // Default for glama.ai/cloud
      logger.warn(`HTTP transport requested on port ${port}, but HttpServerTransport is not available in this SDK version. Falling back to STDIO.`);
      const stdioFallback = new StdioServerTransport();
      await server.connect(stdioFallback);
      logger.info('PRD Creator MCP Server running with STDIO transport (HTTP fallback)');
    } else {
      // STDIO (CLI/local)
      logger.info('Connecting server with STDIO transport...');
      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      logger.info('PRD Creator MCP Server running with STDIO transport');
    }
  } catch (error) {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the server
main();
