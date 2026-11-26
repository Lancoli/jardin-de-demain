# Jardin de demain — règles de l'app

Des guides pour jardiner face au climat qui change (voir [README.md](README.md)). Règles communes : [../CLAUDE.md](../CLAUDE.md).

## Règles propres

- **Approche low-cost** : chaque guide doit pouvoir s'appliquer sans matériel coûteux, sur un jardin privé.
- **Ne rien inventer en botanique** : une date de semis, une association ou une propriété médicinale vient d'une source
  citée. Dans le doute, on écrit moins.
- **Les styles sont dans les pages** (pas de `css/`) : la prochaine étape design est de les sortir dans `css/` avec des
  jetons, pour que `node tools/design-lint.mjs JardinDeDemain` puisse mesurer.
- `remplacer-variables-css.mjs` et `finaliser-remplacement.mjs` sont des outils : leur place est `tools/`.

## Vérifier

`node tools/jalons.mjs JardinDeDemain` · `lancer liens JardinDeDemain` (depuis la racine).
