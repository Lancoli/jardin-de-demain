#!/usr/bin/env node

/**
 * Script pour finaliser le remplacement des var() restantes
 * en utilisant les valeurs des thèmes connus
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Thèmes connus
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

// Pour calendar/temps, --max peut être différent
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

    // Extraire chaque --variable: valeur;
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

  // Trier par longueur décroissante
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

    // Lire le fichier actuel
    let content = readFileSync(filePath, 'utf-8');

    // Vérifier s'il y a des var()
    const hasVar = content.includes('var(--');

    if (!hasVar) {
      console.log(`✓ ${fileName} : déjà traité`);
      return;
    }

    // Extraire les variables depuis git
    const variables = extractVariablesFromGit(fileName);

    if (!variables) {
      console.warn(`⚠ ${fileName} : impossible d'extraire les variables`);
      return;
    }

    console.log(`  ${Object.keys(variables).length} variables trouvées`);

    // Remplacer les var()
    const newContent = replaceVarsInContent(content, variables);

    // Vérifier s'il reste des var()
    const remaining = (newContent.match(/var\(--/g) || []).length;

    if (remaining > 0) {
      console.warn(`⚠ ${fileName} : ${remaining} var() restantes`);
    } else {
      console.log(`✓ ${fileName} : toutes les var() remplacées`);
    }

    // Écrire
    writeFileSync(filePath, newContent, 'utf-8');

  } catch (err) {
    console.error(`✗ ${fileName} : ${err.message}`);
  }
}

console.log('Finalisation du remplacement des var()...\n');

for (const file of files) {
  processFile(file);
}

console.log('\nTerminé !');
