# La Carte Tech

**Comprendre la tech et ses acteurs, en 10 minutes.**

### 👉 [Voir le site : eliotkoz-dev.github.io/la-carte-tech](https://eliotkoz-dev.github.io/la-carte-tech/)

[![La Carte Tech](site/assets/apercu.png)](https://eliotkoz-dev.github.io/la-carte-tech/)

Un site open source, fait par des étudiants pour des étudiants, qui explique simplement :

- **les acteurs** : 167 entreprises (cloud, IA, puces, data, logiciels, cybersécurité, pub, e-commerce, fintech, crypto, aérospatial et défense), avec leur chiffre d’affaires, leurs produits phares, leur modèle économique, leur façon de vendre, leurs rachats, leurs liens (qui possède qui, qui investit dans qui, qui travaille avec qui) et leurs stages ;
- **la tech en rapide** : des notions qui s’ouvrent au clic (cloud, IA, puces, etc., et deux guides pour préparer son CV et ses entretiens), avec la taille du marché et les plus gros acteurs ;
- **les métiers** de la tech au-delà du code : vente, avant-vente, relation client, marketing, produit, data et fonctions business.
- **où candidater** : les sites d’offres (grandes audiences, start-ups, stages et alternance) et comment lire les sites carrières des entreprises.

Chaque chiffre a sa source.

## Comment c’est fait

Une entreprise = un petit fichier texte dans [`fiches/`](fiches/). Par exemple [`fiches/aws.yml`](fiches/aws.yml) :

```yaml
nom: AWS
categorie: cloud
region: amerique-du-nord
chiffre_affaires:
  texte: "128,7 Md$ en 2025 (+20 %)"
  md_usd: 128.7
produits:
  - nom: EC2
    detail: serveurs virtuels à louer à l’heure
stages:
  statut: oui
sources:
  - titre: "Amazon, résultats 2025"
    url: "https://www.nasdaq.com/press-release/amazoncom-announces-fourth-quarter-results-2026-02-05"
```

Les liens entre entreprises sont dans [`liens.yml`](liens.yml), les notions de « La tech en rapide » dans [`notions.yml`](notions.yml). À chaque modification, GitHub vérifie les fiches puis republie le site automatiquement.

```
fiches/            une fiche par entreprise (+ _modele.yml à copier)
liens.yml          parentés, investissements et partenariats
notions.yml        les notions de « La tech en rapide »
site/              les pages du site (HTML, CSS, JS)
scripts/build.mjs  vérifie les fiches et génère site/data/acteurs.json
```

## Contribuer

Une entreprise manque, un chiffre est faux ou daté ? Tout est expliqué dans **[CONTRIBUTING.md](CONTRIBUTING.md)**. Pas besoin de savoir coder : on peut aussi ouvrir une *issue* avec le formulaire « Proposer une fiche » ou « Signaler une erreur ».

**Règle d’or : uniquement des informations publiques, avec leur source.**

## Lancer le site sur son ordinateur

Il faut [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
npm start        # vérifie les fiches, puis ouvre le site sur http://localhost:3000
```

`npm run build` vérifie seulement les fiches : en cas d’erreur, il dit quel fichier et quel champ corriger.

## Licence

- Le **contenu** (fiches, textes) est sous licence [CC BY-SA 4.0](LICENSE-CONTENU.md) : réutilisable en citant La Carte Tech.
- Le **code** est sous licence [MIT](LICENSE).

Les chiffres viennent des sources citées dans chaque fiche. La Carte Tech n’est liée à aucune des entreprises présentées.
