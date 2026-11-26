#!/usr/bin/env node

/**
 * Script pour remplacer toutes les variables CSS (custom properties)
 * par leurs valeurs directes dans les fichiers HTML
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Fichiers à traiter (tous les HTML à la racine sauf archive)
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
  // Trouver le bloc :root { ... }
  const match = content.match(/:root\s*\{([^}]*)\}/s);
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
}

function replaceVariables(content, variables) {
  if (!variables) {
    return content;
  }

  let result = content;

  // Remplacer toutes les occurrences de var(--variable) par la valeur
  // On trie par longueur décroissante pour traiter d'abord les plus spécifiques
  const entries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

  for (const [variable, value] of entries) {
    // Échapper les caractères spéciaux pour la regex
    const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`var\\(\\s*${escapedVar}\\s*\\)`, 'g');
    result = result.replace(regex, value);
  }

  // Supprimer le bloc :root { ... }
  result = result.replace(/:root\s*\{[^}]*\}/gs, '');

  // Supprimer les lignes de commentaires sur les variables si elles sont isolées
  result = result.replace(/\/\*\s*=+\s*\n\s*\d+\.\s*VARIABLES\s*\n\s*=+\s*\*\/\s*\n*/g, '');

  return result;
}

function processFile(fileName) {
  try {
    const filePath = join(process.cwd(), fileName);
    const content = readFileSync(filePath, 'utf-8');

    // Extraire les variables définies dans ce fichier
    const variables = extractVariables(content);

    if (!variables) {
      console.log(`✓ ${fileName} : aucune variable CSS trouvée`);
      return;
    }

    // Remplacer les variables
    const newContent = replaceVariables(content, variables);

    // Vérifier qu'il ne reste plus de var()
    const remaining = (newContent.match(/var\(--/g) || []).length;

    if (remaining > 0) {
      console.warn(`⚠ ${fileName} : ${remaining} var() restantes !`);
    }

    // Écrire le résultat
    if (newContent !== content) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ ${fileName} : ${Object.keys(variables).length} variables remplacées`);
    } else {
      console.log(`✓ ${fileName} : aucun changement`);
    }
  } catch (err) {
    console.error(`✗ ${fileName} : ${err.message}`);
  }
}

// Traiter tous les fichiers
console.log('Remplacement des variables CSS...\n');

for (const file of files) {
  processFile(file);
}

console.log('\nTerminé !');
