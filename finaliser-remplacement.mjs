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
    '--grain': 'image-set(url("assets/textures/papier-grain.png") 2x)',
    '--shadow': '0 8px 28px rgba(36,67,49,.055), 0 1px 3px rgba(36,67,49,.045)'
  }
};

// Pour calendar/temps, --max peut être différent
const themesDarkVariantes = {
  '--max-1480': { ...themes.dark, '--max': '1480px' }
};

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

function extraireVariablesDepuisGit(nomFichier) {
  try {
    const contenuOriginal = execSync(`git show HEAD:"${nomFichier}"`, { encoding: 'utf-8' });
    const match = contenuOriginal.match(/:root\s*\{([^}]*)\}/s);

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
  } catch (e) {
    return null;
  }
}

function remplacerVarDansContenu(contenu, variables) {
  let resultat = contenu;

  // Trier par longueur décroissante
  const entries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

  for (const [variable, valeur] of entries) {
    const varEscapee = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`var\\(\\s*${varEscapee}\\s*\\)`, 'g');
    resultat = resultat.replace(regex, valeur);
  }

  return resultat;
}

function traiterFichier(nomFichier) {
  try {
    const chemin = join(process.cwd(), nomFichier);

    // Lire le fichier actuel
    let contenu = readFileSync(chemin, 'utf-8');

    // Vérifier s'il y a des var()
    const hasVar = contenu.includes('var(--');

    if (!hasVar) {
      console.log(`✓ ${nomFichier} : déjà traité`);
      return;
    }

    // Extraire les variables depuis git
    const variables = extraireVariablesDepuisGit(nomFichier);

    if (!variables) {
      console.warn(`⚠ ${nomFichier} : impossible d'extraire les variables`);
      return;
    }

    console.log(`  ${Object.keys(variables).length} variables trouvées`);

    // Remplacer les var()
    const nouveauContenu = remplacerVarDansContenu(contenu, variables);

    // Vérifier s'il reste des var()
    const restantes = (nouveauContenu.match(/var\(--/g) || []).length;

    if (restantes > 0) {
      console.warn(`⚠ ${nomFichier} : ${restantes} var() restantes`);
    } else {
      console.log(`✓ ${nomFichier} : toutes les var() remplacées`);
    }

    // Écrire
    writeFileSync(chemin, nouveauContenu, 'utf-8');

  } catch (err) {
    console.error(`✗ ${nomFichier} : ${err.message}`);
  }
}

console.log('Finalisation du remplacement des var()...\n');

for (const fichier of fichiers) {
  traiterFichier(fichier);
}

console.log('\nTerminé !');
