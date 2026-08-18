// Doublures locales des services que les fonctions appellent : Supabase REST,
// la passerelle SMS, et le service push d'Expo.
//
// Ce sont de vrais serveurs HTTP sur localhost, pas des mocks en mémoire :
// les requêtes partent réellement du code des fonctions et reviennent, ce qui
// vérifie aussi la construction des URL, des en-têtes et des corps.

import http from 'node:http';

/** Démarre un serveur et renvoie { url, requetes, arreter }. */
export function servir(routeur) {
  const requetes = [];
  const serveur = http.createServer(async (req, res) => {
    const morceaux = [];
    for await (const m of req) morceaux.push(m);
    const corps = Buffer.concat(morceaux).toString('utf8');
    const trace = { methode: req.method, chemin: req.url, entetes: req.headers, corps };
    requetes.push(trace);

    const reponse = (await routeur(trace)) ?? { statut: 404, corps: '{}' };
    res.writeHead(reponse.statut, { 'Content-Type': 'application/json' });
    res.end(typeof reponse.corps === 'string' ? reponse.corps : JSON.stringify(reponse.corps));
  });

  return new Promise((resolve) => {
    serveur.listen(0, '127.0.0.1', () => {
      const { port } = serveur.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        requetes,
        arreter: () => new Promise((r) => serveur.close(r)),
      });
    });
  });
}

/**
 * Faux Supabase : répond aux RPC et aux lectures REST dont les fonctions ont
 * besoin. `etat` porte les données ; `journal` retient les RPC appelées.
 */
export function fauxSupabase(etat) {
  const journal = [];
  return {
    journal,
    routeur: async ({ methode, chemin, corps }) => {
      const payload = corps ? JSON.parse(corps) : {};

      if (chemin.startsWith('/rest/v1/rpc/')) {
        const nom = chemin.slice('/rest/v1/rpc/'.length).split('?')[0];
        journal.push({ rpc: nom, args: payload });

        if (nom === 'due_notifications') return { statut: 200, corps: etat.dues ?? [] };
        if (nom === 'push_tokens_of') return { statut: 200, corps: etat.tokens?.[payload.p_user] ?? [] };
        if (nom === 'mark_notification_delivered' || nom === 'mark_notification_failed') {
          return { statut: 200, corps: null };
        }
        return { statut: 400, corps: { message: `RPC inconnue : ${nom}` } };
      }

      // supabase-js interroge users en GET avec un filtre id=eq.<uuid>
      if (chemin.startsWith('/rest/v1/users')) {
        const id = decodeURIComponent(chemin).match(/id=eq\.([^&]+)/)?.[1];
        const ligne = etat.users?.[id];
        journal.push({ select: 'users', id, trouve: Boolean(ligne) });
        // `maybeSingle()` attend zéro ou une ligne
        return { statut: 200, corps: ligne ? [ligne] : [] };
      }

      return { statut: 404, corps: { message: `route inattendue ${methode} ${chemin}` } };
    },
  };
}

/**
 * Détourne `fetch` pour que l'URL d'Expo, codée en dur dans la fonction,
 * atterrisse sur un serveur local. Tout le reste passe au vrai fetch.
 */
export function router({ expo }) {
  const vrai = globalThis.fetch;
  globalThis.fetch = (entree, init) => {
    const url = typeof entree === 'string' ? entree : entree.url;
    if (expo && url.startsWith('https://exp.host/')) {
      return vrai(expo + new URL(url).pathname, init);
    }
    return vrai(entree, init);
  };
  return () => {
    globalThis.fetch = vrai;
  };
}
