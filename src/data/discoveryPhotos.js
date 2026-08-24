// Photos des tuiles "Quartiers populaires" / "Cuisines populaires" de l'Accueil.
// Réutilise les photos déjà présentes en base (uploadées par les restaurateurs
// ou déjà attribuées lors de l'onboarding), une par quartier/cuisine — pas de
// nouvel hébergement, pas de photo générique hors du catalogue existant.
// Si un quartier/une cuisine n'a pas d'entrée ici (aucun restaurant actif avec
// photo dans ce groupe), la tuile retombe sur son dégradé de couleur (TILE_GRADIENTS).

export const QUARTIER_PHOTOS = {
  // 150 Logements Naceria (Béjaïa) : salle de Restaurant Atbaq (source Evendo,
  // hébergée en interne le 24/08/2026) — aucun resto de ce quartier n'a de
  // photo en base actuellement.
  '150 Logements Naceria': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/150-logements-naceria.jpg',
  'Agadir': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'Ain El Kébira': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  // Ain Sebaa (Tlemcen) : salle de banquet de L'équinoxe (source site officiel
  // du resto, hébergée en interne le 24/08/2026).
  'Ain Sebaa': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/ain-sebaa.jpg',
  'Aïn Turk': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Alger': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'Annaba Centre': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  // Bab El Kantara (Constantine) : salle de Fast Food le Coq d'or (source
  // winrouh.com via navigateur, hébergée en interne le 24/08/2026).
  'Bab El Kantara': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/bab-el-kantara.jpg',
  'Bab El Oued': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'Béjaïa': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Béjaïa Centre': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  // Belle Vue (Constantine) : façade du Tropical Lounge (source winrouh.com via
  // navigateur, hébergée en interne le 24/08/2026).
  'Belle Vue': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/belle-vue.jpg',
  'Ben Aknoun': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'Ben Yahia': 'https://images.unsplash.com/photo-1552566626-52f8b828a9b4?w=800&q=80',
  'Bir El Djir': 'https://images.unsplash.com/photo-1482049016688-2d3e1685571?w=800&q=80',
  'Bir Mourad Raïs': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  'Casbah': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Centre': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/279427d4-ca04-47b4-a067-d5500ba96e89/facade.jpeg',
  'Centre Sétif': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'Centre-ville': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  // Chenoua (Tipaza) : plat de poisson grillé du Romarin (déjà en base, photo
  // recadrée le 24/08/2026 pour la tuile quartier).
  'Chenoua': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/chenoua.jpg',
  'Cheraga': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'Chéraga': 'https://images.unsplash.com/photo-1621996346565-b53e2a66a6a1?w=800&q=80',
  // Cité 5 Juillet (Tizi Ouzou) : entrée décorée du Mystic (source TripAdvisor,
  // hébergée en interne le 24/08/2026).
  'Cité 5 Juillet': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-5-juillet.jpg',
  // Cité 600 Logements (Sétif) : salle de Naturalia Setif (source winrouh.com
  // via navigateur, hébergée en interne le 24/08/2026).
  'Cité 600 Logements': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-600-logements.jpg',
  // Cité Amara Youcef (Blida) : calamars frits du Grand Bleu (source blog
  // dédié, hébergée en interne le 24/08/2026).
  'Cité Amara Youcef': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-amara-youcef.jpg',
  // Cité des 750 Logements (Sétif) : plateau indien du Restaurant Maharaja
  // (source Evendo, hébergée en interne le 24/08/2026).
  'Cité des 750 Logements': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-750-logements.jpg',
  // Cité Dallas (Sétif) : pizza au four à bois de Pizza Pino Sétif (source
  // TripAdvisor, hébergée en interne le 24/08/2026).
  'Cité Dallas': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-dallas.jpg',
  // Cité Rizi Omar (Annaba) : terrasse bord de mer de Bigben Town (source
  // TripAdvisor, hébergée en interne le 24/08/2026).
  'Cité Rizi Omar': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/cite-rizi-omar.jpg',
  'Corniche': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Daksi': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'Dely Ibrahim': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'Didouche Mourad': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'Eckmuhl': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'El Biar': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'El Bouni': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'El Eulma': 'https://images.unsplash.com/photo-1482049016688-2d3e1685571?w=800&q=80',
  'El Kantara': 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800&q=80',
  // El Madania : photo de la salle de Restaurant El Boustene (source TripAdvisor,
  // recadrée/hébergée en interne le 24/08/2026) — aucun resto d'El Madania n'a
  // de photo en base actuellement.
  'El Madania': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/el-madania.jpg',
  'Faubourg Lamy': 'https://images.unsplash.com/photo-1482049016688-2d3e1685571?w=800&q=80',
  // Gambetta (Oran) : dîner en terrasse au bord de la piscine de Villa Riviera
  // (source Evendo, hébergée en interne le 24/08/2026).
  'Gambetta': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/gambetta.jpg',
  'Hasnaoua': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'Hussein Dey': 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
  // Hydra : photo de L'Assiette Royale (assiette + enseigne resto, recadrée pour
  // retirer le texte de marque, source Instagram, hébergée en interne le
  // 24/08/2026) — remplace l'ancienne entrée Darmak'a retirée le 18/08/2026
  // (capture de pub Facebook, pas une vraie photo).
  'Hydra': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/hydra.jpg',
  // Kouba : vue nocturne d'Alger depuis le rooftop du Ciel d'Alger (source
  // TripAdvisor, recadrée pour retirer le logo AZ Hôtels, hébergée en interne
  // le 24/08/2026) — aucun resto de Kouba n'a de photo en base actuellement.
  // Kiffane (Tlemcen) : brochettes grillées de Seb's Garden (source Evendo,
  // hébergée en interne le 24/08/2026).
  'Kiffane': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/kiffane.jpg',
  'Kouba': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/kouba.jpg',
  'La Corniche': 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
  'Lalla Setti': 'https://images.unsplash.com/photo-1552566626-52f8b828a9b4?w=800&q=80',
  'Le Plateau': 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
  'Les Falaises': 'https://images.unsplash.com/photo-1571167366136-b57658cfd04a?w=800&q=80',
  'Mansourah': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Médina': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  'Médina Jedida': 'https://images.unsplash.com/photo-1544025162-d76538f0b1ea?w=800&q=80',
  'Nouvelle Ville': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'Oued Aïssi': 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
  // Parc d'Attraction (Sétif) : arche d'entrée ouvragée de Bab El-Hara (source
  // Evendo, recadrée pour retirer l'affichage encombré des bords, hébergée en
  // interne le 24/08/2026).
  "Parc d'Attraction": 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/parc-attraction-setif.jpg',
  'Parc de Loisirs': 'https://cdn.res-discover.com/fontaine-dor/26241-albums-4.jpg',
  'Pins Maritimes': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  "Port d'Annaba": 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
  'Port de Béjaïa': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'Port de Tipaza': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/065b32c3-5cf9-4711-aa6f-274e9fcfcd20/1.jpg',
  // Seddikia (Oran) : dessert gastronomique du Ciel D'Oran (source TripAdvisor,
  // hébergée en interne le 24/08/2026).
  'Seddikia': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/seddikia.jpg',
  'Seraïdi': 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
  // Sghir (Béjaïa) : salle décorée de plantes suspendues de L'Oiseau Bleu
  // (source Google Maps via navigateur, hébergée en interne le 24/08/2026).
  'Sghir': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/sghir.jpg',
  'Sétif': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'Sétif Nouvelle Ville': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Sid Abdellah': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/5144eb48-1262-443f-ad06-0b77c4f8f8a5/1781380281588.jpg',
  'Sidi Ahmed': 'https://images.unsplash.com/photo-1552566626-52f8b828a9b4?w=800&q=80',
  'Sidi El Houari': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
  'Sidi Fredj': 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80',
  // Sidi Hamed (Tlemcen) : plat de viande grillée du Loft (source Evendo,
  // hébergée en interne le 24/08/2026).
  'Sidi Hamed': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/sidi-hamed.jpg',
  "Sidi M'Cid": 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  // Sidi M'Hamed : salle du Bardo (source restoalgerie.com, hébergée en interne
  // le 24/08/2026) — aucun resto de Sidi M'Hamed n'a de photo en base actuellement.
  "Sidi M'Hamed": 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/sidi-mhamed.jpg',
  // Sidi Mabrouk (Constantine) : comptoir de Piano Piano Food (source Evendo,
  // hébergée en interne le 24/08/2026).
  'Sidi Mabrouk': 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/quartier-tiles/sidi-mabrouk.jpg',
  'Tichy': 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
  'Tlemcen': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Tlemcen Centre': 'https://images.unsplash.com/photo-1580227974546-7d1bba4fd71a?w=800&q=80',
  'Zouaghi': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
};

// Une photo par cuisine réellement présente en base (photo de plat pour évoquer
// la cuisine plutôt qu'un lieu). "asiatique" absent : aucun restaurant actif de
// cette cuisine aujourd'hui, donc jamais affiché tant que ça reste vrai.
export const CUISINE_PHOTOS = {
  algerien: 'https://rghjgyzpdadapmktislv.supabase.co/storage/v1/object/public/restaurant-photos/279427d4-ca04-47b4-a067-d5500ba96e89/platsignature3.jpeg',
  mediterraneen: 'https://cdn.res-discover.com/fontaine-dor/26241-albums-4.jpg',
  italien: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  turc: 'https://images.unsplash.com/photo-1571167366136-b57658cfd04a?w=800&q=80',
  libanais: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80',
  francais: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  fast_casual: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  autre: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
};
