#!/usr/bin/env node

/**
 * Script to migrate hardcoded colors to oklch() with --hue variable
 * T11: Replace all hex/rgb colors with oklch() using --hue
 */

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'calendrier-semis.html',
  'calendrier-recoltes.html',
  'associations-plantes.html',
  'plantes-nurses.html',
  'semis-arbres.html',
  'temps-au-jardin.html',
  'jardins-vivants.html',
  'pharmacopee.html',
  'jardin-de-demain-prototype.html',
  'arbres-secheresse.html',
  'guide-paillage.html'
];

// Common color replacements (hex/rgb → oklch)
const colorMappings = {
  // Accent colors
  '#d6f900': 'oklch(93% 0.28 var(--hue))',
  'rgba(214,249,0,.04)': 'oklch(93% 0.28 var(--hue) / .04)',
  'rgba(214,249,0,.9)': 'oklch(93% 0.28 var(--hue) / .9)',
  'rgba(214, 249, 0, .4)': 'oklch(93% 0.28 var(--hue) / .4)',
  'rgba(214, 249, 0, .9)': 'oklch(93% 0.28 var(--hue) / .9)',

  // Text colors
  '#f5f4ef': 'oklch(96% 0.01 var(--hue))',

  // Border colors
  '#30343a': 'oklch(22% 0.01 var(--hue))',

  // Dark colors
  '#0b0d10': 'oklch(8% 0.01 var(--hue))',

  // Muted text
  '#718078': 'oklch(56% 0.01 var(--hue))',

  // White with opacity
  'rgba(255,255,255,.08)': 'oklch(100% 0 var(--hue) / .08)',
  'rgba(255,255,255,.07)': 'oklch(100% 0 var(--hue) / .07)',
  'rgba(255, 255, 255, .08)': 'oklch(100% 0 var(--hue) / .08)',
  'rgba(255, 255, 255, .07)': 'oklch(100% 0 var(--hue) / .07)',
};

function updateRootBlock(content) {
  // Check if file has :root block
  const rootMatch = content.match(/:root\s*\{([^}]*)\}/s);
  if (!rootMatch) {
    return content;
  }

  let rootBlock = rootMatch[1];

  // Update accent if still hex
  rootBlock = rootBlock.replace(
    /--accent:\s*#d6f900;/g,
    '--accent: oklch(93% 0.28 var(--hue));'
  );

  // Update text if still hex
  rootBlock = rootBlock.replace(
    /--text:\s*#f5f4ef;/g,
    '--text: oklch(96% 0.01 var(--hue));'
  );

  // Add --text if missing (after --bg-2)
  if (!rootBlock.includes('--text:')) {
    rootBlock = rootBlock.replace(
      /(--bg-2:[^;]+;)/,
      '$1\n      --text: oklch(96% 0.01 var(--hue));'
    );
  }

  // Add --text-secondary if missing (after --text)
  if (!rootBlock.includes('--text-secondary:')) {
    rootBlock = rootBlock.replace(
      /(--text:[^;]+;)/,
      '$1\n      --text-secondary: color-mix(in oklch, var(--text) 68%, transparent);'
    );
  }

  // Add --text-tertiary if missing (after --text-secondary)
  if (!rootBlock.includes('--text-tertiary:')) {
    rootBlock = rootBlock.replace(
      /(--text-secondary:[^;]+;)/,
      '$1\n      --text-tertiary: color-mix(in oklch, var(--text) 48%, transparent);'
    );
  }

  // Add --border if missing
  if (!rootBlock.includes('--border:')) {
    rootBlock = rootBlock.replace(
      /(--text-tertiary:[^;]+;)/,
      '$1\n      --border: oklch(22% 0.01 var(--hue));'
    );
  }

  // Add --text-muted if missing
  if (!rootBlock.includes('--text-muted:')) {
    rootBlock = rootBlock.replace(
      /(--border:[^;]+;)/,
      '$1\n      --text-muted: oklch(56% 0.01 var(--hue));'
    );
  }

  // Add --shadow-1 if missing
  if (!rootBlock.includes('--shadow-1:')) {
    rootBlock = rootBlock.replace(
      /(--text-muted:[^;]+;)/,
      '$1\n      --shadow-1: 0 8px 24px rgba(0, 0, 0, .3);'
    );
  }

  // Add --shadow-2 if missing
  if (!rootBlock.includes('--shadow-2:')) {
    rootBlock = rootBlock.replace(
      /(--shadow-1:[^;]+;)/,
      '$1\n      --shadow-2: 0 12px 32px rgba(0, 0, 0, .4);'
    );
  }

  return content.replace(/:root\s*\{[^}]*\}/s, `:root {${rootBlock}}`);
}

