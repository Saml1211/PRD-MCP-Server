#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeStorage } from './dist/storage/index.js';
import { generatePRD } from './dist/tools/prd-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('Initializing storage...');
    await initializeStorage();
    
    // Read the sample input file
    const inputPath = path.join(__dirname, 'sample-prd-input.json');
    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    console.log('Generating PRD for:', inputData.productName);
    
    // Generate the PRD using our implementation
    const prdContent = await generatePRD(
      inputData.productName,
      inputData.productDescription,
      inputData.targetAudience,
      inputData.coreFeatures,
      inputData.constraints,
      inputData.templateName
    );
    
    // Write the PRD to a file
    const outputPath = path.join(__dirname, 'generated-prd.md');
    fs.writeFileSync(outputPath, prdContent, 'utf8');
    
    console.log(`PRD successfully generated and saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PRD:', error);
    process.exit(1);
  }
}

main();