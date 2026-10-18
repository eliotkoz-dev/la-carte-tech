// Construit site/data/acteurs.json à partir de fiches/*.yml, liens.yml et notions.yml.
// Vérifie chaque fichier : si une règle n'est pas respectée, le build échoue
// et la vérification de la pull request sur GitHub affiche l'erreur.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATEGORIES = ['cloud', 'ia', 'puces', 'data', 'saas', 'cyber', 'pub', 'ecommerce', 'fintech', 'crypto', 'espace'];
const REGIONS = ['amerique-du-nord', 'europe', 'asie'];
const STAGES = ['oui', 'alternance', 'a-verifier'];
const TYPES = ['parente', 'investissement', 'partenariat'];
const W = 1180;
const H = 1660;
// Rayon des bulles : grandit avec la racine carrée du chiffre d'affaires (même formule que site/assets/app.js).
const rayon = (md) => (md > 0 ? 8 + 2 * Math.sqrt(md) : 9);

const erreurs = [];
const err = (fichier, message) => erreurs.push(`${fichier} : ${message}`);
const texte = (v) => typeof v === 'string' && v.trim().length > 0;
const listeTextes = (v, vide = false) => Array.isArray(v) && (vide || v.length > 0) && v.every(texte);
const url = (v) => typeof v === 'string' && /^https:\/\/\S+$/.test(v);
const lire = (fichier) => {
  try {
    return yaml.load(readFileSync(join(root, fichier), 'utf8'));
  } catch (e) {
    err(fichier, `YAML invalide (${e.reason || e.message})`);
    return null;
  }
};

// Bloc facultatif « rejoindre » : où et comment une entreprise recrute les étudiants.
const VOIES = ['stage', 'alternance', 'graduate', 'vie', 'premier-poste'];
function verifierRejoindre(f, r) {
  if (r === undefined) return undefined;
  if (!r || typeof r !== 'object') { err(f, '« rejoindre » doit contenir des champs (voir CONTRIBUTING.md)'); return undefined; }
  const bureaux = r.bureaux || [];
  if (!Array.isArray(bureaux)) err(f, '« rejoindre.bureaux » doit être une liste de villes');
  else bureaux.forEach((b, i) => {
    if (!b || !texte(b.ville)) err(f, `rejoindre.bureaux n°${i + 1} : « ville » manquante`);
    if (b && b.detail !== undefined && !texte(b.detail)) err(f, `rejoindre.bureaux n°${i + 1} : « detail » est vide`);
  });
  if (!Array.isArray(r.voies) || r.voies.length === 0) err(f, `« rejoindre.voies » doit lister au moins une voie d’entrée (${VOIES.join(', ')})`);
  else r.voies.forEach((v, i) => {
    if (!v || !VOIES.includes(v.type)) err(f, `rejoindre.voies n°${i + 1} : « type » doit être ${VOIES.join(', ')}`);
    if (!v || !texte(v.nom) || !texte(v.detail)) err(f, `rejoindre.voies n°${i + 1} : « nom » et « detail » obligatoires`);
  });
  for (const c of ['calendrier', 'langues', 'a_verifier']) if (r[c] !== undefined && !texte(r[c])) err(f, `« rejoindre.${c} » est vide`);
  if (!Array.isArray(r.sources) || r.sources.length === 0) err(f, '« rejoindre.sources » : au moins une source (titre et url) est obligatoire');
  else r.sources.forEach((s, i) => {
    if (!s || !texte(s.titre)) err(f, `rejoindre.sources n°${i + 1} : « titre » manquant`);
    if (!s || !url(s.url)) err(f, `rejoindre.sources n°${i + 1} : « url » doit commencer par https://`);
  });
  return {
    bureaux: bureaux.map((b) => ({ ville: b?.ville, detail: b?.detail || '' })),
    voies: (r.voies || []).map((v) => ({ type: v?.type, nom: v?.nom, detail: v?.detail })),
    calendrier: r.calendrier || '', langues: r.langues || '', aVerifier: r.a_verifier || '',
    sources: (r.sources || []).map((s) => ({ titre: s?.titre, url: s?.url }))
  };
}

