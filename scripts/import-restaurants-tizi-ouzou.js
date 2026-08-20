#!/usr/bin/env node
// Import des restaurants de Tizi Ouzou (recherche web -- TripAdvisor + sites d'annuaire locaux,
// PAS d'API Google Places disponible pour cette session) en fiches "draft" avec lien de
// revendication. Meme structure que scripts/import-restaurants-oran.js, adaptee :
//
//   - Pas de google_place_id reel -> toujours null, idempotence par slug genere (voir
//     commentaire equivalent dans import-restaurants-oran.js).
//   - Restaurants exclus de la recherche (adresse ambigue/introuvable ou identite douteuse,
//     meme critere que Alger/Oran/Constantine) : "El Padré" (pas d'adresse trouvee), "Restaurant
//     de la Kabylie" (adresse decrite comme "confidentielle", introuvable), "Mario Pizza"
//     (pas d'adresse trouvee), "Limoncello" (pâtisserie, pas un restaurant, adresse relative
//     uniquement -- "boulevard Krim Belkacem a cote du nouveau CASNOS"), "Melyza Tacos"
//     (adresse relative uniquement -- "a cote de Tafsut Travel", pas de rue), "Thawenza"
//     (aucune adresse trouvee, decrit comme lieu "confidentiel"), "Boston Street Tizi-Ouzou"
//     (chaine multi-succursales -- seule l'adresse de la succursale d'Azazga, commune
//     differente, a ete trouvee avec certitude ; ambigu pour la succursale de Tizi Ouzou meme).
//
// Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-restaurants-tizi-ouzou.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rghjgyzpdadapmktislv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Erreur : variable SUPABASE_SERVICE_ROLE_KEY manquante.');
  console.error('Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-restaurants-tizi-ouzou.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DATA_PATH = path.join(__dirname, '../data/top_restaurants_tizi_ouzou.json');
const UNCLAIMED_OWNER_ID = '00000000-0000-0000-0000-000000000099';

const CUISINE_ENUM = ['algerien', 'mediterraneen', 'italien', 'asiatique', 'turc', 'libanais', 'francais', 'fast_casual', 'autre'];
const CUISINE_MAP = {
  'algerien': 'algerien', 'algérien': 'algerien',
  'mediterraneenne': 'mediterraneen', 'méditerranéenne': 'mediterraneen', 'mediterraneen': 'mediterraneen', 'méditerranéen': 'mediterraneen',
  'italienne': 'italien', 'italien': 'italien',
  'asiatique': 'asiatique',
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

const DAY_TO_JS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function convertOpeningHours(oh) {
  if (!oh) return [];
  const out = [];
  for (const [dayName, value] of Object.entries(oh)) {
    if (!(dayName in DAY_TO_JS)) continue;
    if (!value || /ferm[ée]/i.test(value)) continue;
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
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
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
  const restaurants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  const { data: existingRestaurants, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, slug, name');
  if (fetchErr) throw fetchErr;

  const takenSlugs = new Set(existingRestaurants.map(r => r.slug).filter(Boolean));
  const bySlugBase = new Map(existingRestaurants.filter(r => r.slug).map(r => [r.slug, r]));

  const results = [];

  for (const r of restaurants) {
    const cuisine_type = mapCuisineType(r.cuisine);
    const quartier = r.quartier || '';
    const opening_hours = convertOpeningHours(r.opening_hours);
    const phone = r.phone || '';
    const slugBase = slugify(r.name);

    const existing = bySlugBase.get(slugBase);

    if (existing) {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ name: r.name, address: r.address, quartier, phone, cuisine_type, opening_hours, latitude: r.latitude, longitude: r.longitude })
        .eq('id', existing.id)
        .select('id, slug, claim_token')
        .single();
      if (error) throw error;
      results.push({ name: r.name, slug: data.slug, claim_token: data.claim_token, action: 'updated' });
      continue;
    }

    const slug = await uniqueSlug(slugBase, takenSlugs);

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
        city: 'tizi-ouzou',
        status: 'draft',
        source: 'tripadvisor',
        google_place_id: null,
        slug,
      })
      .select('id, slug, claim_token')
      .single();
    if (error) throw error;
    results.push({ name: r.name, slug: data.slug, claim_token: data.claim_token, action: 'inserted' });
  }

  const SITE_URL = 'https://web-resa.vercel.app';
  console.log('\nnom | slug | claim_token | URL de revendication | action');
  console.log('----|------|-------------|------------------------|-------');
  for (const row of results) {
    const url = `${SITE_URL}/revendiquer/${row.slug}?t=${row.claim_token}`;
    console.log(`${row.name} | ${row.slug} | ${row.claim_token} | ${url} | ${row.action}`);
  }
  console.log(`\n${results.length} restaurants traites (${results.filter(r => r.action === 'inserted').length} inseres, ${results.filter(r => r.action === 'updated').length} deja existants/rafraichis).`);
}

main().catch(err => { console.error(err); process.exit(1); });
