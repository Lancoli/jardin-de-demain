#!/usr/bin/env node

/**
 * Script that replaces every CSS variable (custom property)
 * with its direct value in the HTML files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Files to process (every HTML at the root except the archive)
const files = [
  'index.html',
  'jardins-vivants.html',
  'arbres-secheresse.html',
  'calendrier-recoltes.html',
  'temps-au-jardin.html',
  'pharmacopee.html',
  'jardin-de-demain-prototype.html',
  'plantes-nurses.html',
  'guide-paillage.html',
  'calendrier-semis.html',
  'semis-arbres.html',
  'associations-plantes.html'
];

function extractVariables(content) {
  // Find the :root { ... } block
  const match = content.match(/:root\s*\{([^}]*)\}/s);
  if (!match) {
    return null;
  }

  const block = match[1];
  const variables = {};

  // Extract each --variable: value;
  const lines = block.split(/;|\n/);
  for (const line of lines) {
    const varMatch = line.match(/(--[a-z0-9-]+)\s*:\s*([^;]+)/);
    if (varMatch) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();
      variables[name] = value;
    }
  }

  return Object.keys(variables).length > 0 ? variables : null;
}

function replaceVariables(content, variables) {
  if (!variables) {
    return content;
  }

  let result = content;

  // Replace every var(--variable) with its value
  // Sort by decreasing length to handle the most specific first
  const entries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

  for (const [variable, value] of entries) {
    // Escape the regex special characters
    const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`var\\(\\s*${escapedVar}\\s*\\)`, 'g');
    result = result.replace(regex, value);
  }

  // Remove the :root { ... } block
  result = result.replace(/:root\s*\{[^}]*\}/gs, '');

  // Remove comment lines about the variables when they stand alone
  result = result.replace(/\/\*\s*=+\s*\n\s*\d+\.\s*VARIABLES\s*\n\s*=+\s*\*\/\s*\n*/g, '');

  return result;
}

function processFile(fileName) {
  try {
    const filePath = join(process.cwd(), fileName);
    const content = readFileSync(filePath, 'utf-8');

    // Extract the variables defined in this file
    const variables = extractVariables(content);

    if (!variables) {
      console.log(`✓ ${fileName} : no CSS variable found`);
      return;
    }

    // Replace the variables
    const newContent = replaceVariables(content, variables);

    // Check that no var() is left
    const remaining = (newContent.match(/var\(--/g) || []).length;

    if (remaining > 0) {
      console.warn(`⚠ ${fileName} : ${remaining} var() left!`);
    }

    // Write the result
    if (newContent !== content) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ ${fileName} : ${Object.keys(variables).length} variables replaced`);
    } else {
      console.log(`✓ ${fileName} : no change`);
    }
  } catch (err) {
    console.error(`✗ ${fileName} : ${err.message}`);
  }
}

// Process every file
console.log('Replacing CSS variables...\n');

for (const file of files) {
  processFile(file);
}

console.log('\nDone!');
