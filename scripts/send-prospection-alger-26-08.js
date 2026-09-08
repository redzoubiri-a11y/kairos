#!/usr/bin/env node
// Vague de prospection Alger du 2026-08-26 : invitation "essai gratuit jusqu'au
// 31/12/2026, sans engagement" vers la nouvelle landing /partenaire/{slug}.
//
// Contexte : l'app est desormais publiee sur Google Play ET l'App Store, ce qui
// permet au restaurateur de verifier son existence avant de repondre -- argument
// central du message, absent des vagues precedentes (21/08 et 23/08).
//
// Ciblage explicite par restaurant_id (jamais un "select tous les non revendiques") :
// les 5 restos WhatsApp-reessayables d'Alger (statut ULTRAMSG unsent/temporary_block
// au 23/08, donc numero valide mais envoi bloque) + Le Douar (ajoute le 26/08).
// Les 5 restos revenus `invalid` (pas de compte WhatsApp) sont volontairement exclus :
// l'utilisateur les appelle lui-meme.
//
// Throttle : 3 min entre chaque envoi (le compte a ete penalise pour envoi en rafale
// en aout, cf. memoire projet). Ne jamais reduire sans raison.
//
// Usage : node scripts/send-prospection-alger-26-08.js [--dry-run]

// Jamais de token en dur : ce repo est PUBLIC (github.com/redzoubiri-a11y/kairos).
// Fournir le token a l'execution : ULTRAMSG_TOKEN=xxx node scripts/...
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE_ID || 'instance184179';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const SITE_URL = 'https://web-resa.vercel.app';

if (!ULTRAMSG_TOKEN && !process.argv.includes('--dry-run')) {
  console.error('Erreur : variable ULTRAMSG_TOKEN manquante.');
  process.exit(1);
}
const DELAY_MS = 3 * 60 * 1000;
const DRY_RUN = process.argv.includes('--dry-run');

// Les six `claim_token` de cette liste ont ete committes en clair, dans un depot
// public -- exactement ce que la regle enoncee plus haut interdit. Ils ont ete
// tournes en base par scripts/rotate-claim-tokens.sql : les valeurs qui figuraient
// ici sont mortes, et n'ont donc plus rien a faire dans le fichier.
//
// Rejouer cette vague suppose de relire les jetons courants en base -- jamais de
// les recopier ici. Le motif correct est celui des scripts d'import :
//   select slug, claim_token from restaurants where id = ...
const TARGETS = [
  { name: 'Le Bardo',                  id: 'ceb17018-2789-4692-b6fa-afe9440206cd', phone: '+213 770 50 24 98', slug: 'le-bardo',                        token: null },
  { name: "Le Ciel d'Alger",           id: '9c9c116a-5df8-45ff-9c58-cbf08d792eb8', phone: '+213 561 66 75 63', slug: 'le-ciel-d-alger-by-az-hotels-kouba', token: null },
  { name: 'Restaurant El Djenina',     id: 'e72657cb-b82f-4066-ae01-094c94358f83', phone: '+213 773 41 77 65', slug: 'restaurant-el-djenina',            token: null },
  { name: 'Restaurant Signature',      id: '5109b09a-c080-44cc-9f50-e4cf7191ccf3', phone: '+213 799 30 87 66', slug: 'restaurant-signature',             token: null },
  { name: 'Restaurant Yulmaz',         id: '9965b694-e414-4d46-ba20-b4a2436928e1', phone: '+213 561 52 02 61', slug: 'restaurant-yulmaz-bent-bladi',     token: null },
  { name: 'Le Douar',                  id: '04ed2712-4c7b-4f89-886f-d2d74358165e', phone: '0558064097',        slug: 'le-douar',                         token: null },
];

// -- meme normalisation que supabase/functions/send-reminders/index.ts --
function algerianToInternational(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return '213' + digits.slice(1);
  return '213' + digits;
}

function buildMessage(name, url) {
  return `Bonjour 👋\n\n` +
    `Je suis Redouane, fondateur de *Mida* — l'application algérienne de réservation de restaurants, désormais disponible sur *Google Play* et l'*App Store*.\n\n` +
    `*${name}* y est déjà référencé. Je vous propose d'en prendre le contrôle, gratuitement :\n\n` +
    `✅ Réservations en ligne\n` +
    `📊 Tableau de bord : réservations, commandes à emporter, avis, promotions\n` +
    `🎁 *Gratuit jusqu'au 31 décembre 2026* — sans engagement, sans carte bancaire\n\n` +
    `Vous testez, vous décidez ensuite. Rien ne vous engage.\n\n` +
    `Activer votre compte :\n${url}\n\n` +
    `— Redouane, Mida`;
}

async function sendWhatsApp(phone, message) {
  const to = algerianToInternational(phone);
  const body = new URLSearchParams({ token: ULTRAMSG_TOKEN, to, body: message });
  const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  // Pieges vecus : res.ok est vrai meme instance deconnectee ; `sent` est une STRING.
  // Et meme "sent":"true" ne garantit pas la livraison -- le vrai statut arrive
  // plus tard via GET /messages (sent/queue/invalid/unsent + failed_reason).
  return { accepted: json.sent === 'true', id: json.id ?? null, raw: json };
}

// Un envoi avec token: null produirait six liens "?t=null" -- six restaurateurs
// qui cliquent et tombent sur une page morte. Mieux vaut ne pas partir.
const SANS_TOKEN = TARGETS.filter(t => !t.token).map(t => t.name);
if (SANS_TOKEN.length > 0) {
  console.error(
    `Erreur : jeton de revendication manquant pour ${SANS_TOKEN.join(', ')}.\n` +
    `Ils ont ete tournes (scripts/rotate-claim-tokens.sql). Relire les jetons\n` +
    `courants en base avant de rejouer cette vague.`,
  );
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const results = [];
  for (let i = 0; i < TARGETS.length; i++) {
    const t = TARGETS[i];
    const url = `${SITE_URL}/partenaire/${t.slug}?t=${t.token}`;
    const msg = buildMessage(t.name, url);
    const to = algerianToInternational(t.phone);

    if (DRY_RUN) {
      console.log(`[DRY] ${t.name} -> ${to}\n${msg}\n---`);
      results.push({ ...t, to, dry: true });
    } else {
      const r = await sendWhatsApp(t.phone, msg);
      console.log(`[${new Date().toISOString()}] ${t.name} -> ${to} : accepted=${r.accepted} msgId=${r.id}`);
      results.push({ name: t.name, restaurant_id: t.id, to, accepted: r.accepted, msgId: r.id });
    }

    if (i < TARGETS.length - 1 && !DRY_RUN) {
      console.log(`   ...attente ${DELAY_MS / 60000} min avant le suivant`);
      await sleep(DELAY_MS);
    }
  }
  console.log('\n=== RESUME ===');
  console.log(JSON.stringify(results, null, 2));
})();
