/**
 * Construit la bibliothèque de prévisualisation pour Claude Design.
 *
 *   node design/build.mjs
 *
 * Les composants de l'application sont en React Native : ils ne s'affichent
 * qu'à travers react-native-web, dans un bundle de deux mégaoctets. Les
 * prévisualisations sont donc réécrites en HTML — mais leurs **valeurs** sont
 * lues dans src/theme.js, de sorte qu'une couleur, un espacement ou un rayon
 * ne peuvent pas diverger entre l'application et le volet Design. Seul le
 * balisage est une implémentation parallèle.
 *
 * Chaque page s'ouvre sur un marqueur `@dsCard` : c'est lui qui la range dans
 * une section du volet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const SORTIE = path.join(ICI, 'build');

// ── Lecture des tokens ────────────────────────────────────────────────────

/**
 * Extrait un objet littéral de theme.js.
 *
 * Volontairement rustique : le fichier est en ESM avec des commentaires, et
 * ajouter une chaîne de compilation pour six objets serait disproportionné.
 * Une évaluation dans un contexte vide suffit, et casse bruyamment si la
 * forme du fichier change.
 */
function lireTokens() {
  const src = fs.readFileSync(path.join(RACINE, 'src/theme.js'), 'utf8');

  const objet = (nom) => {
    const debut = src.indexOf(`export const ${nom} = {`);
    if (debut < 0) throw new Error(`${nom} introuvable dans theme.js`);
    let i = src.indexOf('{', debut);
    let profondeur = 0;
    for (let j = i; j < src.length; j += 1) {
      if (src[j] === '{') profondeur += 1;
      if (src[j] === '}') {
        profondeur -= 1;
        if (profondeur === 0) {
          // eslint-disable-next-line no-new-func
          return new Function(`return ${src.slice(i, j + 1)}`)();
        }
      }
    }
    throw new Error(`accolade non fermée pour ${nom}`);
  };

  const clair = objet('lightColors');
  // darkColors reprend lightColors par diffusion : on rejoue la fusion.
  const sombreBrut = src.slice(src.indexOf('export const darkColors'));
  const sombre = { ...clair, ...new Function(`const lightColors = ${JSON.stringify(clair)}; return ${sombreBrut.slice(sombreBrut.indexOf('{'), sombreBrut.indexOf('\n};') + 2)}`)() };

  return {
    clair,
    sombre,
    typography: objet('typography'),
    spacing: objet('spacing'),
    radii: objet('radii'),
    sizes: objet('sizes'),
  };
}

const T = lireTokens();

/** Monogramme : mêmes tracés que l'application et les icônes. */
function lireMonogramme() {
  const src = fs.readFileSync(path.join(RACINE, 'src/lib/monogramme.js'), 'utf8');
  const c = (nom) => src.match(new RegExp(`export const ${nom} =\\s*'([^']*)'`))[1];
  return { T: c('MONOGRAMME_T'), S: c('MONOGRAMME_S') };
}
const MONO = lireMonogramme();

// ── Contraste, pour annoter la palette ────────────────────────────────────

function luminance(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a, b) {
  const [h, l] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((h + 0.05) / (l + 0.05)).toFixed(2);
}

// ── Gabarit ───────────────────────────────────────────────────────────────

/** Variables CSS issues des tokens : la seule source de vérité. */
function variablesCss() {
  const ligne = (prefixe, obj, unite = '') =>
    Object.entries(obj)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => `    --${prefixe}-${k}: ${v}${typeof v === 'number' ? unite : ''};`)
      .join('\n');

  return `:root {
${ligne('c', T.clair)}
${ligne('sp', T.spacing, 'px')}
${ligne('r', T.radii, 'px')}
  }
  [data-theme='sombre'] {
${ligne('c', T.sombre)}
  }`;
}

const BASE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px;
    background: var(--c-cream);
    color: var(--c-dark);
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; letter-spacing: .01em; }
  .intro { font-size: 12px; color: var(--c-warmGray); margin: 0 0 22px; max-width: 62ch; line-height: 1.5; }
  h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
       color: var(--c-warmGray); margin: 26px 0 10px; }
  .rangee { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .colonne { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  .note { font-size: 11px; color: var(--c-warmGray); margin-top: 8px; line-height: 1.5; }
  .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  .cadre { border: 1px solid var(--c-border); border-radius: var(--r-xl); padding: 20px;
           background: var(--c-cream); }
  .etiquette { font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
               color: var(--c-warmGray); margin-bottom: 10px; }

  /* ── Composants, repris des sources de l'application ── */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-sm);
         border: 1px solid transparent; border-radius: var(--r-lg); font-weight: 600;
         cursor: default; white-space: nowrap; }
  .btn--md { padding: 10px 20px; font-size: 14px; }
  .btn--sm { padding: 6px 14px; font-size: 12px; }
  .btn--lg { padding: 14px 28px; font-size: 15px; }
  .btn--primary { background: var(--c-primary); color: var(--c-onPrimary); border-color: var(--c-primary); }
  .btn--secondary { background: var(--c-secondaryLight); color: var(--c-secondary); border-color: var(--c-secondary); }
  .btn--accent { background: var(--c-accent); color: #FFFFFF; border-color: var(--c-accent); }
  .btn--ghost { background: transparent; color: var(--c-warmGray); border-color: var(--c-border); }
  .btn--gold { background: var(--c-goldLight); color: var(--c-goldText); border-color: var(--c-gold); }
  .btn[aria-disabled='true'] { opacity: .5; }
  .btn--full { display: flex; width: 100%; }

  .badge { display: inline-flex; align-items: center; gap: 4px; border-radius: var(--r-sm);
           padding: 4px 8px; font-size: 12px; font-weight: 600; }
  .badge--sm { padding: 2px 6px; font-size: 10px; }

  .chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--c-border);
          background: var(--c-surface); color: var(--c-dark); border-radius: var(--r-pill);
          padding: 7px 13px; font-size: 13px; font-weight: 600; }
  .chip--actif { background: var(--c-primary); color: var(--c-onPrimary); border-color: var(--c-primary); }

  .carte { border-radius: var(--r-xl);
           background: var(--c-surface); padding: var(--sp-lg);
           box-shadow: 0 3px 10px rgba(45,43,43,0.16); }
  .carte--plate { padding: 0; box-shadow: none; }
  .separateur { height: 1px; background: var(--c-border); }

  .champ { border: 1px solid var(--c-border); border-radius: var(--r-lg);
           background: var(--c-surface); padding: 12px 14px; font-size: 15px;
           color: var(--c-dark); width: 100%; display: flex; align-items: center; gap: 10px; }
  .champ--focus { border-color: var(--c-primaryInk); }
  .champ--erreur { border-color: var(--c-accent); }
  .champ__label { font-size: 12px; font-weight: 600; color: var(--c-warmGray); margin-bottom: 6px; }
  .champ__aide { font-size: 11px; color: var(--c-warmGray); margin-top: 6px; }
  .champ__erreur { font-size: 11px; color: var(--c-accent); margin-top: 6px; }
  .fantome { color: var(--c-warmGray); opacity: .55; }

  svg.i { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 2;
          stroke-linecap: round; stroke-linejoin: round; flex: none; }

  .point-pin { width: 16px; height: 16px; border-radius: var(--r-pill); border: 1.5px solid var(--c-border); }
  .point-pin--rempli { background: var(--c-primaryInk); border-color: var(--c-primaryInk); }
  .point-pin--erreur { background: var(--c-accent); border-color: var(--c-accent); }
  .touche-pin { width: 74px; height: 52px; border-radius: var(--r-lg); border: 1px solid var(--c-border);
                background: var(--c-surface); display: flex; align-items: center; justify-content: center;
                font-size: 20px; font-weight: 600; color: var(--c-dark); }
  .touche-pin--vide { border: none; background: transparent; }

  .jour { flex: 1; aspect-ratio: 1; border-radius: var(--r-md); display: flex; align-items: center;
          justify-content: center; flex-direction: column; gap: 2px; font-size: 13px; color: var(--c-dark);
          border: 1px solid transparent; background: var(--c-surface); }
  .jour--hors-mois { opacity: .25; }
  .jour--selectionne { background: var(--c-primary); color: var(--c-onPrimary); font-weight: 600; border-color: var(--c-primary); }
  .jour--reservee { background: var(--c-successBg); color: var(--c-primaryInk); }
  .jour--attente { background: var(--c-warningBg); color: var(--c-goldText); }
  .jour--bloquee { background: var(--c-surfaceElevated); color: var(--c-warmGray); border-color: var(--c-border); }
  .jour--passee { background: transparent; color: var(--c-warmGray); opacity: .4; }
  .puce-jour { width: 4px; height: 4px; border-radius: 2px; background: var(--c-secondary); }

  .ligne-salle { display: flex; border-radius: var(--r-xl);
                 overflow: hidden; background: var(--c-surface); }
  .ligne-salle__photo { width: 140px; height: 140px; flex: none; display: flex; align-items: center;
                         justify-content: center; }

  .selecteur-salle { display: inline-flex; align-items: center; gap: var(--sp-sm); background: var(--c-surface);
                      border: 1px solid var(--c-border); border-radius: var(--r-lg); padding: 10px 14px; width: 260px; }
  .selecteur-salle--ouvert { border-color: var(--c-primaryInk); }
  .selecteur-salle__liste { width: 260px; border: 1px solid var(--c-border); border-radius: var(--r-lg);
                             background: var(--c-surface); overflow: hidden; margin-top: 6px; }
  .selecteur-salle__item { display: flex; align-items: center; gap: var(--sp-sm); padding: 11px 14px; }
  .selecteur-salle__item--actif { background: var(--c-primaryLight); }
