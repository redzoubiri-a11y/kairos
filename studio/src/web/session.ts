/**
 * La porte du studio web.
 *
 * Le studio lit et écrit avec la clé `service_role` : les tables sont fermées
 * par RLS sans aucune policy (0004), donc rien d'autre que ce moteur ne peut
 * les toucher. Cette clé ne quitte jamais le serveur — c'est pour ça que toutes
 * les pages sont des composants serveur et qu'aucune donnée ne transite par une
 * route publique.
 *
 * Conséquence : l'autorisation ne peut pas venir de la base, il n'y a pas de
 * policy à interroger. Elle vient d'ici, et elle est volontairement simple —
 * un opérateur, un mot de passe, un cookie signé. Passer à plusieurs
 * utilisateurs demanderait une vraie authentification ET les policies que 0004
 * laisse vides ; c'est un autre chantier, pas une variable à ajouter.
 *
 * Les deux variables absentes, l'application refuse de servir plutôt que
 * d'ouvrir : même arbitrage que pour le cron d'approbation de Mida.
 */

const COOKIE = 'studio_session';
const DUREE_MS = 12 * 60 * 60 * 1000;

export interface Config {
  motDePasse: string;
  secret: string;
}

/** Rend null si la configuration manque — l'appelant refuse alors de servir. */
export function configWeb(): Config | null {
  const motDePasse = process.env.STUDIO_WEB_PASSWORD?.trim();
  const secret = process.env.STUDIO_WEB_SECRET?.trim();
  if (!motDePasse || !secret) return null;
  return { motDePasse, secret };
}

const encodeur = new TextEncoder();

async function hmac(message: string, secret: string): Promise<string> {
  const cle = await crypto.subtle.importKey(
    'raw',
    encodeur.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cle, encodeur.encode(message));
  return [...new Uint8Array(signature)].map((o) => o.toString(16).padStart(2, '0')).join('');
}

/**
 * Comparaison à durée constante : on compare les empreintes, jamais les
 * chaînes, pour qu'une réponse plus lente ne renseigne pas sur le préfixe.
 */
export async function egalConstant(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encodeur.encode(a)),
    crypto.subtle.digest('SHA-256', encodeur.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i]! ^ vb[i]!;
  return diff === 0;
}

/** Valeur du cookie : la date d'expiration, et sa signature. */
export async function creerJeton(secret: string): Promise<string> {
  const expire = String(Date.now() + DUREE_MS);
  return `${expire}.${await hmac(expire, secret)}`;
}

export async function jetonValide(valeur: string | undefined, secret: string): Promise<boolean> {
  if (!valeur) return false;
  const point = valeur.lastIndexOf('.');
  if (point <= 0) return false;

  const expire = valeur.slice(0, point);
  const signature = valeur.slice(point + 1);

  // La signature d'abord, l'expiration ensuite : un jeton dont la date a été
  // retouchée ne doit pas pouvoir être jugé sur sa date.
  if (!(await egalConstant(signature, await hmac(expire, secret)))) return false;

  const echeance = Number(expire);
  return Number.isFinite(echeance) && echeance > Date.now();
}

export const NOM_COOKIE = COOKIE;
export const DUREE_SECONDES = DUREE_MS / 1000;
