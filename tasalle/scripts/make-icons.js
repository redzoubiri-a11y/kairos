/**
 * Génère les icônes de l'application à partir du monogramme.
 *
 *   node scripts/make-icons.js
 *
 * Les quatre fichiers d'assets/ sont écrasés. Le dessin vient de
 * src/lib/monogramme.js — le même que celui de l'écran et des documents PDF —
 * afin qu'aucune des trois surfaces ne dérive des autres.
 *
 * Dépend de Playwright, qui n'est pas une dépendance du projet : c'est un
 * outil de fabrication, lancé à la main quand la marque change.
 *   npm i -D playwright
 *
 * Si Chromium est déjà présent hors du cache de Playwright, pointez-le :
 *   PLAYWRIGHT_CHROMIUM=/chemin/vers/chrome node scripts/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.join(__dirname, '..');
const OUT = path.join(RACINE, 'assets');

// Le module de tracés est en syntaxe ESM ; ce script tourne sous Node en CJS.
// Plutôt que d'ajouter une chaîne de compilation pour trois constantes, on les
// lit dans le fichier. C'est volontairement rustique, et ça casse bruyamment
// si le fichier change de forme.
function lireMonogramme() {
  const src = fs.readFileSync(path.join(RACINE, 'src/lib/monogramme.js'), 'utf8');
  const constante = (nom) => {
    const m = src.match(new RegExp(`export const ${nom} =\\s*'([^']*)'`));
    if (!m) throw new Error(`${nom} introuvable dans src/lib/monogramme.js`);
    return m[1];
  };
  const cercle = src.match(/MONOGRAMME_CERCLE = \{([^}]*)\}/);
  if (!cercle) throw new Error('MONOGRAMME_CERCLE introuvable');
  const nombre = (cle) => Number(cercle[1].match(new RegExp(`${cle}:\\s*([\\d.]+)`))[1]);
  return {
    T: constante('MONOGRAMME_T'),
    S: constante('MONOGRAMME_S'),
    cercle: { cx: nombre('cx'), cy: nombre('cy'), r: nombre('r'), largeur: nombre('largeur') },
  };
}

// Doit rester en phase avec `logoInk` / `logoCanvas` dans src/theme.js — ce
// script lit le tracé du monogramme dans le fichier mais pas ses couleurs
// (rustique par choix, voir la note plus haut), donc rien ne le signalerait
// automatiquement s'il divergeait. --color-accent (Broadsheet) / --color-neutral-100.
const OR = '#0088B0';
const CREME = '#F8F4F4';

const page = ({ size, bg, scale, radiusRatio }, m) => {
  const d = size * scale;
  return `
<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin:0; padding:0; width:${size}px; height:${size}px; background:transparent; }
  .fond {
    width:${size}px; height:${size}px;
    ${bg ? `background:${bg};` : ''}
    ${radiusRatio ? `border-radius:${size * radiusRatio}px;` : ''}
    display:flex; align-items:center; justify-content:center;
  }
</style></head><body><div class="fond">
  <svg width="${d}" height="${d}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${m.cercle.cx}" cy="${m.cercle.cy}" r="${m.cercle.r}"
            stroke="${OR}" stroke-width="${m.cercle.largeur}" fill="none"/>
    <path d="${m.T}" fill="${OR}"/>
    <path d="${m.S}" fill="${OR}"/>
  </svg>
</div></body></html>`;
};

const CIBLES = [
  // iOS : pleine, sans transparence ni coins arrondis (iOS masque lui-même)
  { file: 'icon.png', size: 1024, bg: CREME, scale: 0.66, radiusRatio: 0, transparent: false },

  // Android adaptatif : avant-plan transparent. La marque doit tenir dans la
  // zone sûre centrale, le système rognant les bords.
  { file: 'adaptive-icon.png', size: 1024, bg: null, scale: 0.46, radiusRatio: 0, transparent: true },

  // Écran de lancement : marque seule, Expo applique la couleur de fond
  { file: 'splash-icon.png', size: 512, bg: null, scale: 0.62, radiusRatio: 0, transparent: true },

  // Favicon du back-office web : carré arrondi, lisible à 16 px
  { file: 'favicon.png', size: 196, bg: CREME, scale: 0.78, radiusRatio: 0.22, transparent: false },
];

(async () => {
  const monogramme = lireMonogramme();
  // Certains environnements fournissent Chromium hors du cache de Playwright
  // (conteneurs CI, images préinstallées) : on laisse une porte de sortie
  // plutôt que d'imposer `npx playwright install`.
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}
  );

  for (const cible of CIBLES) {
    const p = await browser.newPage({ viewport: { width: cible.size, height: cible.size } });
    await p.setContent(page(cible, monogramme));
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, cible.file), omitBackground: cible.transparent });
    console.log(`  ✓ ${cible.file} — ${cible.size}×${cible.size}${cible.transparent ? ' (transparent)' : ''}`);
    await p.close();
  }

  await browser.close();
})().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
