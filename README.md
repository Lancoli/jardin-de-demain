# Jardin de demain

<!-- badges : généré par tools/kit-github.mjs -->
[![qualité](https://github.com/Lancoli/jardin-de-demain/actions/workflows/qualite.yml/badge.svg)](https://github.com/Lancoli/jardin-de-demain/actions/workflows/qualite.yml) [![release](https://img.shields.io/github/v/release/Lancoli/jardin-de-demain?include_prereleases&label=version)](https://github.com/Lancoli/jardin-de-demain/releases) [![Conventional Commits](https://img.shields.io/badge/commits-conventionnels%20%2B%20gitmoji-ff69b4)](https://www.conventionalcommits.org/fr/) [![dernier commit](https://img.shields.io/github/last-commit/Lancoli/jardin-de-demain)](https://github.com/Lancoli/jardin-de-demain/commits)
<!-- /badges -->

> A low-cost approach to the agronomic and agricultural transformation of private land.

Guides to garden for a changing climate: sowing and harvest calendars, plant companions, drought-resistant trees,
mulching, nurse plants, apothecary, tree sowing, living gardens. The pages are written in French for a local audience.

## Run

Static site, no build step.

- **With the whole portfolio**: `lancer.cmd` at the portfolio root, then http://localhost:4101/JardinDeDemain/
- **In Docker** (as online): `lancer docker`, then http://localhost:8080/JardinDeDemain/
- **Alone**: any static server opened in this folder (paths are relative).

## Tools

- `node tools/generate-grain.mjs`: regenerates `assets/textures/paper-grain.png` (reproducible, no dependency).
- `tools/replace-css-vars.mjs`, `tools/finish-css-vars.mjs`: the one-off CSS variable migration, kept for reference.

## Quality

This project follows the portfolio milestones (`docs/JALONS.md` at the root): its goals and state are in `jalons.json`.
Check: `node tools/jalons.mjs JardinDeDemain` from the portfolio root.
