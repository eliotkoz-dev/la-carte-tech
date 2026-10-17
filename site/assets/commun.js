// Éléments communs aux trois pages : mosaïque, libellés, chargement des données.
window.CarteTech = (function () {
  const CATEGORIES = {
    cloud: 'Cloud & infra', ia: 'IA', puces: 'Puces & matériel', data: 'Data', saas: 'Logiciels',
    cyber: 'Cybersécurité', pub: 'Pub & plateformes', ecommerce: 'E-commerce', fintech: 'Fintech & paiements'
  };
  // Notion de la page « La tech en rapide » qui explique chaque catégorie.
  const NOTION_DE = { cloud: 'cloud', ia: 'ia', puces: 'puces', data: 'data', saas: 'logiciels', cyber: 'cyber', pub: 'pub', ecommerce: 'ecommerce', fintech: 'paiements' };
  const REGIONS = { 'amerique-du-nord': { nom: 'Amérique du Nord', c: '#3A3AF4' }, europe: { nom: 'Europe', c: '#FF4F8B' }, asie: { nom: 'Asie', c: '#FFD800', bord: '#C9A400' } };
  const STAGES = { oui: 'Stage : oui', alternance: 'Alternance', 'a-verifier': 'Stage : à vérifier' };
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  // Rayon des bulles : grandit avec la racine carrée du chiffre d'affaires (en milliards de dollars).
  const rayon = (md) => (md > 0 ? 8 + 2 * Math.sqrt(md) : 9);

  const el = (tag, cls, texte) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte !== undefined) e.textContent = texte;
    return e;
  };
  const dateFr = (iso) => { const [a, m, j] = iso.split('-').map(Number); return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`; };
  const charger = () => fetch('data/acteurs.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

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
        frag.appendChild(s);
      }
    }
    m.appendChild(frag);
  });

  return { CATEGORIES, NOTION_DE, REGIONS, STAGES, rayon, el, dateFr, charger };
})();
