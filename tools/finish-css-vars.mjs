#!/usr/bin/env node

/**
 * Script that finishes replacing the remaining var()
 * using the values of the known themes
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Known themes
const themes = {
  dark: {
    '--bg': '#0b0d10',
    '--panel': '#111419',
    '--panel-2': '#15191f',
    '--text': '#f5f4ef',
    '--muted': '#a4a6aa',
    '--line': '#30343a',
    '--accent': '#d6f900',
    '--accent-dark': '#263000',
    '--warn': '#ffb347',
    '--max': '1280px'
  },
  paper: {
    '--paper': '#f3efe2',
    '--paper-light': '#faf7ed',
    '--paper-soft': '#eeeade',
    '--green': '#285c42',
    '--green-dark': '#193f2d',
    '--green-soft': '#dce6d7',
    '--ink': '#254b38',
    '--muted': '#718078',
    '--white': '#fffdf5',
    '--grain': 'image-set(url("assets/textures/paper-grain.png") 2x)',
    '--shadow': '0 8px 28px rgba(36,67,49,.055), 0 1px 3px rgba(36,67,49,.045)'
  }
};

// For calendar/temps, --max may differ
const themesDarkVariants = {
  '--max-1480': { ...themes.dark, '--max': '1480px' }
};

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

function extractVariablesFromGit(fileName) {
  try {
    const originalContent = execSync(`git show HEAD:"${fileName}"`, { encoding: 'utf-8' });
    const match = originalContent.match(/:root\s*\{([^}]*)\}/s);

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
  } catch (e) {
    return null;
  }
}

function replaceVarsInContent(content, variables) {
  let result = content;

  // Sort by decreasing length
  const entries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

  for (const [variable, value] of entries) {
    const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`var\\(\\s*${escapedVar}\\s*\\)`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

function processFile(fileName) {
  try {
    const filePath = join(process.cwd(), fileName);

    // Read the current file
    let content = readFileSync(filePath, 'utf-8');

    // Check whether there are var()
    const hasVar = content.includes('var(--');

    if (!hasVar) {
      console.log(`✓ ${fileName} : already done`);
      return;
    }

    // Extract the variables from git
    const variables = extractVariablesFromGit(fileName);

    if (!variables) {
      console.warn(`⚠ ${fileName} : cannot extract the variables`);
      return;
    }

    console.log(`  ${Object.keys(variables).length} variables found`);

    // Replace the var()
    const newContent = replaceVarsInContent(content, variables);

    // Check whether any var() is left
    const remaining = (newContent.match(/var\(--/g) || []).length;

    if (remaining > 0) {
      console.warn(`⚠ ${fileName} : ${remaining} var() left`);
    } else {
      console.log(`✓ ${fileName} : every var() replaced`);
    }

    // Write
    writeFileSync(filePath, newContent, 'utf-8');

  } catch (err) {
    console.error(`✗ ${fileName} : ${err.message}`);
  }
}

console.log('Finishing the var() replacement...\n');

for (const file of files) {
  processFile(file);
}

console.log('\nDone!');
