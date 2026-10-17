// La Carte Tech · page « Les acteurs » : carte des liens, filtres et fiches.
// Les données viennent de data/acteurs.json, généré depuis fiches/*.yml par scripts/build.mjs.
(function () {
  const { CATEGORIES, NOTION_DE, REGIONS, STAGES, rayon, el, dateFr, charger } = window.CarteTech;
  let W = 1180;
  let H = 1020;
  // Les trois types de liens, par ordre d'importance.
  const TYPES = { parente: 'Parenté', investissement: 'Investissement', partenariat: 'Partenariat' };
  const ORDRE = ['parente', 'investissement', 'partenariat'];
  // Comment lire un lien depuis la fiche de chaque côté.
  const ROLE = {
    parente: { de: 'Possède', vers: 'Appartient à' },
    investissement: { de: 'A investi dans', vers: 'Financée par' },
    partenariat: { de: 'Partenaire de', vers: 'Partenaire de' }
  };

  const $ = (id) => document.getElementById(id);
  const eclaircir = (hex) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.42 + 255 * 0.58).toString(16).padStart(2, '0')).join('');

  const etat = { cat: 'tous', ville: null, stagesSeuls: false, choisi: null, types: { parente: true, investissement: true, partenariat: true } };
  let acteurs = [];
  let liens = [];
  let depot = '';
  const parId = {};
  const bulles = {};
  const noms = {};
  const traits = [];

  const lienGitHub = (chemin) => (depot ? `https://github.com/${depot}${chemin ? '/' + chemin : ''}` : '');
  const liensDe = (id) => liens.filter((l) => l.de === id || l.vers === id);
  const texteLiens = (id) => { const d = liensDe(id).length; return d === 0 ? 'aucun lien représenté' : `${d} lien${d > 1 ? 's' : ''} représenté${d > 1 ? 's' : ''}`; };
  const relies = (a, b) => liens.some((l) => (l.de === a && l.vers === b) || (l.de === b && l.vers === a));

  function construireCarte(zones) {
    const carte = $('carte');
    const info = $('infobulle');
    carte.style.width = W + 'px';
    carte.style.height = H + 'px';
    // Une zone par catégorie : le nom de la catégorie en gros, au centre de la zone.
    zones.forEach((z) => {
      const titre = el('span', 'titre-zone', z.nom);
      titre.style.cssText = `left:${z.x}px;top:${z.y}px`;
      titre.setAttribute('aria-hidden', 'true');
      carte.insertBefore(titre, info);
    });
    [...liens].sort((p, q) => ORDRE.indexOf(q.type) - ORDRE.indexOf(p.type)).forEach((l) => {
      const a = parId[l.de];
      const b = parId[l.vers];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const long = Math.hypot(dx, dy);
      const ra = rayon(a.mdUsd) + 2;
      const rb = rayon(b.mdUsd) + 3;
      const t = el('span', 'lien ' + l.type);
      t.style.left = (a.x + dx / long * ra).toFixed(1) + 'px';
      t.style.top = (a.y + dy / long * ra).toFixed(1) + 'px';
      t.style.width = Math.max(0, long - ra - rb).toFixed(1) + 'px';
      t.style.transform = `rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2)}deg)`;
      t.setAttribute('aria-hidden', 'true');
      if (l.type !== 'partenariat') t.append(el('span', 'pointe'));
      carte.insertBefore(t, info);
      traits.push({ l, t });
    });
    acteurs.forEach((a) => {
      const r = rayon(a.mdUsd);
      const couleur = REGIONS[a.region].c;
      // Pas de contour blanc : le contour prend la couleur de la bulle (sauf l’Asie, bordée d’or pour rester visible).
      const bord = REGIONS[a.region].bord || couleur;
      const b = el('button', 'bulle' + (a.mdUsd > 0 ? '' : ' vide'));
      b.type = 'button';
      b.style.cssText = `left:${a.x - r}px;top:${a.y - r}px;width:${2 * r}px;height:${2 * r}px;--c:${couleur};--c-clair:${eclaircir(couleur)};--b:${bord};--b-clair:${eclaircir(bord)}`;
      b.setAttribute('aria-label', `${a.nom}, ${CATEGORIES[a.categorie]}, ${REGIONS[a.region].nom}, chiffre d’affaires : ${a.ca}`);
      b.addEventListener('click', () => choisir(a.id));
      const montrer = () => {
        info.replaceChildren(el('p', 't', a.nom), el('p', '', `${CATEGORIES[a.categorie]} · ${REGIONS[a.region].nom}`), el('p', 'ca', a.ca), el('p', 'l', texteLiens(a.id)));
        info.style.left = Math.min(Math.max(a.x + r + 10, 8), W - 260) + 'px';
        info.style.top = Math.min(Math.max(a.y - 40, 8), H - 140) + 'px';
        info.hidden = false;
      };
      const cacher = () => { info.hidden = true; };
      b.addEventListener('mouseenter', montrer);
      b.addEventListener('focus', montrer);
      b.addEventListener('mouseleave', cacher);
      b.addEventListener('blur', cacher);
      const n = el('span', 'nom-bulle', a.nom);
      n.style.left = a.x - 80 + 'px';
      n.style.top = a.y + r + 3 + 'px';
      n.setAttribute('aria-hidden', 'true');
      carte.insertBefore(b, info);
      carte.insertBefore(n, info);
      bulles[a.id] = b;
      noms[a.id] = n;
    });
    const zone = $('liste-liens');
    ORDRE.forEach((type, i) => {
      const du = liens.filter((l) => l.type === type);
      if (!du.length) return;
      zone.append(el('h4', '', `${i + 1} · ${TYPES[type]} (${du.length})`));
      const ul = el('ul');
      du.forEach((l) => {
        const li = el('li', '', `${l.texte}. `);
        if (l.source) { const a = el('a', '', 'source'); a.href = l.source; li.append(a); }
        ul.append(li);
      });
      zone.append(ul);
    });
    document.querySelectorAll('[data-type-lien]').forEach((b) => {
      const type = b.dataset.typeLien;
      b.querySelector('.nb').textContent = liens.filter((l) => l.type === type).length;
      b.addEventListener('click', () => {
        etat.types[type] = !etat.types[type];
        b.setAttribute('aria-pressed', String(etat.types[type]));
        $('carte').classList.toggle('sans-' + type, !etat.types[type]);
      });
    });
  }

  function majCarte() {
    const id = etat.choisi;
    acteurs.forEach((a) => {
      const choisi = a.id === id;
      const estompe = !choisi && !relies(a.id, id);
      bulles[a.id].classList.toggle('choisie', choisi);
      bulles[a.id].classList.toggle('estompee', estompe);
      bulles[a.id].setAttribute('aria-pressed', String(choisi));
      noms[a.id].classList.toggle('choisi', choisi);
      noms[a.id].classList.toggle('estompe', estompe);
    });
    traits.forEach(({ l, t }) => t.classList.toggle('actif', l.de === id || l.vers === id));
    const a = parId[id];
    $('resume-choix').replaceChildren(el('b', '', a.nom), ' ', el('span', '', `· ${CATEGORIES[a.categorie]} · ${REGIONS[a.region].nom} · ${a.ca} · ${texteLiens(a.id)}`));
    const be = a.bureauxEurope;
    $('bureaux-choix').replaceChildren(el('b', '', 'Bureaux en Europe : '), be ? parPays(be.villes).map(([pays, villes]) => `${pays} (${villes.join(', ')})`).join(' · ') : 'pas encore renseigné');
  }

  // Les communes de la banlieue parisienne comptent pour « Paris » dans le filtre par ville.
  const ALIAS_VILLES = { 'Levallois-Perret': 'Paris', 'Issy-les-Moulineaux': 'Paris', 'La Défense': 'Paris', Courbevoie: 'Paris' };
  const villesDe = (a) => [...new Set(((a.rejoindre && a.rejoindre.bureaux) || []).map((b) => ALIAS_VILLES[b.ville] || b.ville))];
  const VOIES = { stage: 'Stage', alternance: 'Alternance', graduate: 'Graduate program', vie: 'VIE', 'premier-poste': 'Premier poste' };

  function construireVilles() {
    const compte = {};
    acteurs.forEach((a) => villesDe(a).forEach((v) => { compte[v] = (compte[v] || 0) + 1; }));
    const villes = Object.entries(compte).filter(([, n]) => n >= 2).sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0], 'fr'));
    const zone = $('villes');
    if (!villes.length) { zone.hidden = true; return; }
    zone.querySelector('.pilules-villes').replaceChildren(...villes.map(([v, n]) => {
      const b = el('button', 'pilule', v + ' ');
      b.type = 'button';
      b.dataset.ville = v;
      b.append(el('span', 'n', String(n)));
      b.addEventListener('click', () => { etat.ville = etat.ville === v ? null : v; majListe(); });
      return b;
    }));
  }

  function construirePilules() {
    const zone = $('pilules');
    [['tous', 'Tous']].concat(Object.entries(CATEGORIES)).forEach(([cle, nom]) => {
      const n = cle === 'tous' ? acteurs.length : acteurs.filter((a) => a.categorie === cle).length;
      if (!n) return;
      const b = el('button', 'pilule', nom + ' ');
      b.type = 'button';
      b.dataset.cat = cle;
      b.append(el('span', 'n', String(n)));
      b.addEventListener('click', () => { etat.cat = cle; majListe(); });
      zone.append(b);
    });
    $('filtre-stages').addEventListener('click', () => { etat.stagesSeuls = !etat.stagesSeuls; majListe(); });
  }

  function majListe() {
    document.querySelectorAll('#pilules .pilule').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === etat.cat)));
    $('filtre-stages').setAttribute('aria-pressed', String(etat.stagesSeuls));
    document.querySelectorAll('#villes .pilule').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ville === etat.ville)));
    const visibles = acteurs.filter((a) => (etat.cat === 'tous' || a.categorie === etat.cat) && (!etat.stagesSeuls || a.stage !== 'a-verifier') && (!etat.ville || villesDe(a).includes(etat.ville)));
    $('grille').replaceChildren(...visibles.map((a) => {
      const b = el('button', 'carte-ent');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(a.id === etat.choisi));
      const haut = el('span', 'haut');
      const num = el('span', 'num');
      const point = el('span', 'point');
      point.style.background = REGIONS[a.region].c;
      num.append(point, String(acteurs.indexOf(a) + 1).padStart(2, '0'));
      haut.append(num, el('span', 'etiquette', CATEGORIES[a.categorie]));
      b.append(haut, el('span', 'nom', a.nom), el('span', 'bref', a.enBref), el('span', 'ca-carte', a.ca), el('span', 'badge ' + a.stage, STAGES[a.stage]));
      b.addEventListener('click', () => { choisir(a.id); if (window.innerWidth < 960) $('fiche').scrollIntoView(); });
      return b;
    }));
    $('compte').textContent = `${visibles.length} entreprise${visibles.length > 1 ? 's' : ''} · cliquez pour ouvrir la fiche`;
    $('vide').hidden = visibles.length > 0;
  }

  const liste = (items) => { const ul = el('ul'); items.forEach((t) => ul.append(el('li', '', t))); return ul; };
  const bloc = (titre, ...enfants) => { const d = el('div', 'bloc'); d.append(el('h3', '', titre), ...enfants); return d; };

  function blocRejoindre(r) {
    const d = el('div', 'bloc-rejoindre');
    d.append(el('h3', '', 'Rejoindre l’entreprise'));
    if (r.bureaux.length) {
      const ul = el('ul', 'bureaux');
      r.bureaux.forEach((b) => { const li = el('li'); li.append(el('b', '', b.ville)); if (b.detail) li.append(el('span', 'discret', ` · ${b.detail}`)); ul.append(li); });
      d.append(el('p', 'sous-etiquette', 'Où'), ul);
    }
    const voies = el('ul', 'voies');
    r.voies.forEach((v) => { const li = el('li'); li.append(el('span', 'voie ' + v.type, VOIES[v.type]), ' ', el('b', '', v.nom), el('span', 'detail-voie', v.detail)); voies.append(li); });
    d.append(el('p', 'sous-etiquette', 'Comment entrer'), voies);
    if (r.calendrier) d.append(el('p', 'sous-etiquette', 'Quand'), el('p', '', r.calendrier));
    if (r.langues) d.append(el('p', 'sous-etiquette', 'Langues'), el('p', '', r.langues));
    if (r.aVerifier) d.append(el('p', 'a-verifier-rej', 'À vérifier : ' + r.aVerifier));
    const src = el('p', 'discret');
    src.append('Sources : ');
    r.sources.forEach((s, i) => { if (i) src.append(' · '); const l = el('a', '', s.titre); l.href = s.url; l.rel = 'noopener'; src.append(l); });
    d.append(src);
    return d;
  }

  const APPROCHES = { 'libre-service': 'Libre-service', 'vente-directe': 'Vente directe', mixte: 'Libre-service + commerciaux', partenaires: 'Via des partenaires' };
  const AIDE_APPROCHE = {
    'libre-service': 'le client s’inscrit et paie en ligne, sans commercial',
    'vente-directe': 'des commerciaux trouvent et signent chaque client',
    mixte: 'les petits clients achètent en ligne, les grands passent par des commerciaux',
    partenaires: 'surtout vendu par des revendeurs, intégrateurs ou distributeurs'
  };

  const parPays = (villes) => {
    const pays = {};
    villes.forEach((v) => { (pays[v.pays] = pays[v.pays] || []).push(v.ville); });
    return Object.entries(pays);
  };

  function blocBureaux(b) {
    const d = el('div', 'bloc-bureaux');
    const haut = el('div', 'vente-haut');
    haut.append(el('h3', '', 'Bureaux en Europe'), el('span', 'nb-bureaux', `${b.villes.length} ville${b.villes.length > 1 ? 's' : ''} · ${parPays(b.villes).length} pays`));
    d.append(haut);
    const ul = el('ul', 'pays-bureaux');
    parPays(b.villes).forEach(([pays, villes]) => { const li = el('li'); li.append(el('b', '', pays), ' ', el('span', '', villes.join(', '))); ul.append(li); });
    d.append(ul);
    if (b.note) d.append(el('p', 'discret', b.note));
    const src = el('p', 'discret');
    src.append('Sources : ');
    b.sources.forEach((s, i) => { if (i) src.append(' · '); const l = el('a', '', s.titre); l.href = s.url; l.rel = 'noopener'; src.append(l); });
    d.append(src);
    return d;
  }

  function blocVente(v) {
    const d = el('div', 'bloc-vente');
    const haut = el('div', 'vente-haut');
    haut.append(el('h3', '', 'Comment elle vend'), el('span', 'approche ' + v.approche, APPROCHES[v.approche]));
    d.append(haut, el('p', 'aide-approche', AIDE_APPROCHE[v.approche]), el('p', '', v.resume));
    d.append(el('p', 'sous-etiquette', 'Qui achète'), el('p', '', v.acheteurs));
    if (v.argument) d.append(el('p', 'sous-etiquette', 'Ce qu’elle met en avant'), el('p', '', v.argument));
    d.append(el('p', 'sous-etiquette', 'Objections fréquentes'), liste(v.objections));
    if (v.sources.length) {
      const src = el('p', 'discret');
      src.append('Sources : ');
      v.sources.forEach((s, i) => { if (i) src.append(' · '); const l = el('a', '', s.titre); l.href = s.url; l.rel = 'noopener'; src.append(l); });
      d.append(src);
    }
    return d;
  }

  function majFiche() {
    const a = parId[etat.choisi];
    const entete = el('div', 'fiche-entete mono');
    const lienYml = el('a', '', `fiches/${a.id}.yml`);
    lienYml.href = lienGitHub(`blob/main/fiches/${a.id}.yml`) || '#fiche';
    const lienCat = el('a', '', CATEGORIES[a.categorie]);
    lienCat.href = 'tech.html#' + NOTION_DE[a.categorie];
    lienCat.title = 'Comprendre ce secteur';
    entete.append(lienYml, lienCat);

    const corps = el('div', 'fiche-corps');
    const titre = el('div', 'bloc');
    titre.append(el('h2', '', a.nom), el('p', 'discret', `${a.groupe} · ${a.siege}`));
    const ca = el('div', 'bloc-ca');
    ca.append(el('p', 'etiquette-ca', 'Chiffre d’affaires'), el('p', 'valeur-ca', a.ca));
    if (a.cles.length) ca.append(liste(a.cles));
    corps.append(titre, ca);
    corps.append(bloc('Ce qu’elle vend', el('p', '', a.vend)));
    const prods = el('ul', 'produits');
    a.produits.forEach((p) => { const li = el('li'); li.append(el('b', '', p.nom), ` · ${p.detail}`); prods.append(li); });
    corps.append(bloc('Produits phares', prods));
    corps.append(bloc('Comment elle gagne de l’argent', el('p', '', a.modele), el('p', 'discret', `Clients : ${a.clients}`)));
    if (a.vente) corps.append(blocVente(a.vente));
    corps.append(a.bureauxEurope ? blocBureaux(a.bureauxEurope) : bloc('Bureaux en Europe', el('p', 'discret', 'Pas encore renseigné.')));
    corps.append(bloc('Rachats marquants', liste(a.rachats)));
    if (a.note) corps.append(el('p', 'note', a.note));
    corps.append(bloc('Concurrents', el('p', '', a.concurrents)));
    const ses = liensDe(a.id).sort((p, q) => ORDRE.indexOf(p.type) - ORDRE.indexOf(q.type) || (p.de === a.id ? 0 : 1) - (q.de === a.id ? 0 : 1));
    if (ses.length) {
      const ul = el('ul', 'ses-liens');
      ses.forEach((l) => {
        const sens = l.de === a.id ? 'de' : 'vers';
        const autre = parId[sens === 'de' ? l.vers : l.de];
        const li = el('li');
        const b = el('button', 'lien-texte', autre.nom);
        b.type = 'button';
        b.addEventListener('click', () => choisir(autre.id));
        li.append(el('span', 'type-lien ' + l.type, ROLE[l.type][sens]), ' ', b, el('span', 'discret', ` · ${l.texte}`));
        ul.append(li);
      });
      corps.append(bloc('Ses liens sur la carte', ul));
    }
    const r = a.rejoindre;
    const stage = el('div', 'bloc-stage');
    stage.append(el('h3', '', 'Stages'), el('span', 'badge badge-sombre ' + a.stage, STAGES[a.stage]), el('p', '', a.stageDetail));
    corps.append(stage);
    if (r) corps.append(blocRejoindre(r));
    const ul = el('ul');
    a.sources.forEach((s) => { const li = el('li'); const l = el('a', '', s.titre); l.href = s.url; l.rel = 'noopener'; li.append(l); ul.append(li); });
    corps.append(bloc('Sources', ul));
    const pied = el('p', 'pied-fiche', `Vérifiée le ${dateFr(a.verifieLe)} · une erreur ? `);
    const modif = el('a', '', 'Modifier cette fiche');
    modif.href = lienGitHub(`edit/main/fiches/${a.id}.yml`) || '#contribuer';
    pied.append(modif);
    corps.append(pied);
    $('fiche').replaceChildren(entete, corps);
    $('fiche').scrollTop = 0;
  }

  function choisir(id, depuisAdresse) {
    if (!parId[id]) return;
    etat.choisi = id;
    majCarte();
    majListe();
    majFiche();
    if (!depuisAdresse) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* adresse non modifiable : sans effet */ } }
  }

  const lireAdresse = () => { const m = location.hash.match(/^#(?:fiche=)?([a-z0-9-]+)$/); return m && parId[m[1]] ? m[1] : null; };

  charger()
    .then((d) => {
      acteurs = d.acteurs;
      liens = d.liens;
      depot = d.meta.depot;
      acteurs.forEach((a) => { parId[a.id] = a; });
      $('nb-acteurs').textContent = acteurs.length;
      $('nb-liens').textContent = liens.length;
      if (d.meta.genereLe) $('date-maj').textContent = dateFr(d.meta.genereLe);
      document.querySelectorAll('[data-gh]').forEach((a) => { const u = lienGitHub(a.dataset.gh); if (u) a.href = u; });
      if (d.meta.carte) { W = d.meta.carte.w; H = d.meta.carte.h; }
      construireCarte((d.meta.carte && d.meta.carte.zones) || []);
      construirePilules();
      construireVilles();
      const depuisAdresse = lireAdresse();
      choisir(depuisAdresse || (parId.aws ? 'aws' : acteurs[0].id), true);
      if (depuisAdresse) $('fiche').scrollIntoView();
      window.addEventListener('hashchange', () => { const id = lireAdresse(); if (id && id !== etat.choisi) { choisir(id, true); $('fiche').scrollIntoView(); } });
      $('voir-fiche').addEventListener('click', () => { $('fiche').scrollIntoView(); $('fiche').focus({ preventScroll: true }); });
    })
    .catch(() => {
      $('compte').textContent = 'Les données n’ont pas pu être chargées. Lancez « npm run build » puis rechargez la page.';
    });
})();
