import { describe, expect, it } from 'vitest';

import client, { cleanParams } from './client';
import { useAuthStore } from '../store/authStore';

// Exerce les intercepteurs sans reseau, en pilotant l'adaptateur d'axios.
function withAdapter(adapter) {
  const instance = client;
  const previous = instance.defaults.adapter;
  instance.defaults.adapter = adapter;
  return () => {
    instance.defaults.adapter = previous;
  };
}

function httpError(status, data) {
  return () =>
    Promise.reject(
      Object.assign(new Error('Request failed'), {
        response: { status, data },
        isAxiosError: true,
      })
    );
}

describe('cleanParams', () => {
  // Le backend valide les query strings en mode strict : une chaine vide fait
  // echouer un enum et une cle inconnue est rejetee.
  it('retire les valeurs vides, nulles et indefinies', () => {
    expect(
      cleanParams({ status: '', search: undefined, role: null, page: 1, limit: 20 })
    ).toEqual({ page: 1, limit: 20 });
  });

  it('conserve zero et false, qui sont des valeurs legitimes', () => {
    expect(cleanParams({ page: 0, isActive: false })).toEqual({ page: 0, isActive: false });
  });
});

describe("intercepteurs du client", () => {
  it("joint le jeton quand une session existe", async () => {
    useAuthStore.setState({ token: 'jeton-admin', user: { role: 'ADMIN' } });

    let seenAuthorization;
    const restore = withAdapter((config) => {
      seenAuthorization = config.headers.Authorization;
      return Promise.resolve({ status: 200, data: {}, headers: {}, config });
    });

    try {
      await client.get('/admin/stats');
      expect(seenAuthorization).toBe('Bearer jeton-admin');
    } finally {
      restore();
    }
  });

  it("remonte le message d'erreur de l'API plutot qu'un libelle generique", async () => {
    const restore = withAdapter(
      httpError(400, { error: { message: 'Un motif est requis pour un refus' } })
    );

    try {
      await expect(client.patch('/admin/verify-transporter')).rejects.toThrow(
        'Un motif est requis pour un refus'
      );
    } finally {
      restore();
    }
  });

  it('retombe sur un libelle lisible quand l API ne fournit pas de message', async () => {
    const restore = withAdapter(httpError(403, {}));

    try {
      await expect(client.get('/admin/stats')).rejects.toThrow(/droits necessaires|droits nécessaires/);
    } finally {
      restore();
    }
  });

  it('explique une API injoignable au lieu de « Network Error »', async () => {
    const restore = withAdapter(() => Promise.reject(new Error('Network Error')));

    try {
      await expect(client.get('/admin/stats')).rejects.toThrow(/Impossible de joindre/);
    } finally {
      restore();
    }
  });

  // Vider le store fait rediriger ProtectedRoute vers /login de maniere reactive.
  it('efface la session sur un 401', async () => {
    useAuthStore.setState({ token: 'jeton-expire', user: { role: 'ADMIN' } });
    const restore = withAdapter(httpError(401, {}));

    try {
      await expect(client.get('/admin/stats')).rejects.toThrow();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    } finally {
      restore();
    }
  });

  it('ne touche pas a la session sur un 403', async () => {
    useAuthStore.setState({ token: 'jeton-valide', user: { role: 'ADMIN' } });
    const restore = withAdapter(httpError(403, {}));

    try {
      await expect(client.get('/admin/stats')).rejects.toThrow();
      expect(useAuthStore.getState().token).toBe('jeton-valide');
    } finally {
      restore();
    }
  });

  it("expose le statut et les details pour l'appelant", async () => {
    const details = [{ field: 'reason', message: 'Requis' }];
    const restore = withAdapter(httpError(400, { error: { message: 'Donnees invalides', details } }));

    try {
      await client.post('/admin/verify-transporter');
      throw new Error('la requete aurait du echouer');
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.details).toEqual(details);
    } finally {
      restore();
    }
  });
});
