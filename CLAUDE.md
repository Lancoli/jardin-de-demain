# Jardin de demain — app rules

Guides to garden for a changing climate (see [README.md](README.md)). Shared rules: [../CLAUDE.md](../CLAUDE.md).

## Own rules

- **Low-cost approach**: every guide must be doable without expensive equipment, in a private garden.
- **Invent nothing in botany**: a sowing date, a companion planting or a medicinal property comes from a cited
  source. When in doubt, write less.
- **Styles live in the pages** (no `css/`): the next design step is to move them to `css/` with tokens, so that
  `node tools/design-lint.mjs JardinDeDemain` can measure them.
- `tools/replace-css-vars.mjs` and `tools/finish-css-vars.mjs`: the tools of the CSS variable migration.
- **Languages**: code, comments and docs in English. The pages are French; their move to `i18n/` (fr default, en)
  is pending a decision on translating the guides (root rule "Language", translate-en skill, step 4).
- The page data keys (`nom`, `saison`, `usages`…) stay French until that step: they mirror ids used in the HTML.

## Check

`node tools/jalons.mjs JardinDeDemain` · `lancer liens JardinDeDemain` (from the root).