`;

/**
 * Jeu d'icônes minimal.
 *
 * L'application utilise Ionicons, une fonte de 390 Ko : l'embarquer dans
 * chaque page serait disproportionné. Ces tracés en reprennent le style —
 * contour, extrémités arrondies — sans en être la copie exacte. C'est une
 * représentation, suffisante pour juger la mise en forme.
 */
const ICONES = {
  check: '<polyline points="4,12 9,17 20,6"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  download: '<path d="M12 3v12"/><polyline points="7,11 12,16 17,11"/><line x1="4" y1="20" x2="20" y2="20"/>',
  star: '<polygon points="12,3 15,9.5 22,10.3 17,15 18.2,22 12,18.7 5.8,22 7,15 2,10.3 9,9.5"/>',
  tag: '<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><line x1="12" y1="9" x2="12" y2="21"/><path d="M3 13h18"/><path d="M12 9a3 3 0 1 1 3-3 6 6 0 0 1-3 3Zm0 0a3 3 0 1 0-3-3 6 6 0 0 0 3 3Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  chevron: '<polyline points="9,5 16,12 9,19"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  alert: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="13"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17.5 18Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21"/>',
  heart: '<path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 11c-2.5 4.65-9.5 9-9.5 9Z"/>',
  backspace: '<path d="M8 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-6-6a1 1 0 0 1 0-2Z"/><line x1="12" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="12" y2="15"/>',
  business: '<rect x="5" y="3" width="9" height="18" rx="1"/><rect x="14" y="9" width="5" height="12" rx="1"/><circle cx="8" cy="7" r=".7" fill="currentColor"/><circle cx="11" cy="7" r=".7" fill="currentColor"/><circle cx="8" cy="11" r=".7" fill="currentColor"/><circle cx="11" cy="11" r=".7" fill="currentColor"/><circle cx="8" cy="15" r=".7" fill="currentColor"/><circle cx="11" cy="15" r=".7" fill="currentColor"/>',
};

const ic = (nom, taille = '1em') =>
  `<svg class="i" viewBox="0 0 24 24" style="width:${taille};height:${taille}">${ICONES[nom]}</svg>`;

/** Cœur, plein ou creux — seule icône dont la variante active se remplit. */
const icCoeur = (plein, taille = '1em', couleur = 'currentColor') =>
  `<svg viewBox="0 0 24 24" style="width:${taille};height:${taille};flex:none" fill="${plein ? couleur : 'none'}" stroke="${couleur}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES.heart}</svg>`;

/** Une page de prévisualisation, autonome. */
function page({ chemin, groupe, nom, titre, intro, corps, largeur = 720, hauteur }) {
  const html = `<!-- @dsCard group="${groupe}" name="${nom}"${hauteur ? ` height="${hauteur}"` : ''} width="${largeur}" -->
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre} — Tasalle</title>
<style>
${variablesCss()}
${BASE}
</style>
</head>
<body>
<h1>${titre}</h1>
<p class="intro">${intro}</p>
${corps}
</body>
</html>
`;
  const complet = path.join(SORTIE, chemin);
  fs.mkdirSync(path.dirname(complet), { recursive: true });
  fs.writeFileSync(complet, html);
  return chemin;
}

// ── Pages ─────────────────────────────────────────────────────────────────

fs.rmSync(SORTIE, { recursive: true, force: true });
const pages = [];

