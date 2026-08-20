#!/usr/bin/env node
// Import des restaurants d'Alger (TripAdvisor + Google Places) en fiches "draft"
// avec lien de revendication. Exclus (identite/adresse pas assez fiable, decision utilisateur du 2026-08-20) :
//   - rank 20 "Turquoise" : pas de google_place_id fiable
//   - rank 12 "Havana" : plusieurs succursales a Alger, adresse ambigue (note source)
//   - rank 17 "Safran Paella (Tapas)" : adresse "Tour n°1, Alger" trop vague, pas de quartier identifiable
//
// Mapping des colonnes verifie contre le schema reel de `restaurants` (audit du 2026-08-20)
// et l'usage reel du code (grep src/ screens/) -- pas de champ invente :
//   - `location` (postgis) et `neighborhood` : colonnes mortes, jamais lues par l'app -> ignorees
//   - `quartier` : champ texte libre reellement utilise partout (RestaurantCard, useSearch, etc.)
//   - `opening_hours` : format {day:0-6, open:"HH:MM", close:"HH:MM"}[] impose par
//     src/utils/openingHours.js (fmtHours/isOpenNow/mvpSlots) -- UN SEUL creneau par jour
//     (limitation deja documentee dans ce fichier). Pour les horaires multi-creneaux
//     (pause dejeuner), on prend min(open) -> max(close) de la journee.
//   - avg_rating/review_count : jamais remplis (consigne explicite -- pas de notes
//     TripAdvisor/Google dans les colonnes de notation Mida). Pas de colonne `external_rating`
//     dans le schema actuel -> les notes sources sont donc entierement ignorees, pas stockees.
//   - avg_ticket/capacity : pas de donnee source fiable (price_level n'est pas un montant DZD) -> 0 par defaut.
//
// Idempotence : upsert sur google_place_id. Sur un restaurant deja existant, on ne
// rafraichit QUE les champs factuels (nom/adresse/tel/cuisine/horaires/coords) -- jamais
// status/owner_id/claim_token/slug, pour ne pas ecraser une fiche deja revendiquee/editee
// par un restaurateur entre deux runs.
//
// Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-restaurants-alger.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rghjgyzpdadapmktislv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Erreur : variable SUPABASE_SERVICE_ROLE_KEY manquante.');
  console.error('Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-restaurants-alger.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DATA_PATH = path.join(__dirname, '../data/top20_restaurants_alger.json');
const UNCLAIMED_OWNER_ID = '00000000-0000-0000-0000-000000000099';

// -- cuisine_type : valeurs enum reelles en base (audit 2026-08-20) --
const CUISINE_ENUM = ['algerien', 'mediterraneen', 'italien', 'asiatique', 'turc', 'libanais', 'francais', 'fast_casual', 'autre'];
const CUISINE_MAP = {
  'algerien': 'algerien', 'algérien': 'algerien',
  'mediterraneenne': 'mediterraneen', 'méditerranéenne': 'mediterraneen',
  'italienne': 'italien',
  'asiatique': 'asiatique', 'indienne': null, // "Indienne" seule ne matche rien -> laisse le tag suivant decider
  'turque': 'turc',
  'libanaise': 'libanais',
  'francaise': 'francais', 'française': 'francais',
  'fast casual': 'fast_casual', 'rapide': 'fast_casual',
};

function mapCuisineType(cuisineTags) {
  for (const tag of cuisineTags || []) {
    const key = tag.toLowerCase().trim();
    const mapped = CUISINE_MAP[key];
    if (mapped && CUISINE_ENUM.includes(mapped)) return mapped;
  }
  return 'autre';
}

// -- quartier : extrait explicitement de l'adresse source (pas de regex generique --
//    verifie manuellement restaurant par restaurant contre l'adresse fournie). --
const QUARTIER_BY_RANK = {
  1: 'Ben Aknoun', 2: "Sidi M'Hamed", 3: 'Kouba', 4: 'El Biar', 5: 'Belouizdad',
  6: 'Bir Mourad Raïs', 7: 'El Madania', 8: 'Hydra', 9: 'Kouba', 10: "Sidi M'Hamed",
  11: 'El Madania', 12: 'Bab Ezzouar', 13: "Sidi M'Hamed", 14: 'El Madania', 15: 'Rouiba',
  16: 'Alger Centre', 17: '', 18: 'Hydra', 19: 'Hydra',
  // 17 (Safran Paella) : adresse "Tour n°1, Alger" ne precise aucun quartier -> laisse vide.
};

// -- opening_hours : {monday: "11:30-23:30", ...} (source) -> [{day, open, close}] (app) --
const DAY_TO_JS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function convertOpeningHours(oh) {
  if (!oh) return [];
  const out = [];
  for (const [dayName, value] of Object.entries(oh)) {
    if (!(dayName in DAY_TO_JS)) continue;
    if (!value || /ferm[ée]/i.test(value)) continue; // jour ferme -> pas d'entree
    // "12:00-14:30, 19:00-22:30" (multi-creneaux) -> min(open) / max(close) de la journee
    // (limitation deja documentee dans src/utils/openingHours.js : un seul creneau/jour supporte)
    const segments = value.split(',').map(s => s.trim());
    let minOpen = null, maxClose = null;
    for (const seg of segments) {
      const m = seg.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (!m) continue;
      const [, open, close] = m;
      if (minOpen === null || open < minOpen) minOpen = open;
      if (maxClose === null || close > maxClose) maxClose = close;
    }
    if (minOpen && maxClose) out.push({ day: DAY_TO_JS[dayName], open: minOpen, close: maxClose });
  }
  return out;
}

function slugify(name) {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base, takenSlugs) {
  let slug = base || 'restaurant';
  let n = 2;
  while (takenSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  takenSlugs.add(slug);
  return slug;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const EXCLUDED_RANKS = [20, 12, 17]; // Turquoise, Havana, Safran Paella -- voir commentaire en tete de fichier
  const restaurants = raw.filter(r => !EXCLUDED_RANKS.includes(r.rank));

  const { data: existingRestaurants, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, slug, google_place_id');
  if (fetchErr) throw fetchErr;

  const takenSlugs = new Set(existingRestaurants.map(r => r.slug).filter(Boolean));
  const byPlaceId = new Map(existingRestaurants.filter(r => r.google_place_id).map(r => [r.google_place_id, r]));

  const results = [];

  for (const r of restaurants) {
    const cuisine_type = mapCuisineType(r.cuisine);
    const quartier = QUARTIER_BY_RANK[r.rank] ?? '';
    const opening_hours = convertOpeningHours(r.opening_hours);
    const phone = r.phone || '';

    const existing = byPlaceId.get(r.google_place_id);

    if (existing) {
      // Deja importe : rafraichit uniquement les champs factuels, jamais
      // status/owner_id/claim_token/slug/source (voir commentaire d'idempotence en tete de fichier).
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: r.name,
          address: r.address,
          quartier,
          phone,
          cuisine_type,
          opening_hours,
          latitude: r.latitude,
          longitude: r.longitude,
        })
        .eq('id', existing.id)
        .select('id, slug, claim_token')
        .single();
      if (error) throw error;
      results.push({ name: r.name, slug: data.slug, claim_token: data.claim_token, action: 'updated' });
      continue;
    }

    const slug = await uniqueSlug(slugify(r.name), takenSlugs);

    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: UNCLAIMED_OWNER_ID,
        name: r.name,
        address: r.address,
        quartier,
        phone,
        cuisine_type,
        opening_hours,
        latitude: r.latitude,
        longitude: r.longitude,
        city: 'alger',
        status: 'draft',
        source: 'google_places',
        google_place_id: r.google_place_id,
        slug,
      })
      .select('id, slug, claim_token')
      .single();
    if (error) throw error;
    results.push({ name: r.name, slug: data.slug, claim_token: data.claim_token, action: 'inserted' });
  }

  const SITE_URL = 'https://mida-food.com';
  console.log('\nnom | slug | claim_token | URL de revendication | action');
  console.log('----|------|-------------|------------------------|-------');
  for (const row of results) {
    const url = `${SITE_URL}/r/${row.slug}?t=${row.claim_token}`;
    console.log(`${row.name} | ${row.slug} | ${row.claim_token} | ${url} | ${row.action}`);
  }
  console.log(`\n${results.length} restaurants traites (${results.filter(r => r.action === 'inserted').length} inseres, ${results.filter(r => r.action === 'updated').length} deja existants/rafraichis).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
