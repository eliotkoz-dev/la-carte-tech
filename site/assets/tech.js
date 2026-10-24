// La Carte Tech · page « La tech en rapide » : notions qui s'ouvrent, avec marché et plus gros acteurs.
(function () {
  const { REGIONS, el, charger } = window.CarteTech;
  const $ = (id) => document.getElementById(id);
  let notions = [];
  let acteurs = [];

  const plusGros = (n) => {
    if (Array.isArray(n.acteurs))
      return n.acteurs.map((id) => acteurs.find((a) => a.id === id)).filter(Boolean);
    return acteurs
      .filter((a) => a.categorie === n.categorie)
      .sort((a, b) => b.mdUsd - a.mdUsd)
      .slice(0, 6);
  };

  function detail(n) {
    const d = el('div', 'notion-detail');
    d.id = 'd-' + n.id;
    const g = el('div', 'notion-col');
    g.append(el('h3', '', 'Comment ça marche'));
    const ol = el('ol');
    n.comment_ca_marche.forEach((t) => ol.append(el('li', '', t)));
    g.append(ol, el('h3', '', 'Les mots à connaître'));
    const mots = el('div', 'mots');
    n.mots_cles.forEach((m) => mots.append(el('span', '', m)));
    const vente = el('div', 'en-vente');
    vente.append(el('p', 't', n.etiquette_vente || 'En vente'), el('p', '', n.en_vente));
    g.append(mots, vente);

    const dr = el('div', 'notion-col');
    if (n.marche) dr.append(el('h3', '', 'Le marché'));
    if (n.marche) {
      const m = el('div', 'marche');
      const src = el('a', '', n.marche.source.titre);
      src.href = n.marche.source.url;
      src.rel = 'noopener';
      const p = el('p', 'source', 'Source : ');
      p.append(src);
      m.append(el('p', 'chiffre-marche', n.marche.chiffre), el('p', '', n.marche.detail), p);
      dr.append(m);
    } else if (!n.sources) {
      dr.append(el('h3', '', 'Le marché'));
      dr.append(
        el(
          'p',
          'a-completer',
          'Chiffre du marché à ajouter : proposez une source publique sur GitHub.',
        ),
      );
    }
    if (n.erreurs) {
      dr.append(el('h3', '', 'Les erreurs à éviter'));
      const ul = el('ul', 'erreurs');
      n.erreurs.forEach((e) => ul.append(el('li', '', e)));
      dr.append(ul);
    }
    if (!n.marche && n.sources) {
      dr.append(el('h3', '', 'Sources'));
      const ul = el('ul', 'sources');
      n.sources.forEach((src) => {
        const li = el('li');
        const a = el('a', '', src.titre);
        a.href = src.url;
        a.rel = 'noopener';
        li.append(a);
        ul.append(li);
      });
      dr.append(ul);
    }
    if (n.barres) {
      const parts = el('div', 'parts');
      parts.append(el('p', 'titre-barres', n.barres.titre));
      const max = Math.max(...n.barres.items.map((i) => i.valeur));
      n.barres.items.forEach((i, k) => {
        const ligne = el('div', 'part');
        const barre = el('span', 'barre');
        const b = el('span');
        b.style.width = Math.round((i.valeur / max) * 66) + '%';
        b.style.background = ['var(--bleu)', 'var(--violet)', 'var(--rose)'][k % 3];
        barre.append(b, i.texte);
        ligne.append(el('span', 'qui', i.nom), barre);
        parts.append(ligne);
      });
      dr.append(parts);
    }
    const gros = plusGros(n);
    if (gros.length) {
      dr.append(
        el(
          'h3',
          '',
          Array.isArray(n.acteurs) ? 'Des acteurs à connaître' : 'Les plus gros acteurs',
        ),
      );
      const ul = el('ul', 'gros');
      gros.forEach((a) => {
        const li = el('li');
        const l = el('a', '', a.nom);
        l.href = 'index.html#' + a.id;
        const point = el('span', 'point');
        point.style.background = REGIONS[a.region].c;
        li.append(point, l, el('span', 'ca-gros', a.ca));
        ul.append(li);
      });
      dr.append(ul);
    }
    d.append(g, dr);
    return d;
  }

  function construire() {
    const zone = $('notions');
    notions.forEach((n, i) => {
      const art = el('article', 'notion');
      art.id = 'n-' + n.id;
      const tete = el('button', 'notion-tete');
      tete.type = 'button';
      tete.setAttribute('aria-expanded', 'false');
      tete.setAttribute('aria-controls', 'd-' + n.id);
      const titres = el('span', 'titres');
      const actions = el('span', 'actions');
      if (n.marche) actions.append(el('span', 'puce-marche', `Marché : ${n.marche.chiffre}`));
      actions.append(el('span', 'ouvrir', 'Ouvrir'));
      titres.append(el('span', 't', n.titre), el('span', 'phrase', n.en_une_phrase), actions);
      tete.append(el('span', 'num', String(i + 1).padStart(2, '0')), titres);
      tete.addEventListener('click', () => basculer(n.id));
      const d = detail(n);
      d.hidden = true;
      art.append(tete, d);
      zone.append(art);
    });
    // Les tuiles sont écrites dans la page par le build : on branche seulement les clics.
    document.querySelectorAll('#tuiles .tuile').forEach((t) =>
      t.addEventListener('click', () => {
        ouvrir(t.dataset.notion);
        $('n-' + t.dataset.notion).scrollIntoView();
      }),
    );
  }

  function ouvrir(id, sansAdresse) {
    notions.forEach((n) => {
      const art = $('n-' + n.id);
      const ouverte = n.id === id;
      art.classList.toggle('ouverte', ouverte);
      art.querySelector('.notion-tete').setAttribute('aria-expanded', String(ouverte));
      art.querySelector('.ouvrir').textContent = ouverte ? 'Fermer' : 'Ouvrir';
      art.querySelector('.notion-detail').hidden = !ouverte;
    });
    if (!sansAdresse) {
      try {
        history.replaceState(null, '', id ? '#' + id : location.pathname);
      } catch (e) {
        /* sans effet */
      }
    }
  }
  const basculer = (id) => {
    const deja = $('n-' + id).classList.contains('ouverte');
    ouvrir(deja ? null : id);
  };

  charger()
    .then((d) => {
      notions = d.notions;
      acteurs = d.acteurs;
      construire();
      const id = location.hash.slice(1);
      if (notions.some((n) => n.id === id)) {
        ouvrir(id, true);
        $('n-' + id).scrollIntoView();
      }
      window.addEventListener('hashchange', () => {
        const h = location.hash.slice(1);
        if (notions.some((n) => n.id === h)) {
          ouvrir(h, true);
          $('n-' + h).scrollIntoView();
        }
      });
    })
    .catch(() => {
      $('notions').textContent =
        'Les données n’ont pas pu être chargées. Lancez « npm run build » puis rechargez la page.';
    });
})();
