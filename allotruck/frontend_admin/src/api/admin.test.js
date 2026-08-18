import { beforeEach, describe, expect, it, vi } from 'vitest';

import client from './client';
import {
  getTransporter,
  listTransporters,
  listUsers,
  setUserActive,
  verifyTransporter,
} from './admin';

// Pilote l'adaptateur d'axios : les intercepteurs tournent vraiment, mais rien
// ne part sur le reseau. On releve la requete pour verifier ce qui est envoye.
let requests;

function respondWith(data) {
  client.defaults.adapter = (config) => {
    requests.push(config);
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
}

const previousAdapter = client.defaults.adapter;

beforeEach(() => {
  requests = [];
  respondWith({});
  return () => {
    client.defaults.adapter = previousAdapter;
  };
});

describe('detail d un transporteur', () => {
  // Le defaut corrige : faute de route dediee, le detail parcourait toutes les
  // pages de la liste jusqu'a tomber sur l'identifiant — une requete par
  // centaine de transporteurs, en serie, a chaque ouverture de dossier.
  it('interroge la route dediee en un seul appel', async () => {
    respondWith({ id: 'tr-1', companyName: 'Ait Transport' });

    const profile = await getTransporter('tr-1');

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/admin/transporters/tr-1');
    expect(profile.companyName).toBe('Ait Transport');
  });

  it('laisse remonter un 404 sans le deguiser', async () => {
    client.defaults.adapter = () =>
      Promise.reject(
        Object.assign(new Error('Request failed'), {
          response: { status: 404, data: { error: { message: 'Transporteur introuvable' } } },
          isAxiosError: true,
        })
      );

    await expect(getTransporter('inconnu')).rejects.toMatchObject({
      status: 404,
      message: 'Transporteur introuvable',
    });
  });
});

describe('parametres de requete', () => {
  it('omet les filtres vides que le serveur rejetterait', async () => {
    await listTransporters({ status: '', search: '', page: 2, limit: 20 });

    expect(requests[0].params).toEqual({ page: 2, limit: 20 });
  });

  it('transmet les filtres renseignes', async () => {
    await listUsers({ role: 'ADMIN', search: 'karim', page: 1, limit: 20 });

    expect(requests[0].params).toEqual({ role: 'ADMIN', search: 'karim', page: 1, limit: 20 });
  });
});

describe('validation d un dossier', () => {
  // Le serveur refuse un refus sans motif ; il refuse aussi une cle inconnue,
  // donc `reason` ne doit pas accompagner une validation.
  it("joint le motif au refus", async () => {
    await verifyTransporter({ transporterId: 'tr-1', status: 'REJECTED', reason: 'RC illisible' });

    expect(requests[0].data && JSON.parse(requests[0].data)).toEqual({
      transporterId: 'tr-1',
      status: 'REJECTED',
      reason: 'RC illisible',
    });
  });

  it("n envoie pas de motif avec une validation", async () => {
    await verifyTransporter({ transporterId: 'tr-1', status: 'VERIFIED', reason: 'ignore' });

    expect(requests[0].data && JSON.parse(requests[0].data)).toEqual({
      transporterId: 'tr-1',
      status: 'VERIFIED',
    });
  });
});

describe('activation d un compte', () => {
  it('cible le compte vise et transmet l etat demande', async () => {
    await setUserActive('u-1', false);

    expect(requests[0].url).toBe('/admin/users/u-1/active');
    expect(requests[0].method).toBe('patch');
    expect(JSON.parse(requests[0].data)).toEqual({ isActive: false });
  });
});
