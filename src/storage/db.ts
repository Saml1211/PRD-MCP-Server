import sqlite3 from 'sqlite3';
import { logger } from '../config/logging.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable verbose mode for better debugging
sqlite3.verbose();

let db: sqlite3.Database;

// Define interfaces for our database operations
export interface DbInterface {
  run(sql: string, params?: any[]): Promise<sqlite3.RunResult>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

// Helper to promisify sqlite operations
export function promisifyDb(db: sqlite3.Database): DbInterface {
  return {
    run: (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    },
    get: <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err: Error | null, row: T) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err: Error | null, rows: T[]) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    exec: (sql: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

export async function initializeDatabase(): Promise<sqlite3.Database> {
  const dataDir = path.join(__dirname, '../../data');
  const dbPath = path.join(dataDir, 'prd-creator.db');
  
  logger.info(`Initializing SQLite database at ${dbPath}`);
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create/open database
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error(`Error opening database: ${err.message}`);
        reject(err);
        return;
      }
      
      const pdb = promisifyDb(db);
      
      // Create tables if they don't exist
      pdb.exec(`
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          tags TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS template_versions (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES templates(id)
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
        CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
      `)
        .then(() => {
          logger.info('Database schema created successfully');
          resolve(db);
        })
        .catch((err) => {
          logger.error(`Error creating database schema: ${err.message}`);
          reject(err);
        });
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function getPromisifiedDb(): DbInterface {
  return promisifyDb(getDatabase());
}