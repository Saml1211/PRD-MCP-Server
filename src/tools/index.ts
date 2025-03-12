import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { 
  generatePrdSchema, 
  generatePRD, 
  type GeneratePrdParams 
} from './prd-generator.js';
import { 
  validatePrdSchema, 
  validatePRD, 
  listValidationRules, 
  type ValidatePrdParams 
} from './prd-validator.js';
import { logger } from '../config/logging.js';

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
          validatedParams.templateName
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
    
    // Unknown tool
    logger.error(`Unknown tool requested: ${name}`);
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });
  
  logger.info('All PRD Creator tools registered successfully');
}