#!/usr/bin/env node
// Envoi WhatsApp (UltraMsg) des liens de revendication aux restaurateurs des fiches
// draft déjà répertoriées dans `prospection` (statut='envoyé', canal='whatsapp').
// Ne touche que les lignes dont le resto a un `phone` renseigné -- les autres restent
// en base pour un suivi manuel (pas de champ prospection pour "pas de tel").
// Marque chaque ligne envoyée avec succès via `notes` ("WHATSAPP_OK <horodatage>")
// pour ne jamais renvoyer deux fois le même message si le script est relancé.
//
// Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/send-prospection-whatsapp.js [--dry-run]

const { createClient } = require('@supabase/supabase-js');

// Même compte placeholder que src/hooks/useRestaurant.js (UNCLAIMED_OWNER_ID) --
// le critère d'envoi est "pas encore revendiqué", pas "status=draft" : ces fiches
// ont été basculées en status='active' pour l'affichage client sans être revendiquées.
const UNCLAIMED_OWNER_ID = '00000000-0000-0000-0000-000000000099';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rghjgyzpdadapmktislv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE_ID || 'instance184179';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN; // repo PUBLIC : jamais de token en dur
const SITE_URL = 'https://web-resa.vercel.app';
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_ROLE_KEY) {
  console.error('Erreur : variable SUPABASE_SERVICE_ROLE_KEY manquante.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// -- même normalisation que supabase/functions/send-reminders/index.ts --
function algerianToInternational(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return '213' + digits.slice(1);
  return '213' + digits;
}

function buildMessage(name, url) {
  return `Bonjour 👋\n\n` +
    `Votre établissement *${name}* a été référencé sur Mida, la nouvelle appli algérienne de réservation de restaurants.\n\n` +
    `Confirmez ou corrigez les informations de votre fiche (aucune inscription requise) :\n${url}\n\n` +
    `— L'équipe Mida`;
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
  // Piège vécu (2026-08-20) : res.ok (HTTP 200) est vrai même quand l'instance
  // n'est pas connectée à WhatsApp -- ne jamais s'y fier seul.
  // Piège vécu (2026-08-21) : `sent` est une STRING "true"/"false", pas un
  // booléen -- et même "sent":"true" ne garantit pas la livraison réelle
  // (l'API accepte juste la demande ; le vrai statut arrive plus tard dans
  // GET /messages : sent/queue/invalid/unsent). Considérer "accepté par
  // l'API" comme un succès d'ENVOI ici ; le vrai suivi de livraison se fait
  // séparément via GET /messages (cf. reconciliation manuelle du 2026-08-21).
  return { ok: json?.sent === true || json?.sent === 'true', raw: json };
}

async function main() {
  const { data: rows, error } = await supabase
    .from('prospection')
    .select('id, ville, statut, notes, restaurants!restaurant_id (id, name, slug, claim_token, phone, owner_id)')
    .eq('statut', 'envoyé')
    .eq('canal', 'whatsapp');
  if (error) throw error;

  const candidates = (rows || []).filter(r =>
    r.restaurants?.owner_id === UNCLAIMED_OWNER_ID &&
    r.restaurants?.phone &&
    !(r.notes || '').includes('WHATSAPP_OK'),
  );

  console.log(`${candidates.length} restaurants avec téléphone, jamais contactés (sur ${rows.length} lignes prospection 'envoyé').`);
  if (DRY_RUN) console.log('--- DRY RUN : aucun message ne sera envoyé ---\n');

  let sent = 0, failed = 0;
  for (const row of candidates) {
    const r = row.restaurants;
    const url = `${SITE_URL}/revendiquer/${r.slug}?t=${r.claim_token}`;
    const message = buildMessage(r.name, url);

    if (DRY_RUN) {
      console.log(`[DRY] ${r.name} (${row.ville}) -> ${r.phone}\n${message}\n`);
      continue;
    }

    const { ok, raw } = await sendWhatsApp(r.phone, message);
    if (ok) {
      sent += 1;
      const note = `${row.notes ? row.notes + ' | ' : ''}WHATSAPP_OK ${new Date().toISOString()}`;
      await supabase.from('prospection').update({ date_envoi: new Date().toISOString(), notes: note }).eq('id', row.id);
      console.log(`✓ ${r.name} (${row.ville}) -> ${r.phone}`);
    } else {
      failed += 1;
      console.error(`✗ ${r.name} (${row.ville}) -> ${r.phone} :`, JSON.stringify(raw));
    }
    await new Promise(res => setTimeout(res, 1200)); // throttle -- éviter un ban UltraMsg
  }

  console.log(`\n${DRY_RUN ? 'Simulation' : 'Envoi'} terminé : ${DRY_RUN ? candidates.length : sent} traités, ${failed} échecs.`);
}

main().catch(e => { console.error(e); process.exit(1); });
