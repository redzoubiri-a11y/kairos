import { base64ToBytes, buildPath } from './storage';

const encode = (str) => Buffer.from(str, 'utf8').toString('base64');
const bytesOf = (str) => Array.from(Buffer.from(str, 'utf8'));

describe('décodage base64', () => {
  it('décode une chaîne sans remplissage', () => {
    // "abc" → 3 octets, aucun "=" final
    expect(Array.from(base64ToBytes(encode('abc')))).toEqual(bytesOf('abc'));
  });

  it('décode avec un caractère de remplissage', () => {
    expect(Array.from(base64ToBytes(encode('abcde')))).toEqual(bytesOf('abcde'));
  });

  it('décode avec deux caractères de remplissage', () => {
    expect(Array.from(base64ToBytes(encode('abcd')))).toEqual(bytesOf('abcd'));
  });

  it('gère une chaîne vide', () => {
    expect(base64ToBytes('')).toHaveLength(0);
  });

  it('ignore les retours à la ligne insérés par certains encodeurs', () => {
    const brut = encode('une image un peu plus longue pour forcer le découpage');
    const coupe = `${brut.slice(0, 20)}\n${brut.slice(20)}`;
    expect(Array.from(base64ToBytes(coupe))).toEqual(
      Array.from(base64ToBytes(brut))
    );
  });

  it('restitue des octets binaires arbitraires', () => {
    const source = Uint8Array.from({ length: 256 }, (_, i) => i);
    const b64 = Buffer.from(source).toString('base64');
    expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(source));
  });

  it('rejette un caractère hors alphabet', () => {
    expect(() => base64ToBytes('ab*d')).toThrow('BASE64_INVALIDE');
  });
});

describe('chemin de destination', () => {
  it('déduit l’extension du type MIME', () => {
    expect(buildPath('salle-1', 'image/png')).toMatch(/^salle-1\/[a-z0-9-]+\.png$/);
    expect(buildPath('salle-1', 'image/webp')).toMatch(/\.webp$/);
    expect(buildPath('salle-1', 'image/jpeg')).toMatch(/\.jpg$/);
  });

  it('retombe sur jpg quand le type est inconnu', () => {
    expect(buildPath('salle-1', undefined)).toMatch(/\.jpg$/);
    expect(buildPath('salle-1', 'application/octet-stream')).toMatch(/\.jpg$/);
  });

  it('produit un chemin différent à chaque appel', () => {
    const chemins = new Set(Array.from({ length: 50 }, () => buildPath('p', 'image/jpeg')));
    expect(chemins.size).toBe(50);
  });
});
