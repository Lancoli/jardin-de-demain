# Jardin de demain

> Approche low-cost de la transformation agronome et agricole des espaces privés.

Des guides pour jardiner face au climat qui change : calendriers des semis et des récoltes, associations de plantes,
arbres résistants à la sécheresse, paillage, plantes nurses, pharmacopée, semis d'arbres, jardins vivants.

## Lancer

Site statique, sans étape de construction.

- **Avec tout le portfolio** : `lancer.cmd` à la racine du portfolio, puis http://localhost:4101/JardinDeDemain/
- **Dans Docker** (comme en ligne) : `lancer docker`, puis http://localhost:8080/JardinDeDemain/
- **Seul** : n'importe quel serveur statique ouvert dans ce dossier (les chemins sont relatifs).

## Qualité

Ce projet suit les jalons du portfolio (`docs/JALONS.md` à la racine) : ses objectifs et son état sont dans `jalons.json`.
Vérification : `node tools/jalons.mjs JardinDeDemain` depuis la racine du portfolio.
