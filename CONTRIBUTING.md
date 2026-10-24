# Contribuer à La Carte Tech

Merci ! Il y a trois façons d’aider, de la plus simple à la plus complète.

## 1. Signaler une erreur ou proposer une entreprise (sans code)

Ouvrez une *issue* avec l’un des deux formulaires : **Signaler une erreur** ou **Proposer une fiche**. Donnez toujours le lien de la source.

## 2. Modifier une fiche directement sur GitHub

1. Ouvrez la fiche dans [`fiches/`](fiches/) (ou cliquez sur « Modifier cette fiche » sur le site).
2. Cliquez sur le crayon ✏️, faites la modification.
3. Mettez à jour `verifie_le` avec la date du jour.
4. En bas, choisissez « Propose changes » : GitHub crée une *pull request*.

Une vérification automatique se lance. Si un champ est mal rempli, elle indique quel fichier et quel champ corriger. La modification est relue, puis le site se met à jour tout seul.

## 3. Ajouter une entreprise

Copiez [`fiches/_modele.yml`](fiches/_modele.yml) dans un nouveau fichier, par exemple `fiches/mon-entreprise.yml` (minuscules, tirets à la place des espaces), puis remplissez-le.

| Champ | Ce qu’on attend |
|---|---|
| `nom` | Le nom courant de l’entreprise |
| `categorie` | `cloud`, `ia`, `puces`, `data`, `saas` (logiciels), `cyber`, `pub` (pub & plateformes), `ecommerce`, `fintech`, `crypto` ou `espace` (aérospatial & défense) |
| `region` | Région d’origine : `amerique-du-nord`, `europe` ou `asie` |
| `aussi` | Facultatif : 1 ou 2 autres catégories où l’entreprise est très active, par exemple `[ia]` pour un cloud qui vend aussi de l’IA. Sa bulle se place alors entre les zones |
| `groupe`, `siege` | Cotée ou non, groupe, ville et pays |
| `en_bref` | Ce qu’elle fait, en moins de 6 mots |
| `chiffre_affaires.texte` | Le chiffre d’affaires annuel du dernier exercice, avec l’année et la croissance : `3,43 Md$ en 2025 (+28 %)`. Pour une entreprise non cotée : le revenu annualisé ou récurrent, en le disant. Sinon `Non publié` |
| `chiffre_affaires.md_usd` | Le même chiffre en milliards de dollars (taux de change approximatif), qui fixe la taille de la bulle. `0` si non publié |
| `chiffres_cles` | Une liste : salariés, clients, part de marché, valorisation… (peut être vide : `[]`) |
| `ce_qu_elle_vend` | Une phrase simple, sans jargon |
| `produits` | 2 à 6 produits phares, chacun avec `nom` et `detail` |
| `modele` | Comment elle gagne de l’argent : abonnement, commission, publicité, licence… |
| `clients` | Qui achète |
| `rachats` | Une liste : `Nom (année) : ce que ça apporte`, ou `Aucun rachat listé` |
| `concurrents` | Deux ou trois noms |
| `note` | Facultatif : une info utile (investisseurs, partenariats) |
| `carrieres` | Facultatif : adresse https de la page carrières officielle (`carrieres_jeunes` : page stages / jeunes diplômés) |
| `stages.statut` | `oui` ou `alternance` seulement avec une offre publique en lien ; si l’offre n’est pas en France, le dire dans `detail` ; sinon `a-verifier` |
| `vente` | Facultatif : comment l’entreprise vend (voir ci-dessous) |
| `bureaux_europe` | Facultatif : `villes` (liste au format `Ville (Pays)`, par exemple `Paris (France)`), `note` (facultatif) et `sources` (obligatoire). S’affiche quand on clique sur l’entreprise. Si aucune ville n’est connue, `pays` (liste de noms de pays, par exemple `Irlande`) indique où l’entreprise est présente ou recrute |
| `bureaux_asie`, `bureaux_amerique_du_nord`, `bureaux_amerique_latine`, `bureaux_moyen_orient_afrique`, `bureaux_oceanie` | Facultatifs, même format que `bureaux_europe` : `villes` au format `Ville (Pays)`, `note` facultative, `sources` obligatoire (page officielle de l’entreprise de préférence). S’affichent dans la fiche et alimentent le filtre « Locaux en … à … » |
| `rejoindre` | Facultatif : comment l’entreprise recrute les étudiants (voir ci-dessous) |
| `sources` | Au moins une : `titre` et `url` (qui commence par `https://`) |
| `verifie_le` | Date de la dernière vérification, au format `AAAA-MM-JJ` |

