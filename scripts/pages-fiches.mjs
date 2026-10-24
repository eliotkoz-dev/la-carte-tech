// Génère une page HTML statique par fiche (site/fiche/<id>.html), un plan du site et un robots.txt.
// Ces pages contiennent tout le texte de la fiche : les moteurs de recherche les lisent sans JavaScript,
// et chaque fiche a une adresse que l'on peut partager. Le contenu vient uniquement des données déjà validées par build.mjs.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

// Libellés (catégories, régions, stages) : lus dans site/assets/commun.js, qui reste leur seule source.
function lireLibelles(racine) {
  const fenetre = {};
  vm.runInNewContext(readFileSync(join(racine, 'site', 'assets', 'commun.js'), 'utf8'), {
    window: fenetre,
    document: { querySelectorAll: () => [] },
  });
  return fenetre.CarteTech;
}

const e = (t) =>
  String(t ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const VOIES = {
  stage: 'Stage',
  alternance: 'Alternance',
  graduate: 'Programme jeunes diplômés',
  vie: 'VIE',
  'premier-poste': 'Premier poste',
};
const TYPES_LIEN = {
  parente: 'Parenté',
  investissement: 'Investissement',
  partenariat: 'Partenariat',
};
const lien = (url, titre) => `<a href="${e(url)}" rel="noopener">${e(titre)}</a>`;
const liste = (items) =>
  `<ul class="liste-fiche">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const section = (id, titre, corps) =>
  `  <section class="section famille" id="${id}" aria-labelledby="t-${id}" style="gap: 14px;">
    <div class="tete-famille"><h2 class="h2-famille" id="t-${id}">${e(titre)}</h2></div>
    <div class="texte-fiche">${corps}</div>
  </section>
`;

export function genererPagesFiches({ racine, acteurs, liens, depot, urlBase }) {
  const { CATEGORIES, REGIONS, STAGES, dateFr, periodeFr } = lireLibelles(racine);
  const empreinte = (fichier) =>
    createHash('sha1')
      .update(readFileSync(join(racine, 'site', fichier)))
      .digest('hex')
      .slice(0, 8);
  const css = `../assets/style.css?v=${empreinte('assets/style.css')}`;
  const js = `../assets/commun.js?v=${empreinte('assets/commun.js')}`;
  const parId = Object.fromEntries(acteurs.map((a) => [a.id, a]));
  const dossier = join(racine, 'site', 'fiche');
  mkdirSync(dossier, { recursive: true });
  for (const f of readdirSync(dossier)) if (f.endsWith('.html')) unlinkSync(join(dossier, f));

  for (const a of acteurs) {
    const description = `${a.nom} : ${a.enBref}. ${a.vend} Fiche sourcée et datée (${dateFr(a.verifieLe)}) : produits, modèle économique, rachats, concurrents et stages.`;
    const ses = liens
      .filter((l) => l.de === a.id || l.vers === a.id)
      .map((l) => {
        const autre = parId[l.de === a.id ? l.vers : l.de];
        const sens = l.de === a.id ? 'de' : 'vers';
        const role = {
          parente: { de: 'Possède', vers: 'Appartient à' },
          investissement: { de: 'A investi dans', vers: 'Financée par' },
          partenariat: { de: 'Partenaire de', vers: 'Partenaire de' },
        }[l.type][sens];
        const statut = l.statut === 'annonce' ? ' (annoncé, pas encore finalisé)' : '';
        return `<b>${e(role)}</b> <a href="${e(autre.id)}.html">${e(autre.nom)}</a> · ${e(l.texte)}${statut}${
          l.source ? ` · ${lien(l.source, 'source')}` : ''
        } <span class="discret">(${e(TYPES_LIEN[l.type])})</span>`;
      });
    const blocs = [];
    blocs.push(
      section(
        'vend',
        'Ce qu’elle vend',
        `<p>${e(a.vend)}</p>${liste(a.produits.map((p) => `<b>${e(p.nom)}</b> : ${e(p.detail)}`))}`,
      ),
    );
    blocs.push(
      section(
        'modele',
        'Comment elle gagne de l’argent',
        `<p>${e(a.modele)}</p><p><b>Clients :</b> ${e(a.clients)}</p>`,
      ),
    );
    if (a.cles.length) blocs.push(section('chiffres', 'Chiffres clés', liste(a.cles.map(e))));
    if (a.vente) {
      blocs.push(
        section(
          'vente',
          'Comment elle vend',
          `<p>${e(a.vente.resume)}</p><p><b>Qui décide de l’achat :</b> ${e(a.vente.acheteurs)}</p>${
            a.vente.argument ? `<p><b>Son argument :</b> ${e(a.vente.argument)}</p>` : ''
          }<p><b>Objections fréquentes :</b></p>${liste(a.vente.objections.map(e))}`,
        ),
      );
    }
    blocs.push(
      section(
        'rachats',
        'Rachats et concurrents',
        `${liste(a.rachats.map(e))}<p><b>Concurrents :</b> ${e(a.concurrents)}</p>${
          a.note ? `<p>${e(a.note)}</p>` : ''
        }`,
      ),
    );
    if (ses.length) blocs.push(section('liens', 'Ses liens avec d’autres acteurs', liste(ses)));

    const bureaux = Object.entries(a.bureaux).map(([rid, b]) => {
      const villes = b.villes
        .map((v) => (v.pays ? `${v.ville} (${v.pays})` : v.ville))
        .concat(b.pays);
      return `<p><b>${e(REGIONS[rid]?.nom || rid)} :</b> ${e(villes.join(', '))}${
        b.note ? ` <span class="discret">${e(b.note)}</span>` : ''
      }</p>`;
    });
    let stages = `<p><span class="badge ${e(a.stage)}">${e(STAGES[a.stage])}</span></p><p>${e(a.stageDetail)}</p>`;
    stages += `<p class="discret">Relevé ${e(periodeFr(a.stageVuLe))}${
      a.stageObsolete ? ' : plus de 6 mois, à revérifier sur le site de l’entreprise' : ''
    }.</p>`;
    const r = a.rejoindre;
    if (r) {
      if (r.voies.length)
        stages += liste(
          r.voies.map((v) => `<b>${e(VOIES[v.type] || v.type)} · ${e(v.nom)}</b> : ${e(v.detail)}`),
        );
      if (r.calendrier) stages += `<p><b>Calendrier :</b> ${e(r.calendrier)}</p>`;
      if (r.langues) stages += `<p><b>Langues :</b> ${e(r.langues)}</p>`;
      if (r.aVerifier) stages += `<p><b>À vérifier :</b> ${e(r.aVerifier)}</p>`;
    }
    const carrieres = [
      a.carrieresJeunes && lien(a.carrieresJeunes, 'Stages et jeunes diplômés'),
      a.carrieres && lien(a.carrieres, 'Page carrières'),
    ].filter(Boolean);
    if (carrieres.length) stages += `<p>${carrieres.join(' · ')}</p>`;
    blocs.push(section('stages', 'Stages et recrutement', stages));
    if (bureaux.length) blocs.push(section('bureaux', 'Ses bureaux', bureaux.join('')));
    blocs.push(section('sources', 'Sources', liste(a.sources.map((s) => lien(s.url, s.titre)))));

    const edit = `https://github.com/${depot}/edit/main/fiches/${a.id}.yml`;
    const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(a.nom)} · La Carte Tech</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${e(urlBase)}fiche/${e(a.id)}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${e(a.nom)} · ${e(a.enBref)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:image" content="${e(urlBase)}assets/apercu.png">
<meta property="og:url" content="${e(urlBase)}fiche/${e(a.id)}.html">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${css}">
</head>
<body>
<header class="entete">
  <a class="logo" href="../index.html"><span class="logo-carres" aria-hidden="true"><span class="c-bleu"></span><span class="c-violet"></span><span class="c-violet"></span><span class="c-rose"></span></span><span class="logo-nom">La Carte Tech</span></a>
  <nav class="nav" aria-label="Navigation principale">
    <a href="../index.html" aria-current="page">Les acteurs</a>
    <a href="../tech.html">La tech en rapide</a>
    <a href="../metiers.html">Les métiers</a>
    <a href="../candidater.html">Où candidater</a>
    <a href="../cv.html">Préparer son CV</a>
    <a href="../entretiens.html">Préparer ses entretiens</a>
    <a class="bouton-nav" href="../index.html#contribuer">Contribuer</a>
  </nav>
</header>
<div class="bande"><div class="mosaique" data-rangs="4" aria-hidden="true"></div></div>

<main class="page" style="gap: 36px; padding-top: 48px;">
  <div class="titre-section grand">
    <div><h1>${e(a.nom)}</h1></div>
    <span class="trois-carres" aria-hidden="true"><span class="c-bleu"></span><span class="c-violet"></span><span class="c-rose"></span></span>
  </div>
  <p class="intro-grande">${e(a.enBref)}. ${e(CATEGORIES[a.categorie])} · ${e(REGIONS[a.region].nom)} · ${e(a.groupe)} · siège : ${e(a.siege)}. Chiffre d’affaires : ${e(a.ca)}.</p>
  <nav class="nav-familles" aria-label="Sommaire"><a href="../index.html#${e(a.id)}">Voir sur la carte</a> · <a href="${e(edit)}" rel="noopener">Modifier cette fiche</a> · <a href="../index.html#titre-fiches">Toutes les fiches</a></nav>

${blocs.join('\n')}
  <p class="pied-fiche">Fiche vérifiée le ${e(dateFr(a.verifieLe))} · une erreur ? <a href="${e(edit)}" rel="noopener">Modifier cette fiche sur GitHub</a></p>
  <p class="pied">La Carte Tech · v0.2 · octobre 2026 · contenu sous licence CC BY-SA 4.0</p>
</main>
<script src="${js}"></script>
</body>
</html>
`;
    writeFileSync(join(dossier, `${a.id}.html`), page);
  }

  const pages = ['', 'tech.html', 'metiers.html', 'candidater.html', 'cv.html', 'entretiens.html'];
  const plan = [
    ...pages.map((p) => `${urlBase}${p}`),
    ...acteurs.map((a) => `${urlBase}fiche/${a.id}.html`),
  ];
  writeFileSync(
    join(racine, 'site', 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${plan
      .map((u) => `  <url><loc>${e(u)}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  writeFileSync(
    join(racine, 'site', 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${urlBase}sitemap.xml\n`,
  );
  return acteurs.length;
}