function replaceColors(content) {
  let result = content;

  // Replace known color mappings
  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    // Escape special regex characters in the old color
    const escapedOld = oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s*');  // Allow flexible whitespace
    const regex = new RegExp(escapedOld, 'gi');
    result = result.replace(regex, newColor);
  }

  // Replace direct oklch text color with var(--text)
  result = result.replace(
    /color:\s*oklch\(96%\s+0\.01\s+var\(--hue\)\)/gi,
    'color: var(--text)'
  );

  // Replace color: #718078 with var(--text-muted) or the oklch equivalent
  result = result.replace(
    /color:\s*oklch\(56%\s+0\.01\s+var\(--hue\)\)/gi,
    'color: var(--text-muted)'
  );

  // Replace border: 1px solid #30343a with var(--border)
  result = result.replace(
    /(border(?:-\w+)?:\s*[^;]*?)oklch\(22%\s+0\.01\s+var\(--hue\)\)/gi,
    '$1var(--border)'
  );

  // Replace elevation box-shadow with tokens (not semantic color shadows)
  // --shadow-1: 0 8px 24px rgba(0, 0, 0, .3)
  result = result.replace(
    /box-shadow:\s*0\s+8px\s+24px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*\.3\)/gi,
    'box-shadow: var(--shadow-1)'
  );

  // --shadow-2: 0 12px 32px rgba(0, 0, 0, .4)
  result = result.replace(
    /box-shadow:\s*0\s+12px\s+32px\s+rgba\(0\s*,\s*0\s*,\s*0\s*,\s*\.4\)/gi,
    'box-shadow: var(--shadow-2)'
  );

  return result;
}

function processFile(fileName) {
  try {
    const content = readFileSync(fileName, 'utf-8');

    // Count hardcoded colors before
    const hexBefore = (content.match(/#[0-9a-fA-F]{3,6}/g) || []).length;
    const rgbaBefore = (content.match(/rgba?\(/g) || []).length;
    const totalBefore = hexBefore + rgbaBefore;

    // Update :root block
    let updated = updateRootBlock(content);

    // Replace colors
    updated = replaceColors(updated);

    // Count after
    const hexAfter = (updated.match(/#[0-9a-fA-F]{3,6}/g) || []).length;
    const rgbaAfter = (updated.match(/rgba?\(/g) || []).length;
    const totalAfter = hexAfter + rgbaAfter;

    if (updated !== content) {
      writeFileSync(fileName, updated, 'utf-8');
      console.log(`✓ ${fileName}: ${totalBefore} → ${totalAfter} hardcoded colors (${totalBefore - totalAfter} migrated)`);
    } else {
      console.log(`- ${fileName}: no changes`);
    }
  } catch (err) {
    console.error(`✗ ${fileName}: ${err.message}`);
  }
}

console.log('Migrating colors to oklch()...\n');

for (const file of files) {
  processFile(file);
}

console.log('\nDone! Check remaining colors with:');
console.log('  grep -n "#[0-9a-fA-F]\\{3,6\\}\\|rgba\\?" *.html');
