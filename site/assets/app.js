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

  const REGIONS_BUREAUX = [
    { id: 'europe', nom: 'Europe' }, { id: 'asie', nom: 'Asie' }, { id: 'amerique-du-nord', nom: 'Amérique du Nord' },
    { id: 'amerique-latine', nom: 'Amérique latine' }, { id: 'moyen-orient-afrique', nom: 'Moyen-Orient et Afrique' }, { id: 'oceanie', nom: 'Océanie' }
  ];
  const etat = { cat: 'tous', regionVille: 'europe', ville: null, stagesSeuls: false, choisi: null, types: { parente: true, investissement: true, partenariat: true } };
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

  // Carte déplaçable et zoomable : le cadre a une hauteur fixe, la carte (W × H) bouge dedans.
  const vue = { k: 1, x: 0, y: 0 };
  function initialiserZoom(carte, info) {
    const cadre = $('cadre-carte');
    const aide = $('aide-carte');
    let kMin = 0.3;
    const K_MAX = 2.5;
    const appliquer = () => {
      const cw = cadre.clientWidth, ch = cadre.clientHeight;
      vue.k = Math.min(Math.max(vue.k, kMin), K_MAX);
      const lw = W * vue.k, lh = H * vue.k;
      vue.x = lw <= cw ? (cw - lw) / 2 : Math.min(0, Math.max(cw - lw, vue.x));
      vue.y = lh <= ch ? (ch - lh) / 2 : Math.min(0, Math.max(ch - lh, vue.y));
      carte.style.transform = `translate(${vue.x}px, ${vue.y}px) scale(${vue.k})`;
    };
    const zoomer = (facteur, cx, cy) => {
      const avant = vue.k;
      vue.k = Math.min(Math.max(avant * facteur, kMin), K_MAX);
      const f = vue.k / avant;
      vue.x = cx - (cx - vue.x) * f;
      vue.y = cy - (cy - vue.y) * f;
      appliquer();
    };
    const calculer = () => { kMin = Math.min(cadre.clientWidth / W, cadre.clientHeight / H, 1); };
    const largeur = () => { vue.k = Math.min(cadre.clientWidth / W, 1); vue.x = 0; vue.y = 0; calculer(); appliquer(); };
    const centre = () => [cadre.clientWidth / 2, cadre.clientHeight / 2];
    const masquerAide = () => aide.classList.add('cachee');
    $('zoom-plus').addEventListener('click', () => { masquerAide(); zoomer(1.3, ...centre()); });
    $('zoom-moins').addEventListener('click', () => { masquerAide(); zoomer(1 / 1.3, ...centre()); });
    $('zoom-tout').addEventListener('click', () => { masquerAide(); vue.k = kMin; vue.x = 0; vue.y = 0; appliquer(); });
    cadre.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      masquerAide();
      const r = cadre.getBoundingClientRect();
      zoomer(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    // Glisser (souris ou doigt) et pincer (deux doigts).
    const pts = new Map();
    let depart = null, bouge = false, distance = 0;
    cadre.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.outils-carte')) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      depart = { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y };
      bouge = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; distance = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    });
    window.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const r = cadre.getBoundingClientRect();
        if (distance) zoomer(d / distance, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
        distance = d; bouge = true; masquerAide();
        return;
      }
      if (!depart) return;
      const dx = e.clientX - depart.x, dy = e.clientY - depart.y;
      if (!bouge && Math.hypot(dx, dy) < 6) return;
      bouge = true; masquerAide();
      cadre.classList.add('glisse');
      vue.x = depart.vx + dx; vue.y = depart.vy + dy;
      appliquer();
    });
    const fin = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      distance = 0;
      cadre.classList.remove('glisse');
      if (pts.size === 1) { const [p] = [...pts.values()]; depart = { x: p[0], y: p[1], vx: vue.x, vy: vue.y }; }
      if (pts.size === 0) depart = null;
    };
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
    // Après un glissé, on ne déclenche pas le clic sur l'entreprise survolée.
    cadre.addEventListener('click', (e) => { if (bouge) { e.stopPropagation(); e.preventDefault(); bouge = false; } }, true);
    window.addEventListener('resize', () => { calculer(); appliquer(); });
    largeur();
  }

  function construireCarte(zones) {
    const carte = $('carte');
    const info = $('infobulle');
    carte.style.width = W + 'px';
    carte.style.height = H + 'px';
    initialiserZoom(carte, info);
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
        info.style.transform = `scale(${1 / vue.k})`;
        info.style.transformOrigin = '0 0';
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
    const ligne = $('bureaux-choix');
    ligne.replaceChildren();
    const presentes = REGIONS_BUREAUX.filter((r) => a.bureaux && a.bureaux[r.id]);
    if (!presentes.length) ligne.append(el('b', '', 'Bureaux : '), 'pas encore renseignés');
    presentes.forEach((r, i) => {
      if (i) ligne.append(el('br'));
      ligne.append(el('b', '', r.nom + ' : '), parPays(a.bureaux[r.id].villes).map(([pays, villes]) => `${pays} (${villes.join(', ')})`).join(' · '));
    });
  }

  // Les communes de la banlieue parisienne comptent pour « Paris » dans le filtre par ville.
  const SEUIL_VILLE = 4;
  const ALIAS_VILLES = { 'Levallois-Perret': 'Paris', 'Issy-les-Moulineaux': 'Paris', 'La Défense': 'Paris', Courbevoie: 'Paris' };
  // Villes où l'entreprise a des locaux : bureaux en Europe (« Ville (Pays) ») et villes citées dans « rejoindre ».
  const villesDe = (a) => [...new Set([
    ...REGIONS_BUREAUX.flatMap((r) => ((a.bureaux && a.bureaux[r.id] && a.bureaux[r.id].villes) || []).map((v) => v.ville)),
    ...((a.rejoindre && a.rejoindre.bureaux) || []).map((b) => b.ville)
  ].map((v) => ALIAS_VILLES[v] || v))];
  const VOIES = { stage: 'Stage', alternance: 'Alternance', graduate: 'Graduate program', vie: 'VIE', 'premier-poste': 'Premier poste' };

  // Région de chaque ville, d'après les listes de bureaux (« Ville (Pays) » rangé dans la région où elle est listée).
  const regionDeVille = {};
  function construireVilles() {
    acteurs.forEach((a) => REGIONS_BUREAUX.forEach((r) => ((a.bureaux && a.bureaux[r.id] && a.bureaux[r.id].villes) || []).forEach((v) => { regionDeVille[ALIAS_VILLES[v.ville] || v.ville] = r.id; })));
    const compte = {};
    acteurs.forEach((a) => villesDe(a).forEach((v) => { compte[v] = (compte[v] || 0) + 1; }));
    const zone = $('villes');
    const nbParRegion = {};
    Object.keys(compte).forEach((v) => { if (regionDeVille[v]) nbParRegion[regionDeVille[v]] = (nbParRegion[regionDeVille[v]] || 0) + 1; });
    const regions = REGIONS_BUREAUX.filter((r) => acteurs.some((a) => a.bureaux && a.bureaux[r.id]));
    if (!regions.length) { zone.hidden = true; return; }
    if (!regions.some((r) => r.id === etat.regionVille)) etat.regionVille = regions[0].id;
    const onglets = zone.querySelector('.regions-villes');
    onglets.replaceChildren(...regions.map((r) => {
      const n = acteurs.filter((a) => a.bureaux && a.bureaux[r.id]).length;
      const b = el('button', 'pilule', r.nom + ' ');
      b.type = 'button';
      b.dataset.region = r.id;
      b.append(el('span', 'n', String(n)));
      b.addEventListener('click', () => { etat.regionVille = r.id; etat.ville = null; majVilles(compte); majListe(); });
      return b;
    }));
    majVilles(compte);
  }

  function majVilles(compte) {
    const zone = $('villes');
    zone.querySelectorAll('.regions-villes .pilule').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === etat.regionVille)));
    const villes = Object.entries(compte).filter(([v, n]) => regionDeVille[v] === etat.regionVille && n >= SEUIL_VILLE).sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0], 'fr'));
    const cible = zone.querySelector('.pilules-villes');
    if (!villes.length) { cible.replaceChildren(el('span', 'discret', 'Pas encore assez de bureaux renseignés dans cette région.')); return; }
    cible.replaceChildren(...villes.map(([v, n]) => {
      const b = el('button', 'pilule', v + ' ');
      b.type = 'button';
      b.dataset.ville = v;
      b.append(el('span', 'n', String(n)));
      b.addEventListener('click', () => { etat.ville = etat.ville === v ? null : v; majListe(); });
      return b;
    }));
    zone.querySelectorAll('.pilules-villes .pilule[data-ville]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ville === etat.ville)));
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
    document.querySelectorAll('#villes .pilules-villes .pilule[data-ville]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ville === etat.ville)));
    const visibles = acteurs.filter((a) => (etat.cat === 'tous' || a.categorie === etat.cat) && (!etat.stagesSeuls || a.stage !== 'a-verifier') && (!etat.ville || villesDe(a).includes(etat.ville)));
    visibles.sort((p, q) => p.nom.localeCompare(q.nom, 'fr', { sensitivity: 'base' }));
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
    const choisie = $('grille').querySelector('[aria-pressed="true"]');
    const liste = document.querySelector('.liste');
    if (choisie && liste.scrollHeight > liste.clientHeight) {
      const haut = choisie.offsetTop - liste.offsetTop;
      if (haut < liste.scrollTop || haut + choisie.offsetHeight > liste.scrollTop + liste.clientHeight) liste.scrollTop = Math.max(0, haut - 60);
    }
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

  function blocBureaux(b, titre) {
    const d = el('div', 'bloc-bureaux');
    const haut = el('div', 'vente-haut');
    haut.append(el('h3', '', titre), el('span', 'nb-bureaux', `${b.villes.length} ville${b.villes.length > 1 ? 's' : ''} · ${parPays(b.villes).length} pays`));
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
    REGIONS_BUREAUX.forEach((r) => {
      if (a.bureaux && a.bureaux[r.id]) corps.append(blocBureaux(a.bureaux[r.id], 'Bureaux en ' + r.nom));
      else if (r.id === 'europe') corps.append(bloc('Bureaux en Europe', el('p', 'discret', 'Pas encore renseigné.')));
    });
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