// 1. Couleurs
{
  const familles = {
    'Primaires — le rouge de marque en aplat': ['primary', 'primaryLight', 'primaryDark', 'onPrimary', 'primaryInk'],
    'Rouge de la marque (jetons « gold », historiques)': ['gold', 'goldMark', 'goldText', 'goldLight'],
    'Secondaires et accents': ['secondary', 'secondaryLight', 'accent', 'accentLight', 'info'],
    Neutres: ['dark', 'warmGray', 'border', 'cream', 'surface', 'surfaceElevated'],
  };

  const pastille = (nom, valeur, fond) => {
    const ratio = /^#/.test(valeur) ? contraste(valeur, fond) : null;
    return `<div style="width:150px">
      <div style="height:52px;border-radius:var(--r-lg);border:1px solid var(--c-border);background:${valeur}"></div>
      <div style="font-size:11px;font-weight:600;margin-top:6px">${nom}</div>
      <div style="font-size:10px;color:var(--c-warmGray);font-variant-numeric:tabular-nums">${valeur}</div>
      ${ratio ? `<div style="font-size:10px;color:var(--c-warmGray)">${ratio}:1 sur le fond</div>` : ''}
    </div>`;
  };

  const bloc = (jeu, fond) =>
    Object.entries(familles)
      .map(
        ([titre, cles]) => `<h2>${titre}</h2><div class="rangee">
        ${cles.filter((k) => jeu[k]).map((k) => pastille(k, jeu[k], fond)).join('')}
      </div>`
      )
      .join('');

  pages.push(
    page({
      chemin: 'fondations/couleurs.html',
      groupe: 'Fondations',
      nom: 'Couleurs',
      titre: 'Couleurs',
      largeur: 780,
      intro:
        "La palette est mono-teinte, celle du système Modernist : un rouge de marque unique sur des neutres chauds. Ce rouge (<code>gold</code> — les jetons gardent leurs noms hérités d'une palette dorée antérieure, mais portent aujourd'hui du rouge) ne fait que 3,76:1 en aplat portant du texte de fond — il décore, il n'écrit pas de texte de corps. D'où des jetons distincts : <b>primary</b> remplit les aplats, <b>primaryInk</b> écrit, <b>gold</b> décore, <b>goldMark</b> dessine les objets porteurs d'information. Les rapports affichés sont calculés selon WCAG 2.1 contre le fond de la page.",
      corps: `${bloc(T.clair, T.clair.cream)}
        <h2>Thème sombre</h2>
        <div class="cadre" data-theme="sombre" style="background:${T.sombre.cream};color:${T.sombre.dark}">
          <div class="etiquette">Les rôles s'inversent : l'aplat devient un rouge clair, le texte qui s'y inscrit devient sombre</div>
          <div class="rangee">
            ${['primary', 'onPrimary', 'primaryInk', 'goldMark', 'surface', 'border']
              .map((k) => pastille(k, T.sombre[k], T.sombre.cream))
              .join('')}
          </div>
        </div>
        <p class="note">Un test fige ces frontières dans les deux sens : <code>logoInk</code> doit rester sous le seuil des composants, <code>goldText</code> au-dessus de celui du texte. Promouvoir le rouge de marque en couleur de texte fait échouer la suite.</p>`,
    })
  );
}

// 2. Typographie
{
  const echelle = Object.entries(T.typography)
    .map(
      ([nom, v]) => `<div style="display:flex;align-items:baseline;gap:20px;padding:10px 0;border-bottom:1px solid var(--c-border)">
        <div style="width:96px;font-size:11px;color:var(--c-warmGray)">${nom}</div>
        <div style="width:130px;font-size:10px;color:var(--c-warmGray);font-variant-numeric:tabular-nums">${v.fontSize}px · ${v.fontWeight} · ${v.lineHeight}px</div>
        <div style="font-size:${v.fontSize}px;font-weight:${v.fontWeight};line-height:${v.lineHeight}px">Salle El Widad</div>
      </div>`
    )
    .join('');

  pages.push(
    page({
      chemin: 'fondations/typographie.html',
      groupe: 'Fondations',
      nom: 'Typographie',
      titre: 'Typographie',
      largeur: 720,
      intro:
        "Archivo (Google Fonts), embarquée — une seule famille pour toute l'app, y compris le mot-symbole de la marque. Trois graisses réellement utilisées : 400, 600 et 800, jamais de poids intermédiaire improvisé.",
      corps: echelle,
    })
  );
}

// 3. Espacements et rayons
{
  const barre = (nom, v) => `<div style="display:flex;align-items:center;gap:14px;padding:5px 0">
      <div style="width:44px;font-size:11px;color:var(--c-warmGray)">${nom}</div>
      <div style="width:44px;font-size:10px;color:var(--c-warmGray);font-variant-numeric:tabular-nums">${v}px</div>
      <div style="height:14px;width:${v * 4}px;background:var(--c-primaryLight);border:1px solid var(--c-goldMark);border-radius:2px"></div>
    </div>`;

  const rayon = (nom, v) => `<div style="text-align:center">
      <div style="width:74px;height:56px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:${v}px"></div>
      <div style="font-size:11px;margin-top:6px">${nom}</div>
      <div style="font-size:10px;color:var(--c-warmGray)">${v}px</div>
    </div>`;

  pages.push(
    page({
      chemin: 'fondations/espacements.html',
      groupe: 'Fondations',
      nom: 'Espacements et rayons',
      titre: 'Espacements et rayons',
      largeur: 720,
      intro:
        'Une seule échelle d\'espacement, de 4 à 32 pixels, et sept rayons. Toute valeur de mise en page de l\'application vient de ces deux tables.',
      corps: `<h2>Espacements</h2>
        ${Object.entries(T.spacing).map(([k, v]) => barre(k, v)).join('')}
        <h2>Rayons</h2>
        <div class="rangee" style="gap:18px">${Object.entries(T.radii)
          .filter(([k]) => k !== 'pill')
          .map(([k, v]) => rayon(k, v))
          .join('')}${rayon('pill', 999)}</div>`,
    })
  );
}

// 4. Marque
{
  const monogramme = (taille, couleur) => `<svg width="${taille}" height="${taille}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="47.2" stroke="${couleur}" stroke-width="1.6" fill="none"/>
      <path d="${MONO.T}" fill="${couleur}"/><path d="${MONO.S}" fill="${couleur}"/>
    </svg>`;

  const verrou = (fond, encre, or) => `<div class="cadre" style="background:${fond};color:${encre};text-align:center">
      <div style="display:inline-flex;flex-direction:column;align-items:center;gap:12px">
        ${monogramme(76, or)}
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:26px;letter-spacing:8px;margin-left:8px">TASALLE</div>
          <div style="width:84px;height:1px;background:${or};opacity:.7"></div>
          <div style="font-size:14px;letter-spacing:7px;margin-left:7px;color:${or}">ALGÉRIE</div>
        </div>
      </div>
    </div>`;

  pages.push(
    page({
      chemin: 'fondations/marque.html',
      groupe: 'Fondations',
      nom: 'Marque',
      titre: 'Marque',
      largeur: 780,
      intro:
        "Le T et le S se chevauchent : le S descend sous la ligne du T et mord sur son pied. Les lettres sont des contours, pas du texte — une marque ne peut pas dépendre des polices installées. Ces tracés sont ceux de l'application, des documents PDF et des icônes des stores.",
      corps: `<div class="duo">
          ${verrou(T.clair.cream, T.clair.logoWordmark, T.clair.logoInk)}
          ${verrou(T.sombre.cream, T.sombre.logoWordmark, T.sombre.logoInk)}
        </div>
        <h2>Tailles</h2>
        <div class="rangee" style="gap:22px">
          ${[112, 64, 40, 28, 20].map((s) => monogramme(s, T.clair.logoInk)).join('')}
        </div>
        <p class="note">Lisible jusqu'à 20 pixels. En dessous, le filet circulaire se referme visuellement : préférer le mot-symbole seul.</p>`,
    })
  );
}

