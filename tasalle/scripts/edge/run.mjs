// Première exécution des deux fonctions Edge.
import { Webhook } from 'standardwebhooks';
import { charger } from './harness.mjs';
import { servir, fauxSupabase, router } from './faux-serveurs.mjs';

let reussis = 0;
let echoues = 0;

function verifier(titre, condition, detail = '') {
  if (condition) {
    reussis += 1;
    console.log(`  ✓ ${titre}`);
  } else {
    echoues += 1;
    console.log(`  ✗ ${titre}${detail ? ` — ${detail}` : ''}`);
  }
}

const requete = (corps, entetes = {}) =>
  new Request('http://localhost/', { method: 'POST', body: corps, headers: entetes });

/** Signe un payload comme le fait Supabase Auth. */
function signer(secret, payload) {
  const wh = new Webhook(secret.replace('v1,whsec_', ''));
  const id = 'msg_test';
  const at = new Date();
  const entetes = wh.sign(id, at, payload);
  return {
    'webhook-id': id,
    'webhook-timestamp': Math.floor(at.getTime() / 1000).toString(),
    'webhook-signature': entetes,
  };
}

// ── send-sms-hook ────────────────────────────────────────────────────────
async function hookSms() {
  console.log('\n== send-sms-hook ==');
  const SECRET = 'v1,whsec_' + Buffer.from('secret-de-test-tasalle-123456').toString('base64');
  const payload = JSON.stringify({ user: { phone: '0555 10 00 01' }, sms: { otp: '482913' } });

  // 1. Méthode refusée
  let h = await charger('send-sms-hook', { SEND_SMS_HOOK_SECRET: SECRET, SMS_PROVIDER: 'log' });
  let r = await h(new Request('http://localhost/', { method: 'GET' }));
  verifier('GET refusé (405)', r.status === 405, `reçu ${r.status}`);

  // 2. Secret absent
  h = await charger('send-sms-hook', { SMS_PROVIDER: 'log' });
  r = await h(requete(payload));
  verifier('secret manquant → 500', r.status === 500, `reçu ${r.status}`);

  // 3. Signature falsifiée, horodatage valide : c'est bien la signature qui
  // doit faire échouer, d'où l'horodatage courant.
  h = await charger('send-sms-hook', { SEND_SMS_HOOK_SECRET: SECRET, SMS_PROVIDER: 'log' });
  const maintenant = Math.floor(Date.now() / 1000).toString();
  r = await h(requete(payload, {
    'webhook-id': 'msg_faux',
    'webhook-timestamp': maintenant,
    'webhook-signature': 'v1,' + Buffer.from('signature-inventee').toString('base64'),
  }));
  verifier('signature falsifiée → 401', r.status === 401, `reçu ${r.status}`);

  // 4. Rejeu : payload correctement signé, mais daté d'hier.
  const hier = new Date(Date.now() - 24 * 3600 * 1000);
  const whRejeu = new Webhook(SECRET.replace('v1,whsec_', ''));
  r = await h(requete(payload, {
    'webhook-id': 'msg_rejeu',
    'webhook-timestamp': Math.floor(hier.getTime() / 1000).toString(),
    'webhook-signature': whRejeu.sign('msg_rejeu', hier, payload),
  }));
  verifier('rejeu d’un message daté → 401', r.status === 401, `reçu ${r.status}`);

  // 5. Signature valide mais secret différent : un autre émetteur est rejeté.
  const autreSecret = 'v1,whsec_' + Buffer.from('un-autre-secret-entierement').toString('base64');
  r = await h(requete(payload, signer(autreSecret, payload)));
  verifier('signature d’un autre secret → 401', r.status === 401, `reçu ${r.status}`);

  // 4. Signature valide, envoi en mode log
  const traces = [];
  const vraiLog = console.log;
  console.log = (...a) => traces.push(a.join(' '));
  r = await h(requete(payload, signer(SECRET, payload)));
  console.log = vraiLog;
  verifier('signature valide → 200', r.status === 200, `reçu ${r.status}`);
  verifier(
    'le SMS est journalisé avec le numéro normalisé',
    traces.some((t) => t.includes('+213555100001') && t.includes('482913')),
    traces.join(' | ').slice(0, 120)
  );

  // 5. Payload incomplet
  const sansTel = JSON.stringify({ user: {}, sms: { otp: '111111' } });
  r = await h(requete(sansTel, signer(SECRET, sansTel)));
  verifier('téléphone absent → 400', r.status === 400, `reçu ${r.status}`);

  // 6. Fournisseur http : la passerelle reçoit bien le message
  const passerelle = await servir(async () => ({ statut: 200, corps: { id: 'ok' } }));
  h = await charger('send-sms-hook', {
    SEND_SMS_HOOK_SECRET: SECRET,
    SMS_PROVIDER: 'http',
    SMS_HTTP_URL: passerelle.url + '/envoi',
    SMS_HTTP_TOKEN: 'jeton-test',
  });
  r = await h(requete(payload, signer(SECRET, payload)));
  verifier('mode http → 200', r.status === 200, `reçu ${r.status}`);
  const recu = passerelle.requetes[0];
  verifier('la passerelle est appelée une fois', passerelle.requetes.length === 1);
  verifier(
    'jeton porté en Authorization',
    recu?.entetes.authorization === 'Bearer jeton-test',
    recu?.entetes.authorization
  );
  const corpsRecu = recu ? JSON.parse(recu.corps) : {};
  verifier('destinataire au format international', corpsRecu.to === '+213555100001', corpsRecu.to);
  verifier('le code figure dans le texte', String(corpsRecu.text).includes('482913'), corpsRecu.text);
  verifier('le texte tient en un SMS', String(corpsRecu.text).length <= 160, `${String(corpsRecu.text).length} car.`);
  await passerelle.arreter();

  // 7. Passerelle en panne → la fonction remonte l'échec
  const enPanne = await servir(async () => ({ statut: 502, corps: { erreur: 'opérateur indisponible' } }));
  h = await charger('send-sms-hook', {
    SEND_SMS_HOOK_SECRET: SECRET,
    SMS_PROVIDER: 'http',
    SMS_HTTP_URL: enPanne.url + '/envoi',
  });
  r = await h(requete(payload, signer(SECRET, payload)));
  verifier('passerelle en panne → 500', r.status === 500, `reçu ${r.status}`);
  const corpsErreur = await r.json();
  verifier(
    'le message d’erreur remonte à l’appelant',
    String(corpsErreur?.error?.message).includes('502'),
    JSON.stringify(corpsErreur)
  );
  await enPanne.arreter();
}

