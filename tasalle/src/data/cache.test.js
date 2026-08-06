import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheKey, cacheSet, cacheGet, cacheClear, withCache, MAX_AGE_MS } from './cache';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('clés', () => {
  it('assemble les segments et ignore les vides', () => {
    expect(cacheKey('planning', 2026, 7)).toBe('tasale.cache.planning:2026:7');
    expect(cacheKey('planning', null, 7)).toBe('tasale.cache.planning:7');
  });
});

describe('écriture et lecture', () => {
  it('restitue la valeur avec son horodatage', async () => {
    await cacheSet(cacheKey('x'), { a: 1 });
    const hit = await cacheGet(cacheKey('x'));
    expect(hit.value).toEqual({ a: 1 });
    expect(new Date(hit.at).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('renvoie null pour une clé absente', async () => {
    expect(await cacheGet(cacheKey('jamais'))).toBeNull();
  });

  it('renvoie null sur un contenu illisible', async () => {
    await AsyncStorage.setItem(cacheKey('casse'), 'ceci nest pas du json');
    expect(await cacheGet(cacheKey('casse'))).toBeNull();
  });

  it('écarte une donnée périmée', async () => {
    await cacheSet(cacheKey('vieux'), 'contenu');
    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + MAX_AGE_MS + 1000);
    try {
      expect(await cacheGet(cacheKey('vieux'))).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('vide uniquement ses propres clés', async () => {
    await cacheSet(cacheKey('a'), 1);
    await AsyncStorage.setItem('tasale.lang', 'fr');

    await cacheClear();

    expect(await cacheGet(cacheKey('a'))).toBeNull();
    expect(await AsyncStorage.getItem('tasale.lang')).toBe('fr');
  });
});

describe('repli hors ligne', () => {
  it('renvoie la donnée fraîche et la met en cache', async () => {
    const { data, at } = await withCache(cacheKey('p'), async () => ({ jours: 30 }));
    expect(data).toEqual({ jours: 30 });
    expect(at).toBeNull();

    expect((await cacheGet(cacheKey('p'))).value).toEqual({ jours: 30 });
  });

  it('retombe sur le cache quand l’appel échoue', async () => {
    await withCache(cacheKey('p'), async () => ({ jours: 30 }));

    const { data, at } = await withCache(cacheKey('p'), async () => {
      throw new Error('Network request failed');
    });

    expect(data).toEqual({ jours: 30 });
    expect(at).not.toBeNull(); // signale que la donnée n'est plus fraîche
  });

  it('propage l’erreur si rien n’a jamais été mis en cache', async () => {
    await expect(
      withCache(cacheKey('vide'), async () => {
        throw new Error('Network request failed');
      })
    ).rejects.toThrow('Network request failed');
  });

  it('propage l’erreur plutôt que de servir un cache périmé', async () => {
    await withCache(cacheKey('p'), async () => ({ jours: 30 }));

    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + MAX_AGE_MS + 1000);
    try {
      await expect(
        withCache(cacheKey('p'), async () => {
          throw new Error('hors ligne');
        })
      ).rejects.toThrow('hors ligne');
    } finally {
      spy.mockRestore();
    }
  });

  it('rafraîchit le cache à chaque succès', async () => {
    await withCache(cacheKey('p'), async () => ({ v: 1 }));
    await withCache(cacheKey('p'), async () => ({ v: 2 }));

    const { data } = await withCache(cacheKey('p'), async () => {
      throw new Error('hors ligne');
    });
    expect(data).toEqual({ v: 2 });
  });
});