// 5. Boutons
{
  const variantes = ['primary', 'secondary', 'accent', 'ghost', 'gold'];
  const btn = (v, t = 'md', extra = '', label = 'Réserver') =>
    `<span class="btn btn--${t} btn--${v}" ${extra}>${label}</span>`;

  pages.push(
    page({
      chemin: 'composants/boutons.html',
      groupe: 'Composants',
      nom: 'Boutons',
      titre: 'Boutons',
      largeur: 760,
      intro:
        "Cinq variantes, trois tailles. En thème clair l'aplat primaire est le rouge de marque et porte le fond clair à 3,76:1 (sous le seuil texte, au-dessus du seuil composant — un bouton n'est pas du texte de paragraphe) ; en thème sombre les rôles s'inversent, un rouge clair remplit et le texte sombre s'y inscrit — d'où le jeton <b>onPrimary</b>, sans lequel le libellé serait resté blanc en dur (illisible sur le rouge clair, 1,52:1).",
      corps: `<h2>Variantes</h2>
        <div class="rangee">${variantes.map((v) => btn(v)).join('')}</div>
        <h2>Tailles</h2>
        <div class="rangee">${['sm', 'md', 'lg'].map((t) => btn('primary', t)).join('')}</div>
        <h2>Avec icône</h2>
        <div class="rangee">
          <span class="btn btn--md btn--primary">${ic('check')} Confirmer</span>
          <span class="btn btn--md btn--ghost">${ic('download')} PDF</span>
          <span class="btn btn--md btn--gold">${ic('gift')} Parrainer</span>
        </div>
        <h2>États</h2>
        <div class="rangee">
          ${btn('primary', 'md', '', 'Normal')}
          ${btn('primary', 'md', "aria-disabled='true'", 'Désactivé')}
          ${btn('accent', 'md', '', 'Refuser')}
        </div>
        <h2>Pleine largeur</h2>
        <div style="max-width:420px">${btn('primary', 'lg', "class='btn btn--lg btn--primary btn--full'", 'Envoyer ma demande')}</div>
        <div class="duo" style="margin-top:26px">
          <div class="cadre"><div class="etiquette">Clair</div><div class="rangee">${variantes.map((v) => btn(v, 'sm')).join('')}</div></div>
          <div class="cadre" data-theme="sombre" style="background:${T.sombre.cream}"><div class="etiquette">Sombre</div><div class="rangee">${variantes.map((v) => btn(v, 'sm')).join('')}</div></div>
        </div>`,
    })
  );
}

// 6. Champs
{
  const champ = ({ label, valeur, etat = '', aide, erreur, icone, suffixe, fantome }) => `
    <div style="max-width:340px">
      <div class="champ__label">${label}</div>
      <div class="champ ${etat}">
        ${icone ? ic(icone) : ''}
        <span style="flex:1" class="${fantome ? 'fantome' : ''}">${valeur}</span>
        ${suffixe ? `<span style="color:var(--c-warmGray);font-size:13px">${suffixe}</span>` : ''}
      </div>
      ${aide ? `<div class="champ__aide">${aide}</div>` : ''}
      ${erreur ? `<div class="champ__erreur">${erreur}</div>` : ''}
    </div>`;

  pages.push(
    page({
      chemin: 'composants/champs.html',
      groupe: 'Composants',
      nom: 'Champs de saisie',
      titre: 'Champs de saisie',
      largeur: 760,
      intro:
        "Le contour se teinte du rouge de marque à la saisie, du rouge d'erreur au refus — deux rouges distincts, jamais le même jeton. Les champs numériques — téléphone, montants, codes — sont forcés en lecture gauche-à-droite, quel que soit le reste.",
      corps: `<div class="duo">
        <div class="colonne">
          ${champ({ label: 'Nom complet', valeur: 'Amina Cherif', icone: 'person' })}
          ${champ({ label: 'Vide', valeur: 'Comment vous appelez-vous ?', fantome: true })}
          ${champ({ label: 'Actif', valeur: '0661 23 45 67', etat: 'champ--focus' })}
        </div>
        <div class="colonne">
          ${champ({ label: 'Avec aide', valeur: '150', suffixe: 'invités', aide: 'Capacité : 450' })}
          ${champ({ label: 'En erreur', valeur: '0512', etat: 'champ--erreur', erreur: 'Numéro algérien attendu (05, 06 ou 07).' })}
          ${champ({ label: 'Code promo', valeur: 'RENTREE10', icone: 'tag' })}
        </div>
      </div>
      <p class="note">Le composant transmet <code>onBlur</code> et <code>autoCorrect</code> : sans le second, le clavier d'un téléphone « corrigerait » un code promo en mot.</p>`,
    })
  );
}

// 7. Badges et puces
{
  const tons = {
    success: [T.clair.successBg, T.clair.primaryInk, 'Confirmée'],
    warning: [T.clair.warningBg, T.clair.goldText, 'En attente'],
    danger: [T.clair.dangerBg, T.clair.accent, 'Annulée'],
    info: [T.clair.infoBg, T.clair.info, 'Terminée'],
    gold: [T.clair.goldLight, T.clair.goldText, 'Premium'],
    neutral: [T.clair.surfaceElevated, T.clair.warmGray, 'Neutre'],
  };
  const badge = (ton, petit) => {
    const [bg, fg, txt] = tons[ton];
    return `<span class="badge ${petit ? 'badge--sm' : ''}" style="background:${bg};color:${fg}">${txt}</span>`;
  };

  pages.push(
    page({
      chemin: 'composants/badges-puces.html',
      groupe: 'Composants',
      nom: 'Badges et puces',
      titre: 'Badges et puces',
      largeur: 720,
      intro:
        "Le badge porte un état, la puce un filtre qu'on active. Les six tons couvrent les statuts de réservation et la mise en avant premium.",
      corps: `<h2>Badges</h2>
        <div class="rangee">${Object.keys(tons).map((t) => badge(t)).join('')}</div>
        <h2>Petits</h2>
        <div class="rangee">${Object.keys(tons).map((t) => badge(t, true)).join('')}</div>
        <h2>Puces de filtre</h2>
        <div class="rangee">
          <span class="chip chip--actif">Toutes</span>
          <span class="chip">En attente</span>
          <span class="chip">Confirmées</span>
          <span class="chip">Annulées</span>
        </div>
        <h2>Avec icône</h2>
        <div class="rangee">
          <span class="chip chip--actif">${ic('check')} Climatisation</span>
          <span class="chip">${ic('star')} Terrasse</span>
          <span class="chip">${ic('calendar')} Traiteur</span>
        </div>`,
    })
  );
}