// ── dispatch-notifications ───────────────────────────────────────────────
async function dispatch() {
  console.log('\n== dispatch-notifications ==');

  // 1. Environnement incomplet
  let h = await charger('dispatch-notifications', {});
  let r = await h(new Request('http://localhost/'));
  verifier('environnement incomplet → 500', r.status === 500, `reçu ${r.status}`);

  // 2. File vide
  const vide = fauxSupabase({ dues: [] });
  let srv = await servir(vide.routeur);
  h = await charger('dispatch-notifications', {
    SUPABASE_URL: srv.url,
    SUPABASE_SERVICE_ROLE_KEY: 'cle-de-service',
    SMS_PROVIDER: 'log',
  });
  r = await h(new Request('http://localhost/'));
  let bilan = await r.json();
  verifier('file vide → 200 sans envoi', r.status === 200 && bilan.examined === 0, JSON.stringify(bilan));
  await srv.arreter();

  // 3. Un SMS et deux push, dont un destinataire sans appareil
  const etat = {
    dues: [
      { id: 'n1', user_id: 'u1', channel: 'sms', title: null, body: 'Votre reservation est confirmee.', data: null, type: 'reservation_confirmed' },
      { id: 'n2', user_id: 'u2', channel: 'push', title: 'Nouvelle demande', body: 'Amina, 320 invites', data: { r: 'x' }, type: 'reservation_new' },
      { id: 'n3', user_id: 'u3', channel: 'push', title: 'Rappel', body: 'Demain', data: null, type: 'reminder' },
    ],
    users: { u1: { phone: '0661234567' } },
    tokens: { u2: ['ExponentPushToken[aaa]'], u3: [] },
  };
  const faux = fauxSupabase(etat);
  srv = await servir(faux.routeur);

  const expo = await servir(async () => ({ statut: 200, corps: { data: [{ status: 'ok', id: 't1' }] } }));
  const restaurer = router({ expo: expo.url });

  const journalSms = [];
  const vraiLog = console.log;
  console.log = (...a) => journalSms.push(a.join(' '));
  h = await charger('dispatch-notifications', {
    SUPABASE_URL: srv.url,
    SUPABASE_SERVICE_ROLE_KEY: 'cle-de-service',
    SMS_PROVIDER: 'log',
  });
  r = await h(new Request('http://localhost/'));
  console.log = vraiLog;
  bilan = await r.json();

  verifier('les trois notifications sont examinées', bilan.examined === 3, JSON.stringify(bilan));
  verifier('deux livrées, une en échec', bilan.delivered === 2 && bilan.failed === 1, JSON.stringify(bilan));
  verifier(
    'le SMS part au numéro du destinataire',
    journalSms.some((l) => l.includes('+213661234567')),
    journalSms.join(' | ').slice(0, 120)
  );
  verifier('Expo est appelé une seule fois', expo.requetes.length === 1, `${expo.requetes.length} appels`);
  const messagesExpo = expo.requetes[0] ? JSON.parse(expo.requetes[0].corps) : [];
  verifier('le message push porte le bon jeton', messagesExpo[0]?.to === 'ExponentPushToken[aaa]', JSON.stringify(messagesExpo[0]));
  verifier('le titre est repris', messagesExpo[0]?.title === 'Nouvelle demande');
  verifier(
    'l’appareil absent est compté en échec, pas envoyé',
    faux.journal.some((e) => e.rpc === 'mark_notification_failed' && e.args.p_id === 'n3'),
    JSON.stringify(faux.journal.filter((e) => e.rpc?.startsWith('mark')))
  );
  verifier(
    'les deux réussites sont marquées livrées',
    ['n1', 'n2'].every((id) =>
      faux.journal.some((e) => e.rpc === 'mark_notification_delivered' && e.args.p_id === id)
    )
  );
  restaurer();
  await expo.arreter();
  await srv.arreter();

  // 4. Expo rejette tous les jetons
  const faux2 = fauxSupabase({
    dues: [{ id: 'n4', user_id: 'u4', channel: 'push', title: 'T', body: 'B', data: null, type: 'x' }],
    tokens: { u4: ['ExponentPushToken[perime]'] },
  });
  const srv2 = await servir(faux2.routeur);
  const expo2 = await servir(async () => ({
    statut: 200,
    corps: { data: [{ status: 'error', message: 'DeviceNotRegistered' }] },
  }));
  const restaurer2 = router({ expo: expo2.url });
  h = await charger('dispatch-notifications', {
    SUPABASE_URL: srv2.url,
    SUPABASE_SERVICE_ROLE_KEY: 'cle',
    SMS_PROVIDER: 'log',
  });
  r = await h(new Request('http://localhost/'));
  bilan = await r.json();
  verifier('jeton périmé → échec malgré le 200 d’Expo', bilan.failed === 1, JSON.stringify(bilan));
  const echec = faux2.journal.find((e) => e.rpc === 'mark_notification_failed');
  verifier(
    'la raison de l’échec est enregistrée',
    String(echec?.args?.p_error).includes('DeviceNotRegistered'),
    JSON.stringify(echec)
  );
  restaurer2();
  await expo2.arreter();
  await srv2.arreter();
}

await hookSms();
await dispatch();

console.log(`\n${reussis} vérifications passées, ${echoues} en échec`);
process.exit(echoues === 0 ? 0 : 1);