Le bloc `vente` explique comment l’entreprise trouve et signe ses clients :

| Champ | Ce qu’il faut mettre |
|---|---|
| `approche` | Obligatoire : `libre-service` (le client s’inscrit et paie en ligne), `vente-directe` (des commerciaux signent chaque client), `mixte` (les deux selon la taille du client) ou `partenaires` (surtout via des revendeurs ou intégrateurs) |
| `resume` | Obligatoire : une ou deux phrases sur la façon de vendre |
| `acheteurs` | Obligatoire : qui décide de l’achat chez le client (DSI, marketing, achats…) |
| `argument` | Facultatif : ce que l’entreprise met en avant face aux concurrents |
| `objections` | Obligatoire : 1 à 3 objections fréquentes d’un client |
| `sources` | Facultatif, mais obligatoire dès qu’il y a un chiffre (taille de contrat, nombre de commerciaux…) |

Le bloc `rejoindre` se remplit ainsi :

| Champ | Ce qu’il faut mettre |
|---|---|
| `bureaux` | Facultatif : liste de `ville` (et `detail`) où l’entreprise recrute. Chaque ville doit déjà figurer dans les listes `bureaux_<région>` de la fiche : les villes ne sont écrites qu’à un seul endroit, et le build refuse sinon |
| `voies` | Obligatoire : liste de `type`, `nom`, `detail`. Types : `stage`, `alternance`, `graduate`, `vie`, `premier-poste` |
| `calendrier`, `langues` | Facultatifs : quand postuler, langues demandées |
| `a_verifier` | Facultatif : ce qu’on n’a pas pu confirmer (mieux vaut l’écrire que deviner) |
| `sources` | Obligatoire : pages carrières officielles ou offres publiques. Pas d’offre précise sans lien, pas de salaire sans source officielle |

Pour ajouter un lien, ajoutez une entrée dans [`liens.yml`](liens.yml), avec sa source si possible. Il y a trois types, par ordre d’importance :

1. `parente` : « de » possède « vers » (la maison mère en `de`, la filiale en `vers`). Trait rouge avec une flèche.
2. `investissement` : « de » a investi dans « vers ». Trait noir avec une flèche.
3. `partenariat` : les deux travaillent ensemble (contrat, intégration, fournisseur). Pointillé, sans flèche.

Les notions de la page « La tech en rapide » sont dans [`notions.yml`](notions.yml) : chaque chiffre de marché doit avoir sa source.

## Les règles

- **Public et sourcé.** Chaque chiffre a une source publique : résultats officiels, communiqué, article de presse sérieux. Pas d’information interne ou confidentielle, même si on la connaît.
- **Daté.** On écrit l’année ou le trimestre du chiffre (« 3,13 Md$ en 2025 »), jamais « actuellement ».
- **Simple.** On écrit pour un étudiant qui découvre : phrases courtes, pas de jargon sans explication.
- **Neutre.** On décrit, on ne fait pas de publicité ni de critique.

## Tester sur son ordinateur

```bash
npm install
npm run build    # vérifie toutes les fiches
npm start        # ouvre le site en local
npm run format   # met en forme le code avec Prettier (scripts et fichiers du site)
```

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md). Pour signaler une faille, voir [SECURITY.md](SECURITY.md).
