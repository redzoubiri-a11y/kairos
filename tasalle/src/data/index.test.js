// Garde-fou pour un bug réel rencontré le 18/08/2026 : `index.js` réexporte
// chaque fonction de `local.js`/`remote.js` une par une (liste organisée par
// section, pas de `export * from`), donc une nouvelle fonction ajoutée aux
// deux adaptateurs mais oubliée ici reste invisible aux écrans — `api.xxx`
// vaut `undefined` en silence, sans erreur avant l'appel en plein écran. Les
// tests de `local.test.js` n'auraient jamais attrapé ça : ils importent
// `./local` directement, en court-circuitant ce point d'entrée.

import * as api from './index';
import * as local from './local';

describe('point d’entrée de la couche données', () => {
  it('réexporte toutes les fonctions du backend local', () => {
    const manquantes = Object.keys(local).filter(
      (cle) => typeof local[cle] === 'function' && typeof api[cle] !== 'function'
    );
    expect(manquantes).toEqual([]);
  });
});