// Bloc facultatif « vente » : comment l'entreprise trouve et signe ses clients.
const APPROCHES = ['libre-service', 'vente-directe', 'mixte', 'partenaires'];
function verifierVente(f, v) {
  if (v === undefined) return undefined;
  if (!v || typeof v !== 'object') { err(f, '« vente » doit contenir des champs (voir CONTRIBUTING.md)'); return undefined; }
  if (!APPROCHES.includes(v.approche)) err(f, `« vente.approche » doit être : ${APPROCHES.join(', ')}`);
  for (const c of ['resume', 'acheteurs']) if (!texte(v[c])) err(f, `« vente.${c} » manquant`);
  if (!listeTextes(v.objections) || v.objections.length > 3) err(f, '« vente.objections » : une liste de 1 à 3 objections');
  if (v.argument !== undefined && !texte(v.argument)) err(f, '« vente.argument » est vide');
  if (v.sources !== undefined && (!Array.isArray(v.sources) || !v.sources.every((s) => s && texte(s.titre) && url(s.url)))) err(f, '« vente.sources » : chaque source a un « titre » et une « url » en https://');
  return {
    approche: v.approche, resume: v.resume, acheteurs: v.acheteurs, objections: v.objections || [], argument: v.argument || '',
    sources: (v.sources || []).map((s) => ({ titre: s?.titre, url: s?.url }))
  };
}

// Bloc facultatif « bureaux_europe » : les villes d'Europe où l'entreprise a des bureaux, au format « Ville (Pays) ».
function verifierBureaux(f, b) {
  if (b === undefined) return undefined;
  if (!b || typeof b !== 'object') { err(f, '« bureaux_europe » doit contenir « villes » et « sources »'); return undefined; }
  if (!Array.isArray(b.villes) || b.villes.length === 0 || !b.villes.every((v) => typeof v === 'string' && /^.+ \([^()]+\)$/.test(v))) err(f, '« bureaux_europe.villes » : une liste de villes au format « Ville (Pays) »');
  if (b.note !== undefined && !texte(b.note)) err(f, '« bureaux_europe.note » est vide');
  if (!Array.isArray(b.sources) || b.sources.length === 0 || !b.sources.every((s) => s && texte(s.titre) && url(s.url))) err(f, '« bureaux_europe.sources » : au moins une source (titre et url en https://)');
  return {
    villes: (b.villes || []).map((v) => { const m = String(v).match(/^(.+) \(([^()]+)\)$/); return m ? { ville: m[1], pays: m[2] } : { ville: String(v), pays: '' }; }),
    note: b.note || '', sources: (b.sources || []).map((s) => ({ titre: s?.titre, url: s?.url }))
  };
}

const dossier = join(root, 'fiches');
const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.yml') && !f.startsWith('_')).sort();
const acteurs = [];