// 8. Cartes et listes
{
  pages.push(
    page({
      chemin: 'composants/cartes.html',
      groupe: 'Composants',
      nom: 'Cartes et listes',
      titre: 'Cartes et listes',
      largeur: 760,
      intro:
        "Les cartes n'ont pas de contour dans Modernist : c'est une nuance de gris à peine plus soutenue que le fond de page, plus une ombre teintée d'encre (pas de noir pur), qui les détache.",
      corps: `<div class="duo">
        <div>
          <div class="etiquette">Carte simple</div>
          <div class="carte">
            <div style="font-weight:600;margin-bottom:4px">Salle El Widad</div>
            <div style="font-size:13px;color:var(--c-warmGray)">Alger · 450 places · 127 avis</div>
          </div>
        </div>
        <div>
          <div class="etiquette">Titre de section</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-weight:600">Prochaines réservations</div>
            <div style="font-size:13px;color:var(--c-primaryInk)">Tout voir</div>
          </div>
          <div class="carte carte--plate">
            ${['Période', 'Statut', 'Montant']
              .map(
                (k, i) => `${i ? '<div class="separateur"></div>' : ''}
              <div style="display:flex;justify-content:space-between;padding:12px 16px;font-size:14px">
                <span style="color:var(--c-warmGray)">${k}</span>
                <span style="${i === 2 ? 'color:var(--c-primaryInk);font-weight:600' : ''}">${['Septembre 2026', 'Payée', '500 DA'][i]}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>`,
    })
  );
}

// 9. États d'écran
{
  pages.push(
    page({
      chemin: 'composants/etats.html',
      groupe: 'Composants',
      nom: 'États d’écran',
      titre: 'États d’écran',
      largeur: 780,
      intro:
        "Chargement, vide, erreur, hors ligne. Le bandeau hors ligne porte la date de la copie affichée : sans elle, un propriétaire ne saurait pas de quand datent les informations qu'il lit.",
      corps: `<div class="duo">
        <div class="cadre" style="text-align:center;padding:34px">
          <div style="width:22px;height:22px;border:2px solid var(--c-border);border-top-color:var(--c-primaryInk);border-radius:50%;margin:0 auto"></div>
          <div style="font-size:12px;color:var(--c-warmGray);margin-top:12px">Chargement…</div>
        </div>
        <div class="cadre" style="text-align:center;padding:30px">
          <div style="width:56px;height:56px;border-radius:var(--r-xxl);background:var(--c-primaryLight);display:flex;align-items:center;justify-content:center;margin:0 auto;color:var(--c-primaryInk)">${ic('calendar', '22px')}</div>
          <div style="font-weight:600;margin-top:14px">Aucune réservation</div>
          <div style="font-size:12px;color:var(--c-warmGray);margin-top:4px">Vos demandes apparaîtront ici.</div>
        </div>
      </div>
      <div class="duo" style="margin-top:20px">
        <div class="cadre" style="text-align:center;padding:30px">
          <div style="color:var(--c-accent)">${ic('alert', '26px')}</div>
          <div style="font-size:13px;margin-top:12px">Une erreur est survenue</div>
          <div style="margin-top:14px"><span class="btn btn--sm btn--ghost">Réessayer</span></div>
        </div>
        <div>
          <div class="etiquette">Bandeau hors ligne</div>
          <div style="display:flex;align-items:center;gap:10px;background:var(--c-warningBg);color:var(--c-goldText);border-radius:var(--r-lg);padding:12px 14px;font-size:12px">
            ${ic('cloud')} Hors ligne — données du 5 août
          </div>
        </div>
      </div>`,
    })
  );
}

// 10. Progression
{
  const barre = (pct, couleur) => `<div style="height:10px;border-radius:var(--r-pill);background:var(--c-border);overflow:hidden;max-width:300px">
      <div style="height:100%;width:${pct}%;background:${couleur};border-radius:var(--r-pill)"></div>
    </div>`;

  const etape = (n, etat) => {
    const rempli = etat !== 'a-venir';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
      <div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;
        background:${rempli ? 'var(--c-primary)' : 'var(--c-surface)'};color:${rempli ? 'var(--c-onPrimary)' : 'var(--c-warmGray)'};
        border:1px solid ${rempli ? 'var(--c-primary)' : 'var(--c-border)'}">${etat === 'fait' ? '✓' : n}</div>
      <div style="font-size:11px;color:${etat === 'actif' ? 'var(--c-primaryInk)' : 'var(--c-warmGray)'};font-weight:${etat === 'actif' ? 600 : 400}">${['Date', 'Formule', 'Infos', 'Envoi'][n - 1]}</div>
    </div>`;
  };

  pages.push(
    page({
      chemin: 'composants/progression.html',
      groupe: 'Composants',
      nom: 'Progression',
      titre: 'Progression',
      largeur: 720,
      intro:
        "Barre de progression et fil d'étapes. La barre rouge sert au décompte de l'essai gratuit ; son libellé est toujours affiché, car la teinte seule ne suffirait pas à donner la valeur.",
      corps: `<h2>Barres</h2>
        <div class="colonne">
          ${barre(50, 'var(--c-primaryInk)')}
          ${barre(72, 'var(--c-goldMark)')}
          ${barre(18, 'var(--c-secondary)')}
        </div>
        <h2>Fil d’étapes</h2>
        <div style="display:flex;max-width:420px">${etape(1, 'fait')}${etape(2, 'fait')}${etape(3, 'actif')}${etape(4, 'a-venir')}</div>`,
    })
  );
}

// 11. Notation
{
  const etoiles = (n, taille = 20) =>
    [1, 2, 3, 4, 5]
      .map(
        (i) => `<span style="color:${i <= n ? 'var(--c-goldMark)' : 'var(--c-border)'};font-size:${taille}px">★</span>`
      )
      .join('');

  pages.push(
    page({
      chemin: 'composants/notation.html',
      groupe: 'Composants',
      nom: 'Notation',
      titre: 'Notation',
      largeur: 700,
      intro:
        "Les étoiles utilisent <b>goldMark</b>, pas <b>gold</b> : à 3,47:1 ce dernier reste sous le seuil de 3:1... de justesse, alors que <b>goldMark</b> tient 3,91:1, la marge que WCAG demande à un objet graphique porteur d'information. La forme distingue aussi le plein du vide, la couleur n'étant jamais seule à porter le sens.",
      corps: `<h2>Affichage</h2>
        <div class="colonne">
          <div class="rangee">${etoiles(5)}<span style="font-size:12px;color:var(--c-warmGray)">5,0 (127)</span></div>
          <div class="rangee">${etoiles(4)}<span style="font-size:12px;color:var(--c-warmGray)">4,5 (84)</span></div>
          <div class="rangee">${etoiles(3, 14)}<span style="font-size:11px;color:var(--c-warmGray)">3,2 (12)</span></div>
        </div>
        <h2>Répartition</h2>
        <div style="max-width:340px">
          ${[5, 4, 3, 2, 1]
            .map((n) => {
              const pct = [78, 15, 5, 2, 0][5 - n];
              return `<div style="display:flex;align-items:center;gap:10px;margin:5px 0">
                <span style="font-size:11px;color:var(--c-warmGray);width:10px">${n}</span>
                <div style="flex:1;height:6px;background:var(--c-border);border-radius:var(--r-pill);overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:var(--c-goldMark)"></div>
                </div>
                <span style="font-size:11px;color:var(--c-warmGray);width:26px;text-align:right">${pct}%</span>
              </div>`;
            })
            .join('')}
        </div>`,
    })
  );
}

// 12. Carte de salle
{
  pages.push(
    page({
      chemin: 'metier/carte-salle.html',
      groupe: 'Métier',
      nom: 'Carte de salle',
      titre: 'Carte de salle',
      largeur: 760,
      intro:
        "L'unité de la recherche et de l'accueil. Sans photo, un dégradé déterministe portant l'initiale : la carte garde sa forme, et deux salles différentes n'ont jamais le même fond.",
      corps: `<div class="rangee" style="align-items:flex-start;gap:18px">
        ${[
          ['Palais Ryad', 'Oran · 700 places · 203 avis', '55 000 DA', '4.9', ['#8B6914', '#BE9A5E'], 'P', true],
          ['Le Corail', 'Annaba · 280 places · 152 avis', '48 000 DA', '4.8', ['#C8956C', '#E0B48F'], 'L', true],
          ['Salle Ennour', 'Constantine · 250 places · 41 avis', '28 000 DA', '4.3', ['#6B5B4A', '#A89684'], 'E', false],
        ]
          .map(
            ([nom, meta, prix, note, [d1, d2], initiale, premium]) => `
          <div style="width:224px;border-radius:var(--r-xl);overflow:hidden;background:var(--c-surface)">
            <div style="height:130px;background:linear-gradient(135deg,${d1},${d2});position:relative;display:flex;align-items:center;justify-content:center">
              <span style="font-size:44px;color:rgba(255,255,255,.35);font-weight:800">${initiale}</span>
              <span class="badge badge--sm" style="position:absolute;top:9px;left:9px;background:var(--c-surface);color:var(--c-dark)">★ ${note}</span>
            </div>
            <div style="padding:12px">
              <div style="font-weight:600;font-size:15px">${nom}</div>
              <div style="font-size:12px;color:var(--c-warmGray);margin-top:2px">${meta}</div>
              <div style="font-size:14px;color:var(--c-primaryInk);font-weight:600;margin-top:8px">À partir de ${prix}</div>
              <div class="rangee" style="gap:6px;margin-top:8px">
                <span class="badge badge--sm" style="background:var(--c-successBg);color:var(--c-primaryInk)">Disponible</span>
                ${premium ? `<span class="badge badge--sm" style="background:var(--c-goldLight);color:var(--c-goldText)">Premium</span>` : ''}
              </div>
            </div>
          </div>`
          )
          .join('')}
      </div>`,
    })
  );
}

// 13. Carte de réservation
{
  const resa = (nom, type, statut, ton, actions) => `
    <div class="carte" style="max-width:380px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:var(--r-lg);background:var(--c-goldLight);display:flex;align-items:center;justify-content:center;font-size:19px">💍</div>
        <div style="flex:1">
          <div style="font-weight:600">${nom}</div>
          <div style="font-size:12px;color:var(--c-warmGray)">${type}</div>
        </div>
        <span class="badge badge--sm" style="background:${ton[0]};color:${ton[1]}">${statut}</span>
      </div>
      <div class="separateur" style="margin:12px 0"></div>
      <div style="display:flex;gap:16px;font-size:12px;color:var(--c-warmGray)">
        <span>${ic('calendar')} 26 Août 2026</span><span>${ic('tag')} 74 900 DA</span>
      </div>
      ${actions ? `<div class="rangee" style="margin-top:12px">${actions}</div>` : ''}
    </div>`;

  pages.push(
    page({
      chemin: 'metier/carte-reservation.html',
      groupe: 'Métier',
      nom: 'Carte de réservation',
      titre: 'Carte de réservation',
      largeur: 800,
      intro:
        "Côté propriétaire, la carte porte ses propres actions : la liste ne se déplie pas, on décide depuis la ligne. Le statut est nommé en toutes lettres, jamais réduit à une pastille de couleur.",
      corps: `<div class="duo">
        ${resa('Yacine Haddad', 'Fiançailles · 180 invités', 'En attente', [T.clair.warningBg, T.clair.goldText], `<span class="btn btn--sm btn--primary">${ic('check')} Confirmer</span><span class="btn btn--sm btn--accent">Refuser</span><span class="btn btn--sm btn--ghost">Appeler</span>`)}
        ${resa('Amina Cherif', 'Mariage · 320 invités', 'Confirmée', [T.clair.successBg, T.clair.primaryInk], `<span class="btn btn--sm btn--ghost">Appeler</span><span class="btn btn--sm btn--ghost">Message</span>`)}
      </div>`,
    })
  );
}

// 14. Indicateurs
{
  const kpi = (label, valeur, delta, ton) => `
    <div class="carte" style="width:200px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;color:var(--c-warmGray)">${label}</span>
        <span style="width:26px;height:26px;border-radius:var(--r-md);background:${ton[1]};color:${ton[0]};display:flex;align-items:center;justify-content:center">${ic('star', '13px')}</span>
      </div>
      <div style="font-size:25px;font-weight:800;margin-top:8px">${valeur}</div>
      ${delta ? `<div style="font-size:11px;color:${delta.startsWith('−') ? 'var(--c-accent)' : 'var(--c-primaryInk)'};margin-top:2px">${delta}</div>` : ''}
    </div>`;

  pages.push(
    page({
      chemin: 'metier/indicateurs.html',
      groupe: 'Métier',
      nom: 'Indicateurs',
      titre: 'Indicateurs et graphiques',
      largeur: 800,
      intro:
        "Les séries sont mono-teinte et libellées. La palette de marque ne peut pas servir de palette catégorielle : ses teintes chaudes sont séparées de moins de ΔE 15, indistinguables même en vision normale. L'identité est donc portée par le texte.",
      corps: `<h2>Indicateurs</h2>
        <div class="rangee" style="gap:14px;align-items:stretch">
          ${kpi('Réservations ce mois', '12', '+3', [T.clair.primaryInk, T.clair.primaryLight])}
          ${kpi('Revenus estimés', '410K DA', '−17%', [T.clair.primaryInk, T.clair.primaryLight])}
          ${kpi('Avis clients', '4.8/5', null, [T.clair.goldText, T.clair.goldLight])}
        </div>
        <h2>Revenus des 6 derniers mois</h2>
        <div class="carte" style="max-width:460px">
          <div style="display:flex;align-items:flex-end;gap:10px;height:130px">
            ${[12, 30, 22, 48, 90, 75]
              .map(
                (v, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
                  <span style="font-size:10px;color:var(--c-warmGray)">${v}K</span>
                  <div style="width:100%;height:${v}%;background:var(--c-primaryInk);border-radius:3px 3px 0 0"></div>
                  <span style="font-size:10px;color:var(--c-warmGray)">${['Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'][i]}</span>
                </div>`
              )
              .join('')}
          </div>
        </div>
        <h2>Répartition</h2>
        <div style="max-width:340px">
          ${[['Mariage', 62], ['Fiançailles', 24], ['Anniversaire', 10], ['Conférence', 4]]
            .map(
              ([nom, pct]) => `<div style="margin:7px 0">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                  <span>${nom}</span><span style="color:var(--c-warmGray)">${pct}%</span>
                </div>
                <div style="height:7px;background:var(--c-border);border-radius:var(--r-pill);overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:var(--c-primaryInk)"></div>
                </div>
              </div>`
            )
            .join('')}
        </div>`,
    })
  );
}

// 15. Code promo
{
  pages.push(
    page({
      chemin: 'metier/code-promo.html',
      groupe: 'Métier',
      nom: 'Code promo',
      titre: 'Code promo',
      largeur: 760,
      intro:
        "Saisie, refus, application. La remise affichée n'est qu'un aperçu : le montant facturé est recalculé au moment de la demande, jamais repris de l'écran.",
      corps: `<div class="duo">
        <div class="colonne" style="width:100%">
          <div class="etiquette">Saisie</div>
          <div style="display:flex;align-items:flex-end;gap:8px;width:100%">
            <div style="flex:1">
              <div class="champ__label">Code promo</div>
              <div class="champ">${ic('tag')}<span class="fantome" style="flex:1">Ex. RENTREE10</span></div>
            </div>
            <span class="btn btn--md btn--secondary">Appliquer</span>
          </div>
          <div class="etiquette" style="margin-top:14px">Refusé</div>
          <div style="width:100%">
            <div class="champ champ--erreur">${ic('tag')}<span style="flex:1">NEXISTEPAS</span></div>
            <div class="champ__erreur">Ce code n’existe pas pour cette salle.</div>
          </div>
        </div>
        <div class="colonne" style="width:100%">
          <div class="etiquette">Appliqué</div>
          <div style="display:flex;align-items:center;gap:10px;background:var(--c-primaryLight);border-radius:var(--r-lg);padding:11px 14px;width:100%">
            <span style="color:var(--c-primaryInk)">${ic('tag')}</span>
            <div style="flex:1">
              <div style="font-size:14px;color:var(--c-primaryInk)">Code RENTREE10 appliqué</div>
              <div style="font-size:11px;color:var(--c-warmGray)">−3 500 DA</div>
            </div>
            <span style="color:var(--c-warmGray)">✕</span>
          </div>
          <div class="etiquette" style="margin-top:14px">Total remisé</div>
          <div style="display:flex;align-items:baseline;gap:10px">
            <span style="font-size:12px;color:var(--c-warmGray);text-decoration:line-through">35 000 DA</span>
            <span style="font-size:17px;font-weight:600;color:var(--c-primaryInk)">31 500 DA</span>
          </div>
        </div>
      </div>`,
    })
  );
}

// 16. Parrainage
{
  pages.push(
    page({
      chemin: 'metier/parrainage.html',
      groupe: 'Métier',
      nom: 'Parrainage',
      titre: 'Parrainage',
      largeur: 720,
      intro:
        "Le code se dicte au téléphone et se recopie d'un SMS : son alphabet exclut 0/O et 1/I/L. La récompense n'arrive qu'à la validation de la salle du filleul — l'écran le dit, sans quoi le parrain croirait à un oubli pendant les jours d'attente.",
      corps: `<div class="duo">
        <div class="carte" style="text-align:center">
          <div style="font-size:12px;color:var(--c-warmGray)">Votre code</div>
          <div style="border:1px dashed var(--c-primaryInk);border-radius:var(--r-lg);background:var(--c-primaryLight);
                      padding:14px 24px;margin:12px 0;font-size:24px;letter-spacing:6px;color:var(--c-primaryInk)">K7M2QP</div>
          <span class="btn btn--md btn--secondary btn--full">${ic('gift')} Partager mon code</span>
          <div class="note">Votre filleul saisit ce code à son inscription. Dès que sa salle est validée, vous gagnez 30 jours d’abonnement chacun.</div>
        </div>
        <div class="colonne" style="width:100%">
          <div class="carte" style="width:100%">
            <div class="rangee" style="gap:8px"><span style="color:var(--c-primaryInk)">${ic('gift')}</span><b style="font-size:15px">30 jours gagnés</b></div>
            <div class="separateur" style="margin:10px 0"></div>
            <div style="font-size:11px;color:var(--c-warmGray)">Prochain filleul validé : +30 jours</div>
          </div>
          <div class="carte carte--plate" style="width:100%">
            ${[['Salle du filleul', 'Samir Filleul', '+30 jours', true], ['Espace Nour', 'Salle en attente de validation', '', false]]
              .map(
                ([nom, meta, gain, ok], i) => `${i ? '<div class="separateur"></div>' : ''}
              <div style="display:flex;align-items:center;gap:12px;padding:14px 16px">
                <div style="flex:1">
                  <div style="font-size:14px">${nom}</div>
                  <div style="font-size:11px;color:var(--c-warmGray)">${meta}</div>
                </div>
                ${ok ? `<span class="badge badge--sm" style="background:var(--c-successBg);color:var(--c-primaryInk)">${gain}</span>` : `<span style="color:var(--c-warmGray)">⏳</span>`}
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>`,
    })
  );
}

// 17. Code PIN
{
  const point = (etat) =>
    `<div class="point-pin ${etat === 'rempli' ? 'point-pin--rempli' : etat === 'erreur' ? 'point-pin--erreur' : ''}"></div>`;

  const clavier = () => {
    const touches = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    return `<div style="display:flex;flex-wrap:wrap;width:246px;gap:8px">
      ${touches
        .map((k) =>
          !k
            ? `<div class="touche-pin touche-pin--vide"></div>`
            : k === 'del'
            ? `<div class="touche-pin">${ic('backspace', '20px')}</div>`
            : `<div class="touche-pin">${k}</div>`
        )
        .join('')}
    </div>`;
  };

  pages.push(
    page({
      chemin: 'composants/code-pin.html',
      groupe: 'Composants',
      nom: 'Code PIN',
      titre: 'Code PIN',
      largeur: 720,
      intro:
        "Signature digitale du propriétaire à l'accueil (§2.3, §10.1) : quatre chiffres, jamais affichés en clair — seuls des points de progression le sont.",
      corps: `<h2>Points de progression</h2>
        <div class="rangee" style="gap:40px">
          <div class="colonne" style="align-items:center;gap:12px">
            <div class="etiquette">Vide</div>
            <div class="rangee" style="gap:10px">${point()}${point()}${point()}${point()}</div>
          </div>
          <div class="colonne" style="align-items:center;gap:12px">
            <div class="etiquette">2 chiffres saisis</div>
            <div class="rangee" style="gap:10px">${point('rempli')}${point('rempli')}${point()}${point()}</div>
          </div>
          <div class="colonne" style="align-items:center;gap:12px">
            <div class="etiquette">Erreur</div>
            <div class="rangee" style="gap:10px">${point('erreur')}${point('erreur')}${point('erreur')}${point('erreur')}</div>
            <div style="font-size:11px;color:var(--c-accent)">Code incorrect. Réessayez.</div>
          </div>
        </div>
        <h2>Clavier</h2>
        ${clavier()}`,
    })
  );
}

// 18. Calendrier
{
  function monthGrid(year, month) {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({
        iso: d.toISOString().slice(0, 10),
        day: d.getDate(),
        inMonth: d.getMonth() === month,
      });
    }
    return cells;
  }

  // Août 2026 : quelques journées passées, une tenue, une réservée, une
  // bloquée par le propriétaire, une sélectionnée par le client.
  const etats = {
    '2026-08-01': 'passee', '2026-08-02': 'passee', '2026-08-03': 'passee', '2026-08-04': 'passee',
    '2026-08-05': 'passee', '2026-08-06': 'passee', '2026-08-07': 'passee', '2026-08-08': 'passee',
    '2026-08-09': 'passee', '2026-08-10': 'passee',
    '2026-08-14': 'attente',
    '2026-08-19': 'reservee',
    '2026-08-24': 'bloquee',
  };
  const marqueurs = new Set(['2026-08-19', '2026-08-26']);
  const selectionne = '2026-08-26';

  const classeEtat = (etat) => (etat ? `jour--${etat}` : '');

  const grille = (cells) =>
    cells
      .map((c) => {
        const etat = c.inMonth ? etats[c.iso] : null;
        const estSelectionne = c.iso === selectionne && c.inMonth;
        return `<div style="width:${100 / 7}%;padding:2px">
          <div class="jour ${c.inMonth ? '' : 'jour--hors-mois'} ${estSelectionne ? 'jour--selectionne' : classeEtat(etat)}">
            <span>${c.day}</span>
            ${c.inMonth && marqueurs.has(c.iso) ? `<div class="puce-jour" style="${estSelectionne ? 'background:var(--c-onPrimary)' : ''}"></div>` : ''}
          </div>
        </div>`;
      })
      .join('');

  const legende = [
    ['jour--reservee', 'Réservée'],
    ['jour--attente', 'Tenue'],
    ['jour--bloquee', 'Bloquée par le propriétaire'],
  ];

  pages.push(
    page({
      chemin: 'composants/calendrier.html',
      groupe: 'Composants',
      nom: 'Calendrier',
      titre: 'Calendrier',
      largeur: 460,
      intro:
        "Grille de 6 semaines commençant un lundi (§4.4 étape 1, §5.3 planning pro). Côté client, seuls les jours disponibles répondent au toucher ; côté propriétaire, tous les jours à venir sont cliquables — un jour tenu ou bloqué peut être rouvert depuis le planning.",
      corps: `<div style="max-width:340px">
        <div class="rangee" style="justify-content:space-between;margin-bottom:10px">
          <span style="display:inline-block;transform:rotate(180deg)">${ic('chevron', '18px')}</span><b style="font-size:15px">Août 2026</b>${ic('chevron', '18px')}
        </div>
        <div style="display:flex;margin-bottom:2px">
          ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
            .map((j) => `<div style="flex:1;text-align:center;font-size:11px;font-weight:600;color:var(--c-warmGray)">${j}</div>`)
            .join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap">${grille(monthGrid(2026, 7))}</div>
      </div>
      <h2>Légende</h2>
      <div class="rangee" style="gap:16px">
        ${legende
          .map(
            ([classe, label]) =>
              `<div class="rangee" style="gap:6px"><div class="jour ${classe}" style="width:14px;height:14px;flex:none;border-radius:4px"></div><span style="font-size:11px;color:var(--c-warmGray)">${label}</span></div>`
          )
          .join('')}
      </div>`,
    })
  );
}

// 19. Ligne salle (liste de recherche)
{
  const ligne = (nom, ville, capacite, avis, note, prix, [d1, d2], initiale, fav, premium) => `
    <div class="ligne-salle">
      <div class="ligne-salle__photo" style="background:linear-gradient(135deg,${d1},${d2})">
        <span style="font-size:44px;color:rgba(255,255,255,.35);font-weight:800">${initiale}</span>
      </div>
      <div style="flex:1;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:6px">
        <div style="display:flex;flex-direction:column;gap:5px">
          <div class="rangee" style="justify-content:space-between;gap:8px">
            <span style="font-weight:600;font-size:15px">${nom}</span>
            ${icCoeur(fav, '18px', fav ? 'var(--c-accent)' : 'var(--c-warmGray)')}
          </div>
          <div class="rangee" style="gap:4px">
            <span style="color:var(--c-goldMark)">★</span>
            <span style="font-size:12px">${note}</span>
            <span style="font-size:12px;color:var(--c-warmGray)">(${avis})</span>
          </div>
          <div style="font-size:12px;color:var(--c-warmGray)">${ville} · ${capacite} places</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="font-size:15px;font-weight:600;color:var(--c-primaryInk)">À partir de ${prix}</div>
          <div class="rangee" style="gap:6px">
            <span class="badge badge--sm" style="background:var(--c-successBg);color:var(--c-primaryInk)">Disponible</span>
            ${premium ? `<span class="badge badge--sm" style="background:var(--c-goldLight);color:var(--c-goldText)">Premium</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;

  pages.push(
    page({
      chemin: 'metier/ligne-salle.html',
      groupe: 'Métier',
      nom: 'Ligne salle (recherche)',
      titre: 'Ligne salle — résultats de recherche',
      largeur: 480,
      intro:
        "Variante horizontale de la carte de salle, pour la liste de résultats (§4.2). Photo carrée à gauche — à droite en RTL — puis les mêmes informations que la carte, dans l'ordre où l'œil les cherche : nom, note, lieu, prix, disponibilité.",
      corps: `<div class="colonne" style="width:100%">
        ${ligne('Palais Ryad', 'Oran', 700, 203, '4.9', '55 000 DA', ['#8B6914', '#BE9A5E'], 'P', true, true)}
        ${ligne('Salle Ennour', 'Constantine', 250, 41, '4.3', '28 000 DA', ['#6B5B4A', '#A89684'], 'E', false, false)}
      </div>`,
    })
  );
}

// 20. Sélecteur de salle
{
  const salles = [
    { nom: 'Palais Ryad', ville: 'Oran', actif: true },
    { nom: 'Le Corail', ville: 'Annaba', actif: false },
    { nom: 'Salle Ennour', ville: 'Constantine', actif: false },
  ];

  const ferme = (label) => `<div class="selecteur-salle">
      <span style="color:var(--c-primaryInk)">${ic('business')}</span>
      <span style="flex:1;font-size:14px">${label}</span>
      <span style="font-size:12px;color:var(--c-warmGray)">${salles.length}</span>
      <span style="display:inline-block;transform:rotate(90deg)">${ic('chevron', '15px')}</span>
    </div>`;

  const ouvert = () => `<div>
      <div class="selecteur-salle selecteur-salle--ouvert">
        <span style="color:var(--c-primaryInk)">${ic('business')}</span>
        <span style="flex:1;font-size:14px">${salles[0].nom}</span>
        <span style="font-size:12px;color:var(--c-warmGray)">${salles.length}</span>
        <span style="display:inline-block;transform:rotate(-90deg)">${ic('chevron', '15px')}</span>
      </div>
      <div class="selecteur-salle__liste">
        ${salles
          .map(
            (s, i) => `${i ? '<div class="separateur"></div>' : ''}
          <div class="selecteur-salle__item ${s.actif ? 'selecteur-salle__item--actif' : ''}">
            <div style="flex:1">
              <div style="font-size:14px;color:${s.actif ? 'var(--c-primaryInk)' : 'var(--c-dark)'}">${s.nom}</div>
              <div style="font-size:11px;color:var(--c-warmGray)">${s.ville}</div>
            </div>
            ${s.actif ? `<span style="color:var(--c-primaryInk)">${ic('check')}</span>` : ''}
          </div>`
          )
          .join('')}
      </div>
    </div>`;

  pages.push(
    page({
      chemin: 'composants/selecteur-salle.html',
      groupe: 'Composants',
      nom: 'Sélecteur de salle',
      titre: 'Sélecteur de salle',
      largeur: 640,
      intro:
        "N'apparaît qu'à partir de deux salles pour un même propriétaire : avec une seule, il n'y a rien à choisir, et une liste à un élément n'est que du bruit. Reste affiché en tête des écrans pro pour rappeler en permanence sur quelle salle on agit.",
      corps: `<div class="duo">
        <div>
          <div class="etiquette">Fermé</div>
          ${ferme(salles[0].nom)}
        </div>
        <div>
          <div class="etiquette">Ouvert</div>
          ${ouvert()}
        </div>
      </div>`,
    })
  );
}

console.log(`${pages.length} pages écrites dans ${path.relative(RACINE, SORTIE)}/`);
pages.forEach((p) => console.log(`  ${p}`));
