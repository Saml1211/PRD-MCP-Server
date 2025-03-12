import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logging.js';
import { getPromisifiedDb } from './db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  tags?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database row interface to handle type conversions
interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  content: string;
  tags: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get a template by name or ID
 */
export async function getTemplate(nameOrId: string): Promise<Template> {
  const db = getPromisifiedDb();
  
  // Try to find by ID first, then by name
  const template = await db.get<TemplateRow>(
    `SELECT * FROM templates 
     WHERE id = ? OR name = ?
     LIMIT 1`,
    [nameOrId, nameOrId]
  );
  
  if (!template) {
    logger.error(`Template not found: ${nameOrId}`);
    throw new Error(`Template not found: ${nameOrId}`);
  }
  
  // Parse tags if they exist
  const tags = template.tags ? JSON.parse(template.tags) : [];
  
  return {
    id: template.id,
    name: template.name,
    description: template.description || undefined,
    content: template.content,
    tags,
    version: template.version,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at)
  };
}

/**
 * Save a new template
 */
export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Template> {
  const db = getPromisifiedDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const version = 1;
  
  // Stringify tags if they exist
  const tags = template.tags ? JSON.stringify(template.tags) : null;
  
  await db.run(
    `INSERT INTO templates (id, name, description, content, tags, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, template.name, template.description, template.content, tags, version, now, now]
  );
  
  logger.info(`Created new template: ${template.name} (${id})`);
  
  return {
    ...template,
    id,
    version,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Template> {
  const db = getPromisifiedDb();
  
  // Get current template
  const current = await getTemplate(id);
  
  // Update the template
  const now = new Date().toISOString();
  const newVersion = current.version + 1;
  
  // Store previous version
  await db.run(
    `INSERT INTO template_versions (id, template_id, version, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), current.id, current.version, current.content, now]
  );
  
  // Update fields that were provided
  const name = updates.name || current.name;
  const description = updates.description || current.description;
  const content = updates.content || current.content;
  const tags = updates.tags 
    ? JSON.stringify(updates.tags) 
    : current.tags 
    ? JSON.stringify(current.tags) 
    : null;
  
  // Update the template
  await db.run(
    `UPDATE templates
     SET name = ?, description = ?, content = ?, tags = ?, version = ?, updated_at = ?
     WHERE id = ?`,
    [name, description, content, tags, newVersion, now, id]
  );
  
  logger.info(`Updated template: ${name} (${id}) to version ${newVersion}`);
  
  return {
    ...current,
    name,
    description,
    content,
    tags: tags ? JSON.parse(tags) : undefined,
    version: newVersion,
    updatedAt: new Date(now)
  };
}

/**
 * List all templates (without content)
 */
export async function listTemplates(): Promise<Omit<Template, 'content'>[]> {
  const db = getPromisifiedDb();
  
  interface TemplateListRow {
    id: string;
    name: string;
    description: string | null;
    tags: string | null;
    version: number;
    created_at: string;
    updated_at: string;
  }

  const templates = await db.all<TemplateListRow>(
    `SELECT id, name, description, tags, version, created_at, updated_at
     FROM templates
     ORDER BY name`
  );
  
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || undefined,
    tags: t.tags ? JSON.parse(t.tags) : [],
    version: t.version,
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at)
  }));
}

/**
 * Initialize with default templates
 */
export async function initializeDefaultTemplates() {
  logger.info('Initializing default templates');
  
  // Check if we already have templates
  const db = getPromisifiedDb();
  const result = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM templates');
  const count = result?.count || 0;
  
  if (count > 0) {
    logger.info(`Found ${count} existing templates, skipping initialization`);
    return;
  }
  
  // Add default templates
  const templatesDir = path.join(__dirname, '../../src/templates');
  
  try {
    const files = await fs.readdir(templatesDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(templatesDir, file), 'utf-8');
        const name = file.replace('.md', '');
        
        await saveTemplate({
          name,
          description: `Default template: ${name}`,
          content,
          tags: ['default']
        });
        
        logger.info(`Added default template: ${name}`);
      }
    }
  } catch (error) {
    logger.warn(`Error initializing default templates: ${error instanceof Error ? error.message : String(error)}`);
    logger.info('Creating standard template as fallback');
    
    // Create a standard template as fallback
    await saveTemplate({
      name: 'standard',
      description: 'Standard PRD template',
      content: `# {{PRODUCT_NAME}} - Product Requirements Document

## Introduction

### Product Overview
{{PRODUCT_DESCRIPTION}}

### Target Audience
{{TARGET_AUDIENCE}}

## Core Features

{{CORE_FEATURES}}

## Constraints and Limitations

{{CONSTRAINTS}}

## User Stories

*To be added by the product team*

## Acceptance Criteria

*To be added for each feature*

## Timeline

*To be determined*

---

Generated on {{DATE}}`,
      tags: ['default']
    });
  }
}