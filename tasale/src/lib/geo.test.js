import {
  hasCoords,
  distanceKm,
  formatDistance,
  sortByDistance,
  directionsUrl,
  staticMapUrl,
} from './geo';

// Coordonnées des villes, arrondies au centième de degré.
const ALGER = { latitude: 36.75, longitude: 3.06 };
const ORAN = { latitude: 35.7, longitude: -0.63 };
const CONSTANTINE = { latitude: 36.36, longitude: 6.61 };
const BLIDA = { latitude: 36.47, longitude: 2.83 };

describe('validité des coordonnées', () => {
  it('accepte une paire complète', () => {
    expect(hasCoords(ALGER)).toBe(true);
  });

  it('rejette les valeurs absentes ou non numériques', () => {
    expect(hasCoords(null)).toBe(false);
    expect(hasCoords({})).toBe(false);
    expect(hasCoords({ latitude: 36.75 })).toBe(false);
    expect(hasCoords({ latitude: 'abc', longitude: 3.06 })).toBe(false);
    expect(hasCoords({ latitude: NaN, longitude: 3.06 })).toBe(false);
  });

  it('accepte le zéro, qui est une coordonnée valide', () => {
    expect(hasCoords({ latitude: 0, longitude: 0 })).toBe(true);
  });
});

describe('distance orthodromique', () => {
  it('vaut zéro entre un point et lui-même', () => {
    expect(distanceKm(ALGER, ALGER)).toBeCloseTo(0, 5);
  });

  it('est symétrique', () => {
    expect(distanceKm(ALGER, ORAN)).toBeCloseTo(distanceKm(ORAN, ALGER), 6);
  });

  it('compte environ 111 km par degré de latitude', () => {
    const d = distanceKm({ latitude: 36, longitude: 3 }, { latitude: 37, longitude: 3 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it('situe correctement Alger–Oran', () => {
    // Environ 350 km à vol d'oiseau
    const d = distanceKm(ALGER, ORAN);
    expect(d).toBeGreaterThan(320);
    expect(d).toBeLessThan(390);
  });

  it('situe correctement Alger–Constantine', () => {
    // Environ 320 km à vol d'oiseau
    const d = distanceKm(ALGER, CONSTANTINE);
    expect(d).toBeGreaterThan(290);
    expect(d).toBeLessThan(350);
  });

  it('trouve Blida plus proche d’Alger qu’Oran', () => {
    expect(distanceKm(ALGER, BLIDA)).toBeLessThan(distanceKm(ALGER, ORAN));
  });

  it('renvoie null quand un point manque', () => {
    expect(distanceKm(ALGER, null)).toBeNull();
    expect(distanceKm(null, ALGER)).toBeNull();
    expect(distanceKm(ALGER, { latitude: 36 })).toBeNull();
  });
});

describe('affichage de la distance', () => {
  it('passe en mètres sous le kilomètre', () => {
    expect(formatDistance(0.4)).toBe('400 m');
  });

  it('garde une décimale en dessous de 10 km', () => {
    expect(formatDistance(3.24)).toBe('3.2 km');
  });

  it('arrondit au-delà, pour ne pas suggérer une fausse précision', () => {
    expect(formatDistance(412.37)).toBe('412 km');
  });

  it('ne rend rien sans distance', () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(NaN)).toBeNull();
  });
});

describe('tri par proximité', () => {
  const salles = [
    { id: 'oran', ...ORAN },
    { id: 'blida', ...BLIDA },
    { id: 'inconnue' },
    { id: 'constantine', ...CONSTANTINE },
  ];

  it('classe du plus proche au plus lointain', () => {
    const tri = sortByDistance(salles, ALGER);
    expect(tri.map((s) => s.id)).toEqual(['blida', 'constantine', 'oran', 'inconnue']);
  });

  it('relègue en fin de liste les salles sans coordonnées', () => {
    expect(sortByDistance(salles, ALGER).at(-1).id).toBe('inconnue');
  });

  it('laisse la liste intacte sans position connue', () => {
    expect(sortByDistance(salles, null)).toBe(salles);
  });

  it('ne modifie pas le tableau reçu', () => {
    const copie = [...salles];
    sortByDistance(salles, ALGER);
    expect(salles).toEqual(copie);
  });
});

describe('lien d’itinéraire', () => {
  it('utilise le schéma natif d’Android', () => {
    const url = directionsUrl({ ...ALGER, label: 'Salle El Widad', platform: 'android' });
    expect(url).toContain('geo:36.75,3.06');
    // Le libellé est encodé : un nom de salle contenant « & » ou un espace
    // couperait l'URL autrement.
    expect(url).toContain('Salle%20El%20Widad');
  });

  it('encode un nom de salle contenant des caractères réservés', () => {
    const url = directionsUrl({ ...ALGER, label: 'Dar El Ferah & Fils', platform: 'android' });
    expect(url).not.toContain('&amp;');
    expect(url).toContain('%26');
  });

  it('utilise le schéma natif d’iOS', () => {
    expect(directionsUrl({ ...ALGER, platform: 'ios' })).toContain('maps://?daddr=36.75,3.06');
  });

  it('retombe sur Google Maps ailleurs', () => {
    expect(directionsUrl({ ...ALGER, platform: 'web' })).toContain('google.com/maps');
  });

  it('ne produit pas de lien sans coordonnées', () => {
    expect(directionsUrl({ label: 'Nulle part', platform: 'web' })).toBeNull();
  });
});

describe('vignette cartographique', () => {
  it('compose une URL Mapbox avec le marqueur aux couleurs de la marque', () => {
    const url = staticMapUrl({ ...ALGER, token: 'pk.test' });
    expect(url).toContain('api.mapbox.com');
    expect(url).toContain('pin-l+0B6E5F');
    expect(url).toContain('access_token=pk.test');
  });

  it('ne rend rien sans jeton : c’est ce qui déclenche le repli', () => {
    expect(staticMapUrl({ ...ALGER, token: null })).toBeNull();
    expect(staticMapUrl({ ...ALGER, token: '' })).toBeNull();
  });

  it('ne rend rien sans coordonnées', () => {
    expect(staticMapUrl({ token: 'pk.test' })).toBeNull();
  });
});
