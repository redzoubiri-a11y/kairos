#!/usr/bin/env node
// Envoi WhatsApp scopé aux 15 restaurants dont le numéro vient d'être trouvé/ajouté
// le 23/08/2026 (12 confiance haute + 3 confiance moyenne à 2 sources concordantes).
// Contrairement à send-prospection-whatsapp.js (sélection large sur statut='envoyé'),
// ce script ne cible QUE les restaurant_id listés ci-dessous, pour ne jamais retenter
// les ~49 numéros déjà en échec (invalid/temporary_block) du 21/08.
// Throttle bien plus large que la campagne précédente (1.2s -> temporary_block en
// rafale) : espacement de plusieurs minutes entre chaque envoi.
//
// Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/send-prospection-batch-23-08.js [--dry-run]

const { createClient } = require('@supabase/supabase-js');

const RESTAURANT_IDS = [
  'c1f8a3dc-16fd-4887-b7d3-a33519299bb2', // L'hipponois
  '284408e2-b776-4516-a7b9-392cbc94e1f7', // La Petite Cabane
  'bb7916ed-fe3b-47a8-a3e5-d1116c061e5b', // Paradise House
  'cc709f61-14e2-496a-b0a7-41ade904dd14', // Restaurant Es-Salem Gastronomie (fixe)
  '08dcaef3-1677-4cf2-977e-2fc8e21c53fb', // Restaurant Le Rima
  'd332e9b3-7400-4c5f-a6de-d7c06d63c4ad', // Burger & Broast
  '1c62bd25-14a6-41c2-80f1-aa9537f9efb8', // Qadat Zman
  '1a5f17d6-91cf-47f0-9430-f8806637bac5', // TakeOff Lounge
  '75b75017-b42e-4dd1-b238-390871f92f2f', // La Comète (fixe)
  'c12d7046-49f5-4ce8-ba59-3e8e6275a4bb', // Naturalia Setif
  '34b53e5c-8bd8-4f97-bdd1-1c44ab4d194c', // Restaurant Bab El-Hara
  '81db50bd-9d80-432d-859c-e8616a3e45b9', // L'équinoxe
  '50e902c9-e96b-45a6-b4da-455af5c763e9', // Mega Pizza Saint Cloud
  '20080b18-77b1-4469-858c-0f93a30c91e7', // Restaurant Migusto (fixe)
  '77e7f705-09e7-4e0e-8d6a-2ab182ef3f48', // Ambiance Resto Café Hartoum
];

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rghjgyzpdadapmktislv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE_ID || 'instance184179';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || 'ap08eucof1ac1kb8';
const SITE_URL = 'https://web-resa.vercel.app';
const THROTTLE_MS = Number(process.env.THROTTLE_MS) || 180000; // 3 min par défaut
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_ROLE_KEY) {
  console.error('Erreur : variable SUPABASE_SERVICE_ROLE_KEY manquante.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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
  return { ok: json?.sent === true || json?.sent === 'true', raw: json };
}

async function main() {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, claim_token, phone, city_id, cities(name)')
    .in('id', RESTAURANT_IDS);
  if (error) throw error;

  console.log(`${restaurants.length} restaurants ciblés. Throttle: ${THROTTLE_MS}ms.`);
  if (DRY_RUN) console.log('--- DRY RUN : aucun message ne sera envoyé, aucune ligne prospection créée ---\n');

  let sent = 0, failed = 0;
  for (const r of restaurants) {
    const ville = r.cities?.name || 'inconnue';
    const url = `${SITE_URL}/revendiquer/${r.slug}?t=${r.claim_token}`;
    const message = buildMessage(r.name, url);

    if (DRY_RUN) {
      console.log(`[DRY] ${r.name} (${ville}) -> ${r.phone}\n${message}\n`);
      continue;
    }

    const { ok, raw } = await sendWhatsApp(r.phone, message);
    const now = new Date().toISOString();
    if (ok) {
      sent += 1;
      await supabase.from('prospection').insert({
        restaurant_id: r.id,
        ville,
        canal: 'whatsapp',
        statut: 'envoyé',
        date_envoi: now,
        notes: `WHATSAPP_OK ${now} (batch numéros trouvés 23/08/2026)`,
      });
      console.log(`✓ ${r.name} (${ville}) -> ${r.phone}`);
    } else {
      failed += 1;
      await supabase.from('prospection').insert({
        restaurant_id: r.id,
        ville,
        canal: 'whatsapp',
        statut: 'envoyé',
        notes: `ULTRAMSG_REJECTED ${now} ${JSON.stringify(raw)} (batch numéros trouvés 23/08/2026)`,
      });
      console.error(`✗ ${r.name} (${ville}) -> ${r.phone} :`, JSON.stringify(raw));
    }

    const isLast = r === restaurants[restaurants.length - 1];
    if (!isLast) await new Promise(res => setTimeout(res, THROTTLE_MS));
  }

  console.log(`\nEnvoi terminé : ${sent} envoyés, ${failed} échecs.`);
}

main().catch(e => { console.error(e); process.exit(1); });