for (const f of fichiers) {
  const id = f.replace(/\.yml$/, '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) err(f, 'le nom du fichier doit être en minuscules, avec des tirets (ex. palo-alto.yml)');
  const d = lire(join('fiches', f));
  if (!d || typeof d !== 'object') { if (d !== null) err(f, 'fichier vide'); continue; }
  for (const champ of ['nom', 'groupe', 'siege', 'en_bref', 'ce_qu_elle_vend', 'modele', 'clients', 'concurrents']) {
    if (!texte(d[champ])) err(f, `champ « ${champ} » manquant`);
  }
  if (!CATEGORIES.includes(d.categorie)) err(f, `« categorie » doit être : ${CATEGORIES.join(', ')}`);
  if (!REGIONS.includes(d.region)) err(f, `« region » doit être : ${REGIONS.join(', ')}`);
  const ca = d.chiffre_affaires || {};
  if (!texte(ca.texte)) err(f, '« chiffre_affaires.texte » manquant (ex. « 3,4 Md$ en 2025 (+28 %) » ou « Non publié »)');
  if (!(typeof ca.md_usd === 'number' && ca.md_usd >= 0)) err(f, '« chiffre_affaires.md_usd » doit être un nombre en milliards de dollars (0 si non publié)');
  if (!listeTextes(d.chiffres_cles || [], true)) err(f, '« chiffres_cles » doit être une liste de lignes');
  if (!Array.isArray(d.produits) || d.produits.length === 0 || !d.produits.every((p) => p && texte(p.nom) && texte(p.detail))) err(f, '« produits » doit être une liste avec « nom » et « detail »');
  if (!listeTextes(d.rachats)) err(f, '« rachats » doit être une liste (écrire « Aucun rachat listé » si besoin)');
  if (d.note !== undefined && !texte(d.note)) err(f, '« note » est vide');
  if (!d.stages || !STAGES.includes(d.stages.statut)) err(f, `« stages.statut » doit être : ${STAGES.join(', ')}`);
  if (!d.stages || !texte(d.stages.detail)) err(f, '« stages.detail » manquant');
  const rejoindre = verifierRejoindre(f, d.rejoindre);
  const vente = verifierVente(f, d.vente);
  const bureauxEurope = verifierBureaux(f, d.bureaux_europe);
  if (d.aussi !== undefined && (!Array.isArray(d.aussi) || d.aussi.length > 2 || !d.aussi.every((c) => CATEGORIES.includes(c) && c !== d.categorie))) err(f, `« aussi » : une liste de 1 ou 2 autres catégories (${CATEGORIES.join(', ')})`);
  if (!Array.isArray(d.sources) || d.sources.length === 0) err(f, 'au moins une source est obligatoire');
  else d.sources.forEach((s, i) => {
    if (!s || !texte(s.titre)) err(f, `source n°${i + 1} : « titre » manquant`);
    if (!s || !url(s.url)) err(f, `source n°${i + 1} : « url » doit commencer par https://`);
  });
  const date = d.verifie_le instanceof Date ? d.verifie_le.toISOString().slice(0, 10) : String(d.verifie_le || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) err(f, '« verifie_le » doit être une date AAAA-MM-JJ');
  acteurs.push({
    id, nom: d.nom, categorie: d.categorie, region: d.region, groupe: d.groupe, siege: d.siege, enBref: d.en_bref,
    ca: ca.texte, mdUsd: ca.md_usd, cles: d.chiffres_cles || [], vend: d.ce_qu_elle_vend,
    produits: (d.produits || []).map((p) => ({ nom: p?.nom, detail: p?.detail })), modele: d.modele, clients: d.clients,
    rachats: d.rachats, concurrents: d.concurrents, note: d.note || '', vente, aussi: d.aussi || [], bureauxEurope,
    stage: d.stages?.statut, stageDetail: d.stages?.detail, rejoindre,
    sources: (d.sources || []).map((s) => ({ titre: s?.titre, url: s?.url })),
    verifieLe: date
  });
}

const ids = new Set(acteurs.map((a) => a.id));
const liens = lire('liens.yml') || [];
liens.forEach((l, i) => {
  const n = `lien n°${i + 1}`;
  if (!ids.has(l.de)) err('liens.yml', `${n} : « de: ${l.de} » ne correspond à aucune fiche`);
  if (!ids.has(l.vers)) err('liens.yml', `${n} : « vers: ${l.vers} » ne correspond à aucune fiche`);
  if (!TYPES.includes(l.type)) err('liens.yml', `${n} : « type » doit être ${TYPES.join(', ')}`);
  if (!texte(l.texte)) err('liens.yml', `${n} : « texte » manquant`);
  if (l.source !== undefined && !url(l.source)) err('liens.yml', `${n} : « source » doit commencer par https://`);
});

const notions = lire('notions.yml') || [];
notions.forEach((n, i) => {
  const nom = `notion « ${n?.id || i + 1} »`;
  if (!n || !/^[a-z0-9-]+$/.test(n.id || '')) err('notions.yml', `${nom} : « id » manquant (minuscules et tirets)`);
  for (const champ of ['titre', 'en_une_phrase', 'en_vente']) if (!texte(n?.[champ])) err('notions.yml', `${nom} : « ${champ} » manquant`);
  if (!listeTextes(n?.comment_ca_marche)) err('notions.yml', `${nom} : « comment_ca_marche » doit être une liste`);
  if (!listeTextes(n?.mots_cles)) err('notions.yml', `${nom} : « mots_cles » doit être une liste`);
  if (n?.categorie !== undefined && !CATEGORIES.includes(n.categorie)) err('notions.yml', `${nom} : « categorie » inconnue`);
  (n?.acteurs || []).forEach((a) => { if (!ids.has(a)) err('notions.yml', `${nom} : l’acteur « ${a} » n’a pas de fiche`); });
  if (n?.marche) {
    if (!texte(n.marche.chiffre) || !texte(n.marche.detail)) err('notions.yml', `${nom} : « marche » doit avoir « chiffre » et « detail »`);
    if (!n.marche.source || !texte(n.marche.source.titre) || !url(n.marche.source.url)) err('notions.yml', `${nom} : le marché doit avoir une source (titre et url)`);
  }
});

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) :\n`);
  erreurs.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}

// Ordre d'affichage : par catégorie, puis du plus gros au plus petit, puis par nom.
acteurs.sort((a, b) => CATEGORIES.indexOf(a.categorie) - CATEGORIES.indexOf(b.categorie) || b.mdUsd - a.mdUsd || a.nom.localeCompare(b.nom, 'fr'));

// Carte en nuage de points : chaque catégorie a un centre où s'affiche son nom. Les entreprises se placent
// autour du centre de leur catégorie ; celles qui ont aussi une autre activité (champ « aussi ») se placent
// entre les deux. Les catégories souvent liées sont voisines. Les plus grosses bulles sont placées en premier,
// au plus près de leur cible, sans chevaucher les autres bulles, les noms ni les titres des zones.
const CENTRES = {
  cloud: [215, 215], cyber: [590, 110], saas: [965, 215],
  puces: [205, 690], ia: [590, 540], data: [975, 600],
  ecommerce: [215, 1150], pub: [590, 1090], fintech: [965, 1120],
  crypto: [965, 1440],
  espace: [450, 1500]
};
const LIBELLES = { cloud: 'CLOUD & INFRA', ia: 'IA', puces: 'PUCES & MATÉRIEL', data: 'DATA', saas: 'LOGICIELS', cyber: 'CYBERSÉCURITÉ', pub: 'PUB & PLATEFORMES', ecommerce: 'E-COMMERCE', fintech: 'FINTECH & PAIEMENTS', crypto: 'CRYPTO & WEB3', espace: 'AÉROSPATIAL & DÉFENSE' };
const largeurNom = (nom) => nom.length * 6.8 + 8;
const obstacles = Object.entries(CENTRES).map(([id, [x, y]]) => {
  const w = LIBELLES[id].length * 13.5 + 16;
  return [x - w / 2, y - 18, x + w / 2, y + 18];
});
const dansBoite = (b, x, y, r) => Math.hypot(x - Math.min(Math.max(x, b[0]), b[2]), y - Math.min(Math.max(y, b[1]), b[3])) < r;
const boitesSeCroisent = (a, b, mx, my) => !(a[2] + mx <= b[0] || b[2] + mx <= a[0] || a[3] + my <= b[1] || b[3] + my <= a[1]);
const poses = [];
for (const a of [...acteurs].sort((p, q) => q.mdUsd - p.mdUsd || p.nom.localeCompare(q.nom, 'fr'))) {
  const r = rayon(a.mdUsd);
  const ln = largeurNom(a.nom);
  const cats = [a.categorie, a.categorie, ...a.aussi];
  const tx = cats.reduce((s, c) => s + CENTRES[c][0], 0) / cats.length;
  const ty = cats.reduce((s, c) => s + CENTRES[c][1], 0) / cats.length;
  let meilleur = null;
  for (let y = r + 8; y <= H - r - 26; y += 4) {
    for (let x = Math.max(r, ln / 2) + 8; x <= W - Math.max(r, ln / 2) - 8; x += 4) {
      const d = Math.hypot(x - tx, y - ty);
      if (meilleur && d >= meilleur.d) continue;
      const etiquette = [x - ln / 2, y + r + 2, x + ln / 2, y + r + 19];
      if (obstacles.some((o) => dansBoite(o, x, y, r + 12) || boitesSeCroisent(o, etiquette, 8, 6))) continue;
      const ok = poses.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + 22 && !dansBoite(etiquette, p.x, p.y, p.r + 8)
        && !dansBoite(p.etiquette, x, y, r + 8) && !boitesSeCroisent(etiquette, p.etiquette, 14, 6));
      if (ok) meilleur = { x, y, d, etiquette };
    }
  }
  if (!meilleur) { console.error(`\n  ✗ Plus de place sur la carte pour ${a.id} : agrandir H dans scripts/build.mjs.\n`); process.exit(1); }
  a.x = meilleur.x; a.y = meilleur.y;
  poses.push({ x: a.x, y: a.y, r, etiquette: meilleur.etiquette });
}
const zones = Object.entries(CENTRES).map(([id, [x, y]]) => ({ id, nom: LIBELLES[id], x, y }));

const sortie = join(root, 'site', 'data');
mkdirSync(sortie, { recursive: true });
const meta = { depot: process.env.GITHUB_REPOSITORY || '', genereLe: new Date().toISOString().slice(0, 10), carte: { w: W, h: H, zones } };
writeFileSync(join(sortie, 'acteurs.json'), JSON.stringify({ meta, acteurs, liens, notions }, null, 1));
console.log(`✓ ${acteurs.length} fiches, ${liens.length} liens et ${notions.length} notions → site/data/acteurs.json`);
