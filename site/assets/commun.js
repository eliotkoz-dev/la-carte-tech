// Éléments communs aux trois pages : mosaïque, libellés, chargement des données.
window.CarteTech = (function () {
  const CATEGORIES = {
    cloud: 'Cloud & infra',
    ia: 'IA',
    puces: 'Puces & matériel',
    data: 'Data',
    saas: 'Logiciels',
    cyber: 'Cybersécurité',
    pub: 'Pub & plateformes',
    ecommerce: 'E-commerce',
    fintech: 'Fintech & paiements',
    crypto: 'Crypto & web3',
    espace: 'Aérospatial & défense',
  };
  // Notion de la page « La tech en rapide » qui explique chaque catégorie.
  const NOTION_DE = {
    cloud: 'cloud',
    ia: 'ia',
    puces: 'puces',
    data: 'data',
    saas: 'logiciels',
    cyber: 'cyber',
    pub: 'pub',
    ecommerce: 'ecommerce',
    fintech: 'paiements',
    crypto: 'crypto',
    espace: 'espace',
  };
  const REGIONS = {
    'amerique-du-nord': { nom: 'Amérique du Nord', c: '#3A3AF4' },
    europe: { nom: 'Europe', c: '#FF4F8B' },
    asie: { nom: 'Asie', c: '#FFD800', bord: '#C9A400' },
  };
  const STAGES = {
    oui: 'Stage : oui',
    alternance: 'Alternance',
    'a-verifier': 'Stage : à vérifier',
  };
  const MOIS = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  // Rayon des bulles : grandit avec la racine carrée du chiffre d'affaires (en milliards de dollars).

  const el = (tag, cls, texte) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte !== undefined) e.textContent = texte;
    return e;
  };
  const dateFr = (iso) => {
    const [a, m, j] = iso.split('-').map(Number);
    return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`;
  };
  const charger = () =>
    fetch('data/acteurs.json', { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });

  // Mosaïque de carrés : clairsemée en haut, pleine en bas, sur toute la largeur.
  const couleurs = ['#FF4F8B', '#3A3AF4', '#7B5CFF', '#2929A0', '#3A3AF4', '#7B5CFF', '#3A3AF4'];
  document.querySelectorAll('.mosaique').forEach((m) => {
    const rangs = Number(m.dataset.rangs || 6);
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rangs; r++) {
      for (let c = 0; c < 48; c++) {
        let h = Math.imul(c + 1, 374761393) + Math.imul(r + 7, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h = (h ^ (h >>> 16)) >>> 0;
        const allume = (h % 1000) / 1000 < Math.pow((r + 1) / rangs, 1.6) * 0.95;
        const k = h % 7 === 0 && r < rangs / 2 ? 1 : h % 7;
        const s = document.createElement('span');
        if (allume) s.style.background = couleurs[k];
        // Délai d'apparition : le bas se remplit en premier, de gauche à droite.
        s.style.setProperty('--o', (rangs - 1 - r) * 90 + c * 7);
        frag.appendChild(s);
      }
    }
    m.appendChild(frag);
  });

  // Mouvement : seule la mosaïque de l'accueil est animée.
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduit) {
    // Mosaïque de l'accueil : au défilement, chaque colonne s'envole vers le haut à sa vitesse,
    // par pas d'une case (donc toujours alignée), et de nouveaux carrés montent depuis le bas.
    const mosaique = document.querySelector('.hero .mosaique');
    if (mosaique) {
      const hero = mosaique.closest('.hero');
      const COLS = 48;
      const vitesse = (c) => 0.2 + ((c * 37) % 10) * 0.07;
      mosaique.querySelectorAll('span').forEach((c, i) => {
        c.style.translate = `0 var(--y${i % COLS})`;
      });
      const envol = document.createElement('div');
      envol.className = 'envol';
      envol.setAttribute('aria-hidden', 'true');
      const volants = [];
      for (let i = 0; i < 26; i++) {
        const col = (i * 7 + 3) % COLS;
        const f = document.createElement('span');
        f.style.background = couleurs[(i * 5) % 7];
        f.style.setProperty('--c', col);
        volants.push({ f, col, depart: (i * 23) % 360 });
        envol.appendChild(f);
      }
      hero.appendChild(envol);
      let pas = 0;
      const mesurer = () => {
        const premier = mosaique.querySelector('span');
        pas = premier ? premier.offsetHeight + 3 : 0;
      };
      const maj = () => {
        const sy = Math.min(scrollY, hero.offsetHeight);
        const q = (px) => -Math.round(px / pas) * pas;
        for (let c = 0; c < COLS; c++) hero.style.setProperty(`--y${c}`, q(sy * vitesse(c)) + 'px');
        volants.forEach((v) => {
          v.f.style.translate = `0 ${q(Math.max(0, sy - v.depart) * vitesse(v.col))}px`;
        });
      };
      let occupe = false;
      addEventListener(
        'scroll',
        () => {
          if (occupe) return;
          occupe = true;
          requestAnimationFrame(() => {
            occupe = false;
            if (!pas) mesurer();
            if (pas) maj();
          });
        },
        { passive: true },
      );
      addEventListener('resize', () => {
        mesurer();
        if (pas) maj();
      });
    }
  }

  return { CATEGORIES, NOTION_DE, REGIONS, STAGES, el, dateFr, charger };
})();
