import { initializeDatabase } from './db.js';
import { initializeDefaultTemplates } from './templates.js';
import { logger } from '../config/logging.js';

/**
 * Initialize the storage layer
 * - Creates database tables
 * - Initializes default templates if none exist
 */
export async function initializeStorage() {
  try {
    logger.info('Initializing storage layer');
    await initializeDatabase();
    await initializeDefaultTemplates();
    logger.info('Storage layer initialized successfully');
  } catch (error) {
    logger.error(`Error initializing storage layer: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Re-export storage modules
export * from './db.js';
export * from './templates.js';