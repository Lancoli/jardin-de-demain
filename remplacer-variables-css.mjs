#!/usr/bin/env node

/**
 * Script pour remplacer toutes les variables CSS (custom properties)
 * par leurs valeurs directes dans les fichiers HTML
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Fichiers à traiter (tous les HTML à la racine sauf archive)
const fichiers = [
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

function extraireVariables(contenu) {
  // Trouver le bloc :root { ... }
  const match = contenu.match(/:root\s*\{([^}]*)\}/s);
  if (!match) {
    return null;
  }

  const bloc = match[1];
  const variables = {};

  // Extraire chaque --variable: valeur;
  const lignes = bloc.split(/;|\n/);
  for (const ligne of lignes) {
    const varMatch = ligne.match(/(--[a-z0-9-]+)\s*:\s*([^;]+)/);
    if (varMatch) {
      const nom = varMatch[1].trim();
      const valeur = varMatch[2].trim();
      variables[nom] = valeur;
    }
  }

  return Object.keys(variables).length > 0 ? variables : null;
}

function remplacerVariables(contenu, variables) {
  if (!variables) {
    return contenu;
  }

  let resultat = contenu;

  // Remplacer toutes les occurrences de var(--variable) par la valeur
  // On trie par longueur décroissante pour traiter d'abord les plus spécifiques
  const entries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

  for (const [variable, valeur] of entries) {
    // Échapper les caractères spéciaux pour la regex
    const varEscapee = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`var\\(\\s*${varEscapee}\\s*\\)`, 'g');
    resultat = resultat.replace(regex, valeur);
  }

  // Supprimer le bloc :root { ... }
  resultat = resultat.replace(/:root\s*\{[^}]*\}/gs, '');

  // Supprimer les lignes de commentaires sur les variables si elles sont isolées
  resultat = resultat.replace(/\/\*\s*=+\s*\n\s*\d+\.\s*VARIABLES\s*\n\s*=+\s*\*\/\s*\n*/g, '');

  return resultat;
}

function traiterFichier(nomFichier) {
  try {
    const chemin = join(process.cwd(), nomFichier);
    const contenu = readFileSync(chemin, 'utf-8');

    // Extraire les variables définies dans ce fichier
    const variables = extraireVariables(contenu);

    if (!variables) {
      console.log(`✓ ${nomFichier} : aucune variable CSS trouvée`);
      return;
    }

    // Remplacer les variables
    const nouveauContenu = remplacerVariables(contenu, variables);

    // Vérifier qu'il ne reste plus de var()
    const restantes = (nouveauContenu.match(/var\(--/g) || []).length;

    if (restantes > 0) {
      console.warn(`⚠ ${nomFichier} : ${restantes} var() restantes !`);
    }

    // Écrire le résultat
    if (nouveauContenu !== contenu) {
      writeFileSync(chemin, nouveauContenu, 'utf-8');
      console.log(`✓ ${nomFichier} : ${Object.keys(variables).length} variables remplacées`);
    } else {
      console.log(`✓ ${nomFichier} : aucun changement`);
    }
  } catch (err) {
    console.error(`✗ ${nomFichier} : ${err.message}`);
  }
}

// Traiter tous les fichiers
console.log('Remplacement des variables CSS...\n');

for (const fichier of fichiers) {
  traiterFichier(fichier);
}

console.log('\nTerminé !');
