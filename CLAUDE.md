# Règles pour Claude (et pour tout contributeur) sur La Carte Tech

## Avant d’implémenter quoi que ce soit

1. **Chercher si ça existe déjà** dans le dépôt (`grep` dans `scripts/` et `site/assets/`) avant d’écrire une nouvelle fonction, constante ou liste.
2. **Pas de doublon** : si une donnée ou un composant sert à plusieurs endroits, le mutualiser (une seule source de vérité). Exemple : les villes d’une entreprise vivent dans `bureaux_<région>` ; `rejoindre.bureaux` ne fait que les citer, et le build vérifie la cohérence.
3. **Toute donnée affichée vient d’une fiche** (`fiches/*.yml`) ou de `liens.yml` / `notions.yml`. Les compteurs et totaux sont calculés par `scripts/build.mjs` ou `app.js`, jamais écrits à la main.
4. Si une logique existe dans `build.mjs` **et** dans `app.js`, la mettre à un seul endroit (le build la calcule, le site la lit).

## Règles de contenu

- Uniquement des informations publiques, avec leur source.
- Montants affichés en euros, dollars ou livres uniquement (convertir et le dire dans `note`).
- Format des fiches : voir `CONTRIBUTING.md` et `fiches/_modele.yml`. Ne pas changer un format existant sans raison.
- Une demande = un changement : ne pas modifier ce qui n’est pas demandé.

## Avant de valider

- `npm run build` doit passer (il valide toutes les fiches).
- `npm run format:check` doit passer (Prettier sur le code ; les fiches YAML et le HTML ne sont pas reformatés).
- Français partout, commits compris.
