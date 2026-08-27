// Jeu de données de démonstration — salles des fêtes algériennes.
//
// Les coordonnées situent le quartier mentionné dans l'adresse, pas un
// bâtiment : les salles sont fictives. Elles suffisent à calculer une
// distance réaliste depuis la position de l'utilisateur.
// Utilisé par l'adaptateur local quand Supabase n'est pas configuré.
// Les photos viennent de photos.json ; à défaut, les cartes affichent un
// dégradé déterministe (§4.1) et l'app reste utilisable hors ligne.

import { toISODate, addDays, todayISO } from '../lib/format';
import { SUBSCRIPTION_PRICE, PARTNER_SUBSCRIPTION_PRICES } from '../lib/constants';
import photoManifest from './photos.json';
import { localPhotosOf } from './photosLocales';

/**
 * Photos réelles des salles de démonstration : d'abord celles embarquées dans
 * `assets/salles/` (photosLocales.js), puis les URL de photos.json. Sans
 * aucune des deux, la salle s'affiche avec le dégradé de repli (§4.1) et
 * l'app reste utilisable hors ligne.
 */
function photosOf(salleId) {
  return [...localPhotosOf(salleId), ...(photoManifest?.salles?.[salleId]?.urls ?? [])];
}

const T = todayISO();

export const SEED_SALLES = [
  {
    id: 'salle-001',
    owner_id: 'user-pro-001',
    name: 'Salle El Widad',
    city: 'Alger',
    address: 'Rue des Frères Bouadou, Bir Mourad Raïs, Alger',
    capacity_max: 450,
    parking_places: 80,
    description:
      "Située au cœur de Bir Mourad Raïs, la salle El Widad accueille vos mariages et fiançailles depuis 2008. Grande piste de danse, éclairage scénique, loge climatisée pour la mariée et terrasse panoramique pour les photos.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'terrasse', 'traiteur'],
    photos: photosOf('salle-001'),
    latitude: 36.735,
    longitude: 3.053,
    status: 'active',
    is_premium: true,
    rating: 4.8,
    reviews_count: 127,
    created_at: '2026-01-12T09:00:00Z',
  },
  {
    id: 'salle-002',
    // Deuxième salle du compte de démonstration : le pro en gère deux.
    owner_id: 'user-pro-001',
    name: 'Espace Andalous',
    city: 'Alger',
    address: 'Route de Chéraga, Dely Ibrahim, Alger',
    capacity_max: 300,
    parking_places: 50,
    description:
      "Un décor mauresque authentique : zellige, plafonds sculptés et patio central. Idéal pour les fiançailles et les cérémonies intimistes. Notre chef propose un menu traditionnel algérois.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'traiteur', 'wifi'],
    photos: photosOf('salle-002'),
    latitude: 36.757,
    longitude: 2.97,
    status: 'active',
    is_premium: false,
    rating: 4.6,
    reviews_count: 84,
    created_at: '2026-02-03T09:00:00Z',
  },
  {
    id: 'salle-003',
    owner_id: 'user-pro-003',
    name: 'Palais Ryad',
    city: 'Oran',
    address: 'Boulevard Millénium, Bir El Djir, Oran',
    capacity_max: 700,
    parking_places: 150,
    description:
      "La plus grande salle de l'Oranie. Deux niveaux, scène modulable, système son professionnel et parking sécurisé. Notre équipe gère votre événement de A à Z.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'terrasse', 'pmr', 'traiteur', 'wifi'],
    photos: photosOf('salle-003'),
    latitude: 35.702,
    longitude: -0.61,
    status: 'active',
    is_premium: true,
    rating: 4.9,
    reviews_count: 203,
    created_at: '2025-11-20T09:00:00Z',
  },
  {
    id: 'salle-004',
    owner_id: 'user-pro-004',
    name: 'Salle Ennour',
    city: 'Constantine',
    address: 'Cité Zouaghi Slimane, Constantine',
    capacity_max: 250,
    parking_places: 40,
    description:
      "Salle familiale chaleureuse, rénovée en 2025. Parfaite pour les anniversaires et les petites réceptions. Cuisine équipée mise à disposition des traiteurs extérieurs.",
    amenities: ['clim', 'cuisine', 'parking', 'pmr'],
    photos: photosOf('salle-004'),
    latitude: 36.34,
    longitude: 6.62,
    status: 'active',
    is_premium: false,
    rating: 4.3,
    reviews_count: 41,
    created_at: '2026-03-15T09:00:00Z',
  },
  {
    id: 'salle-005',
    owner_id: 'user-pro-005',
    name: 'Dar El Ferah',
    city: 'Blida',
    address: 'Route de Soumaa, Blida',
    capacity_max: 380,
    parking_places: 60,
    description:
      "Entourée d'orangers, Dar El Ferah offre un cadre verdoyant unique dans la Mitidja. Jardin extérieur pour la cérémonie, salle climatisée pour le dîner.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'terrasse', 'traiteur'],
    photos: photosOf('salle-005'),
    latitude: 36.46,
    longitude: 2.83,
    status: 'active',
    is_premium: false,
    rating: 4.7,
    reviews_count: 96,
    created_at: '2026-01-28T09:00:00Z',
  },
  {
    id: 'salle-006',
    owner_id: 'user-pro-006',
    name: 'Complexe Es-Salam',
    city: 'Sétif',
    address: 'Avenue du 8 Mai 1945, Sétif',
    capacity_max: 520,
    parking_places: 100,
    description:
      "Complexe moderne avec deux salles indépendantes, permettant d'accueillir simultanément la réception des hommes et celle des femmes selon la tradition.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'pmr', 'wifi'],
    photos: photosOf('salle-006'),
    latitude: 36.19,
    longitude: 5.41,
    status: 'active',
    is_premium: true,
    rating: 4.5,
    reviews_count: 118,
    created_at: '2025-12-05T09:00:00Z',
  },
  {
    id: 'salle-007',
    owner_id: 'user-pro-007',
    name: 'Salle Tafath',
    city: 'Tizi Ouzou',
    address: 'Nouvelle Ville, Tizi Ouzou',
    capacity_max: 320,
    parking_places: 55,
    description:
      "Salle kabyle traditionnelle revisitée. Espace scénique pour les troupes folkloriques, vestiaires spacieux et service de décoration intégré.",
    amenities: ['clim', 'cuisine', 'sono', 'parking', 'terrasse'],
    photos: photosOf('salle-007'),
    latitude: 36.715,
    longitude: 4.045,
    status: 'active',
    is_premium: false,
    rating: 4.4,
    reviews_count: 63,
    created_at: '2026-04-02T09:00:00Z',
  },
  {
    id: 'salle-008',
    owner_id: 'user-pro-008',
    name: 'Le Corail',
    city: 'Annaba',
    address: 'Front de mer, Seraïdi Road, Annaba',
    capacity_max: 280,
    parking_places: 45,
    description:
      "Vue directe sur la Méditerranée. Terrasse pour le cocktail au coucher du soleil, salle intérieure entièrement vitrée. Réservation conseillée 6 mois à l'avance.",
    amenities: ['clim', 'sono', 'parking', 'terrasse', 'traiteur', 'wifi'],
    photos: photosOf('salle-008'),
    latitude: 36.9,
    longitude: 7.755,
    status: 'active',
    is_premium: true,
    rating: 4.8,
    reviews_count: 152,
    created_at: '2025-10-11T09:00:00Z',
  },
  {
    id: 'salle-009',
    owner_id: 'user-pro-009',
    name: 'Salle El Feth',
    city: 'Tipaza',
    address: 'Route Nationale 11, Tipaza',
    capacity_max: 200,
    parking_places: 35,
    description:
      "À dix minutes des ruines romaines, une salle à taille humaine pour vos fiançailles et anniversaires. Formule tout compris avec pâtisserie traditionnelle.",
    amenities: ['clim', 'cuisine', 'parking', 'terrasse'],
    photos: photosOf('salle-009'),
    latitude: 36.59,
    longitude: 2.448,
    status: 'active',
    is_premium: false,
    rating: 4.2,
    reviews_count: 29,
    created_at: '2026-05-19T09:00:00Z',
  },
  {
    id: 'salle-010',
    owner_id: 'user-pro-010',
    name: 'Résidence Ibn Khaldoun',
    city: 'Alger',
    address: 'Rue Hassiba Ben Bouali, Alger Centre',
    capacity_max: 600,
    parking_places: 120,
    description:
      "Salle de conférence et de réception au centre d'Alger. Équipement audiovisuel professionnel, régie, traduction simultanée disponible sur demande.",
    amenities: ['clim', 'sono', 'parking', 'pmr', 'wifi', 'traiteur'],
    photos: photosOf('salle-010'),
    latitude: 36.764,
    longitude: 3.056,
    status: 'active',
    is_premium: false,
    rating: 4.5,
    reviews_count: 77,
    created_at: '2026-02-22T09:00:00Z',
  },
  {
    id: 'salle-011',
    owner_id: 'user-pro-011',
    name: 'Salle Ryad El Feth',
    city: 'Boumerdès',
    address: 'Route de Corso, Boumerdès',
    capacity_max: 260,
    parking_places: 30,
    description:
      "Salle récemment ouverte, à quinze minutes de la plage. Décoration moderne, cuisine attenante et espace enfants séparé.",
    amenities: ['clim', 'cuisine', 'parking'],
    photos: photosOf('salle-011'),
    latitude: 36.766,
    longitude: 3.477,
    // En attente de validation par l'équipe (§5.5) : invisible côté client
    status: 'pending',
    is_premium: false,
    rating: null,
    reviews_count: 0,
    created_at: `${addDays(T, -1)}T11:00:00Z`,
  },
];

// §4.3.6 — trois formules par salle
export const SEED_TARIFS = SEED_SALLES.flatMap((s, i) => {
  const base = [35000, 30000, 55000, 25000, 38000, 42000, 33000, 48000, 28000, 40000, 32000][i];
  return [
    {
      id: `tarif-${s.id}-1`,
      salle_id: s.id,
      name: 'Location salle seule',
      description: 'Salle, tables, chaises et nettoyage inclus.',
      price: base,
      sort_order: 0,
    },
    {
      id: `tarif-${s.id}-2`,
      salle_id: s.id,
      name: 'Salle + Traiteur',
      description: 'Location, service et menu complet pour vos invités.',
      price: Math.round(base * 1.57),
      sort_order: 1,
    },
    {
      id: `tarif-${s.id}-3`,
      salle_id: s.id,
      name: 'Tout inclus',
      description: 'Traiteur, décoration, sonorisation, photographe et pâtisserie.',
      price: Math.round(base * 2.14),
      sort_order: 2,
    },
  ];
});

// Propriétaires. Le premier est le compte de démonstration documenté dans le
// README (0555 10 00 01) et gère deux salles ; les autres rendent le jeu de
// données cohérent — chaque salle, réservation et avis pointe vers un
// utilisateur réel, ce qui permet de tester messagerie et notifications.
// Le rattachement aux salles vit dans `salles.owner_id`, pas ici.
const PRO_OWNERS = [
  ['user-pro-001', 'Karim Belkacem', '0021458796 clé 33'],
  ['user-pro-002', 'Samir Aït Ouali', '0034125870 clé 12'],
  ['user-pro-003', 'Mohamed Benali', '0045236981 clé 47'],
  ['user-pro-004', 'Hakim Zerrouki', '0056987412 clé 08'],
  ['user-pro-005', 'Rachid Amrani', '0067412589 clé 21'],
  ['user-pro-006', 'Djamel Kaci', '0078523691 clé 63'],
  ['user-pro-007', 'Mourad Ouyahia', '0089634127 clé 35'],
  ['user-pro-008', 'Tarek Boudjelal', '0090147852 clé 19'],
  ['user-pro-009', 'Nabil Hamdani', '0012369874 clé 52'],
  ['user-pro-010', 'Salim Merabet', '0023698741 clé 74'],
  ['user-pro-011', 'Farid Benhamou', '0034789612 clé 90'],
  // §13 — traiteurs et halouadjis : deux nouveaux comptes pro dédiés,
  // distincts des propriétaires de salle ci-dessus.
  ['user-pro-012', 'Yamina Cherif', '0091234567 clé 08'],
  ['user-pro-013', 'Amel Bouzid', '0092345678 clé 19'],
];

// Familles ayant réservé — référencées par les réservations et les avis.
const CLIENT_ACCOUNTS = [
  ['user-client-001', '+213661234567', 'Amina Cherif'],
  ['user-client-002', '+213770998877', 'Yacine Haddad'],
  ['user-client-003', '+213551443322', 'Farida Meziane'],
  ['user-client-004', '+213556112233', 'Sofiane Bouzid'],
  ['user-client-005', '+213779887766', 'Nadia Boumediene'],
  ['user-client-006', '+213540332211', 'Riad Slimani'],
  ['user-client-007', '+213661778899', 'Lounis Aïssani'],
];

export const SEED_USERS = [
  {
    id: 'user-admin-001',
    phone: '+213555000000',
    full_name: 'Équipe Tasalle',
    role: 'admin',
    created_at: '2025-09-01T09:00:00Z',
  },
  ...PRO_OWNERS.map(([id, name, ccp], i) => ({
    id,
    // 0555 10 00 01 … 0555 10 00 11
    phone: `+2135551000${String(i + 1).padStart(2, '0')}`,
    full_name: name,
    role: 'pro',
    pin: '1234',
    // Code de parrainage : lisible, sans caractères ambigus (ni 0/O ni 1/I/L).
    referral_code: ['K7M2QP','S4TR9X','B6HJ3W','D9NF5K','G2PX8M','H5RQ4T','J8WM6B','L3KD7N','N6TF2H','P9XB5R','Q4MJ8W'][i],
    ccp,
    created_at: '2026-01-12T09:00:00Z',
  })),
  ...CLIENT_ACCOUNTS.map(([id, phone, name]) => ({
    id,
    phone,
    full_name: name,
    role: 'client',
    created_at: '2026-03-01T09:00:00Z',
  })),
];

// Réservations de démonstration réparties autour d'aujourd'hui,
// pour que le dashboard pro et le planning aient de la matière.
export const SEED_RESERVATIONS = [
  {
    id: 'resa-001',
    reference: 'TAS-2026-0001',
    client_id: 'user-client-001',
    client_name: 'Amina Cherif',
    client_phone: '+213661234567',
    salle_id: 'salle-001',
    event_date: addDays(T, 21),
    event_type: 'mariage',
    guest_count: 320,
    formula_id: 'tarif-salle-001-3',
    total_amount: 74900,
    deposit_amount: 30000,
    deposit_paid: true,
    deposit_paid_at: addDays(T, -2),
    status: 'confirmed',
    client_message: 'Bonjour, nous souhaitons une décoration en blanc et doré. Merci.',
    source: 'app',
    signed_at: `${addDays(T, -3)}T10:12:00Z`,
    created_at: `${addDays(T, -6)}T14:20:00Z`,
  },
  {
    id: 'resa-002',
    reference: 'TAS-2026-0002',
    client_id: 'user-client-002',
    client_name: 'Yacine Haddad',
    client_phone: '+213770998877',
    salle_id: 'salle-001',
    event_date: addDays(T, 9),
    event_type: 'fiancailles',
    guest_count: 180,
    formula_id: 'tarif-salle-001-2',
    total_amount: 54950,
    deposit_amount: null,
    deposit_paid: false,
    status: 'pending',
    client_message: 'Est-il possible de commencer à 18h ?',
    source: 'app',
    created_at: `${addDays(T, -1)}T18:45:00Z`,
  },
  {
    id: 'resa-003',
    reference: 'TAS-2026-0003',
    client_id: 'user-client-003',
    client_name: 'Farida Meziane',
    client_phone: '+213551443322',
    salle_id: 'salle-001',
    event_date: addDays(T, 34),
    event_type: 'anniversaire',
    guest_count: 90,
    formula_id: 'tarif-salle-001-1',
    total_amount: 35000,
    deposit_amount: null,
    deposit_paid: false,
    status: 'pending',
    client_message: '',
    source: 'wom',
    created_at: `${addDays(T, 0)}T08:05:00Z`,
  },
  {
    id: 'resa-004',
    reference: 'TAS-2026-0004',
    client_id: 'user-client-004',
    client_name: 'Sofiane Bouzid',
    client_phone: '+213556112233',
    salle_id: 'salle-001',
    event_date: addDays(T, 48),
    event_type: 'mariage',
    guest_count: 400,
    formula_id: 'tarif-salle-001-3',
    total_amount: 74900,
    deposit_amount: 25000,
    deposit_paid: false,
    status: 'confirmed',
    client_message: 'Nous aurons besoin de la loge dès 14h.',
    source: 'app',
    signed_at: `${addDays(T, -1)}T11:00:00Z`,
    created_at: `${addDays(T, -4)}T09:30:00Z`,
  },
  {
    id: 'resa-005',
    reference: 'TAS-2026-0005',
    client_id: 'user-client-001',
    client_name: 'Amina Cherif',
    client_phone: '+213661234567',
    salle_id: 'salle-005',
    event_date: addDays(T, -12),
    event_type: 'anniversaire',
    guest_count: 60,
    formula_id: 'tarif-salle-005-1',
    total_amount: 38000,
    deposit_amount: 12000,
    deposit_paid: true,
    deposit_paid_at: addDays(T, -30),
    status: 'completed',
    client_message: '',
    source: 'app',
    created_at: `${addDays(T, -40)}T16:00:00Z`,
  },
  {
    id: 'resa-006',
    reference: 'TAS-2026-0006',
    client_id: 'user-client-005',
    client_name: 'Nadia Boumediene',
    client_phone: '+213779887766',
    salle_id: 'salle-001',
    event_date: addDays(T, -20),
    event_type: 'mariage',
    guest_count: 350,
    formula_id: 'tarif-salle-001-2',
    total_amount: 54950,
    deposit_amount: 20000,
    deposit_paid: true,
    deposit_paid_at: addDays(T, -45),
    status: 'completed',
    client_message: '',
    source: 'social',
    created_at: `${addDays(T, -60)}T12:00:00Z`,
  },
  {
    id: 'resa-007',
    reference: 'TAS-2026-0007',
    client_id: 'user-client-006',
    client_name: 'Riad Slimani',
    client_phone: '+213540332211',
    salle_id: 'salle-001',
    event_date: addDays(T, -5),
    event_type: 'fiancailles',
    guest_count: 140,
    formula_id: 'tarif-salle-001-1',
    total_amount: 35000,
    deposit_amount: 12000,
    deposit_paid: true,
    deposit_paid_at: addDays(T, -25),
    status: 'completed',
    client_message: '',
    source: 'app',
    created_at: `${addDays(T, -35)}T10:00:00Z`,
  },
];

export const SEED_REVIEWS = [
  {
    id: 'review-001',
    reservation_id: 'resa-006',
    client_id: 'user-client-005',
    client_name: 'Nadia Boumediene',
    salle_id: 'salle-001',
    event_type: 'mariage',
    rating_overall: 5,
    rating_salle: 5,
    rating_traiteur: 5,
    rating_proprete: 4,
    rating_value: 5,
    comment:
      "Une soirée parfaite. L'équipe a été aux petits soins du début à la fin, et le traiteur a fait l'unanimité. La salle était impeccable et la décoration correspondait exactement à ce que nous avions demandé.",
    photos: [],
    is_verified: true,
    status: 'approved',
    pro_reply: 'Merci infiniment Nadia, ce fut un plaisir de célébrer avec vous. Tous nos vœux de bonheur !',
    pro_replied_at: `${addDays(T, -17)}T09:00:00Z`,
    created_at: `${addDays(T, -18)}T20:15:00Z`,
  },
  {
    id: 'review-002',
    reservation_id: 'resa-007',
    client_id: 'user-client-006',
    client_name: 'Riad Slimani',
    salle_id: 'salle-001',
    event_type: 'fiancailles',
    rating_overall: 4,
    rating_salle: 4,
    rating_traiteur: 4,
    rating_proprete: 5,
    rating_value: 4,
    comment:
      "Très bonne prestation dans l'ensemble. Seul bémol : le parking était un peu juste pour le nombre d'invités. Sinon rien à redire, la salle est belle et bien entretenue.",
    photos: [],
    is_verified: true,
    status: 'pending',
    pro_reply: null,
    // Déposé il y a 2 h : franchement à l'intérieur de la fenêtre de
    // modération de 24 h (§10.2). Une date fixe à J-1 tombait sur la
    // frontière et faisait basculer l'avis en publication automatique selon
    // l'heure d'exécution — l'écran « avis à modérer » se vidait tout seul.
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'review-003',
    reservation_id: null,
    client_id: 'user-client-007',
    client_name: 'Lounis A.',
    salle_id: 'salle-001',
    event_type: 'anniversaire',
    rating_overall: 4,
    rating_salle: 4,
    rating_traiteur: null,
    rating_proprete: 4,
    rating_value: 3,
    comment: "Bon rapport qualité-prix pour un anniversaire familial. La sonorisation mériterait une mise à jour.",
    photos: [],
    is_verified: false,
    status: 'approved',
    pro_reply: null,
    created_at: `${addDays(T, -40)}T15:00:00Z`,
  },
];

// §7.2 — signalé par le propriétaire, en attente d'arbitrage par l'équipe
SEED_REVIEWS.push({
  id: 'review-004',
  reservation_id: null,
  client_id: 'user-client-007',
  client_name: 'Lounis Aïssani',
  salle_id: 'salle-003',
  event_type: 'mariage',
  rating_overall: 1,
  rating_salle: 1,
  rating_traiteur: 1,
  rating_proprete: 1,
  rating_value: 1,
  comment: "Avis contesté par le propriétaire, qui affirme que ce client n'a jamais réservé chez lui.",
  photos: [],
  is_verified: false,
  status: 'flagged',
  pro_reply: null,
  created_at: `${addDays(T, -3)}T14:00:00Z`,
});

export const SEED_MESSAGES = [
  {
    id: 'msg-001',
    reservation_id: 'resa-001',
    sender_id: 'user-client-001',
    content: 'Bonjour, est-il possible de visiter la salle ce week-end ?',
    is_read: true,
    created_at: `${addDays(T, -5)}T10:00:00Z`,
  },
  {
    id: 'msg-002',
    reservation_id: 'resa-001',
    sender_id: 'user-pro-001',
    content: 'Bonjour Amina, bien sûr. Samedi entre 10h et 16h, nous vous attendons.',
    is_read: true,
    created_at: `${addDays(T, -5)}T10:42:00Z`,
  },
  {
    id: 'msg-003',
    reservation_id: 'resa-001',
    sender_id: 'user-client-001',
    content: 'Parfait, nous serons là samedi à 11h. Merci !',
    is_read: false,
    created_at: `${addDays(T, -4)}T08:20:00Z`,
  },
];

// Jours bloqués manuellement par le pro (§5.3)
export const SEED_BLOCKED_DAYS = [
  { salle_id: 'salle-001', day: addDays(T, 14) },
  { salle_id: 'salle-001', day: addDays(T, 15) },
];

// Le compte de démonstration est à mi-parcours de son essai (§5.7).
export const SEED_SUBSCRIPTION = {
  id: 'sub-001',
  pro_id: 'user-pro-001',
  // L'abonnement porte sur le propriétaire, pas sur une salle : 5200 DA
  // couvrent toutes celles qu'il gère (§13 : 4200 DA pour un traiteur,
  // 2100 DA pour un halouadji — tarifs distincts, voir OWNER_PARTNER_TYPE
  // plus bas).
  salle_id: null,
  status: 'trial',
  // 45 jours consommés sur 90
  trial_started_at: addDays(T, -45),
  trial_ends_at: addDays(T, 45),
  current_period_start: null,
  current_period_end: null,
  amount: SUBSCRIPTION_PRICE,
  payment_method: null,
  payment_details: null,
  created_at: `${addDays(T, -45)}T09:00:00Z`,
};

// §13 — les deux derniers PRO_OWNERS (traiteur, halouadji) paient le tarif
// de leur type au lieu des 5200 DA d'un propriétaire de salle. Comparé par
// id plutôt que par position dans le tableau : SEED_TRAITEURS/
// SEED_HALOUADJIS ne sont déclarés que plus bas dans ce fichier, pas
// utilisables ici.
const OWNER_PARTNER_TYPE = { 'user-pro-012': 'traiteur', 'user-pro-013': 'halouadji' };

// Un abonnement par propriétaire : aucun parcours pro ne tombe sur un
// abonnement absent, quel que soit le compte connecté.
export const SEED_SUBSCRIPTIONS = [
  SEED_SUBSCRIPTION,
  ...PRO_OWNERS.slice(1).map(([proId], i) => ({
    id: `sub-${String(i + 2).padStart(3, '0')}`,
    pro_id: proId,
    salle_id: null,
    status: 'trial',
    trial_started_at: addDays(T, -20 - i * 5),
    trial_ends_at: addDays(T, 70 - i * 5),
    current_period_start: null,
    current_period_end: null,
    amount: PARTNER_SUBSCRIPTION_PRICES[OWNER_PARTNER_TYPE[proId]] ?? SUBSCRIPTION_PRICE,
    payment_method: null,
    payment_details: null,
    created_at: `${addDays(T, -20 - i * 5)}T09:00:00Z`,
  })),
];

export const SEED_PROMO_CODES = [
  {
    id: 'promo-001',
    salle_id: 'salle-001',
    code: 'RENTREE10',
    kind: 'percent',
    value: 10,
    starts_on: addDays(T, -10),
    ends_on: addDays(T, 60),
    max_uses: 20,
    used_count: 3,
    active: true,
    created_at: addDays(T, -10),
  },
  {
    id: 'promo-002',
    salle_id: 'salle-001',
    code: 'FIANCAILLES5000',
    kind: 'amount',
    value: 5000,
    starts_on: null,
    ends_on: null,
    max_uses: null,
    used_count: 0,
    active: true,
    created_at: addDays(T, -4),
  },
  {
    // Épuisé : sert à montrer l'état à l'écran sans manipulation.
    id: 'promo-003',
    salle_id: 'salle-001',
    code: 'PRINTEMPS',
    kind: 'percent',
    value: 15,
    starts_on: addDays(T, -120),
    ends_on: addDays(T, -30),
    max_uses: 5,
    used_count: 5,
    active: false,
    created_at: addDays(T, -120),
  },
  {
    id: 'promo-004',
    salle_id: 'salle-002',
    code: 'ANDALOUS20',
    kind: 'percent',
    value: 20,
    starts_on: null,
    ends_on: addDays(T, 30),
    max_uses: 10,
    used_count: 0,
    active: true,
    created_at: addDays(T, -2),
  },
];

export const SEED_INVOICES = [
  {
    id: 'inv-001',
    pro_id: 'user-pro-001',
    period: 'Essai gratuit',
    description: '90 jours offerts à l’inscription',
    amount: 0,
    status: 'paid',
    issued_at: addDays(T, -45),
  },
];

export const SEED_NOTIFICATIONS = [
  {
    id: 'notif-001',
    user_id: 'user-pro-001',
    type: 'reservation_new',
    title: 'Nouvelle demande de réservation',
    body: 'Yacine Haddad souhaite réserver le ' + addDays(T, 9) + ' (fiançailles, 180 invités).',
    data: { reservation_id: 'resa-002' },
    channel: 'push',
    is_read: false,
    created_at: `${addDays(T, -1)}T18:45:00Z`,
  },
  {
    id: 'notif-002',
    user_id: 'user-pro-001',
    type: 'review_pending',
    title: 'Nouvel avis en attente',
    body: 'Riad Slimani a déposé un avis. Vous avez 24 h pour le modérer.',
    data: { review_id: 'review-002' },
    channel: 'push',
    is_read: false,
    created_at: `${addDays(T, -1)}T19:30:00Z`,
  },
  {
    id: 'notif-003',
    user_id: 'user-client-001',
    type: 'reservation_confirmed',
    title: 'Réservation confirmée',
    body: 'Votre réservation à Salle El Widad est confirmée. Réf. TAS-2026-0001.',
    data: { reservation_id: 'resa-001' },
    channel: 'push',
    is_read: false,
    created_at: `${addDays(T, -3)}T10:12:00Z`,
  },
  {
    id: 'notif-004',
    user_id: 'user-client-001',
    type: 'review_request',
    title: 'Votre avis compte',
    body: 'Votre anniversaire à Dar El Ferah s’est bien passé ? Partagez votre avis.',
    data: { reservation_id: 'resa-005' },
    channel: 'push',
    is_read: true,
    created_at: `${addDays(T, -10)}T11:00:00Z`,
  },
];

export const SEED_FAVORITES = [
  { user_id: 'user-client-001', salle_id: 'salle-003' },
  { user_id: 'user-client-001', salle_id: 'salle-005' },
];

// ── Traiteurs et halouadjis (§13) ─────────────────────────────────────────
// Pas de `photosOf` : pas de manifeste de photos de démo pour ces deux
// verticales — `SallePhoto` retombe sur son dégradé avec l'initiale.

export const SEED_TRAITEURS = [
  {
    id: 'traiteur-001',
    owner_id: 'user-pro-012',
    name: 'Traiteur El Feth',
    city: 'Alger',
    description:
      "Traiteur événementiel depuis 15 ans : mariages, fiançailles, réceptions d'entreprise. Cuisine algéroise et internationale, service à table ou buffet, brigade complète sur place.",
    specialites: ['cuisine_algerienne', 'cuisine_internationale', 'buffet', 'service_a_table'],
    prix_min: 2500,
    prix_max: 6000,
    photos: [],
    status: 'active',
    is_premium: true,
    created_at: '2026-03-10T09:00:00Z',
  },
  {
    id: 'traiteur-002',
    owner_id: 'user-pro-012',
    name: 'Saveurs de Kabylie',
    city: 'Tizi Ouzou',
    description:
      'Cuisine kabyle traditionnelle pour vos grandes occasions : couscous royal, méchoui, plats mijotés. Livraison ou service sur place dans toute la wilaya.',
    specialites: ['cuisine_algerienne', 'mechoui', 'livraison'],
    prix_min: 1800,
    prix_max: 4500,
    photos: [],
    status: 'active',
    is_premium: false,
    created_at: '2026-04-02T09:00:00Z',
  },
];

export const SEED_HALOUADJIS = [
  {
    id: 'halouadji-001',
    owner_id: 'user-pro-013',
    name: 'Halouadji Bouzid',
    city: 'Alger',
    description:
      "Pâtisserie traditionnelle algérienne pour mariages et fiançailles : makrout, baklawa, qalb el louz, tcharek — présentés en pièces montées ou plateaux individuels.",
    specialites: ['patisserie_traditionnelle', 'gateau_mariage', 'plateau_individuel'],
    prix_min: 800,
    prix_max: 3000,
    photos: [],
    status: 'active',
    is_premium: true,
    created_at: '2026-03-15T09:00:00Z',
  },
  {
    id: 'halouadji-002',
    owner_id: 'user-pro-013',
    name: 'Douceurs de Blida',
    city: 'Blida',
    description:
      'Gâteaux traditionnels et modernes : pièce montée, dragées, plateaux mixtes traditionnel/moderne pour toutes les cérémonies.',
    specialites: ['patisserie_traditionnelle', 'patisserie_moderne', 'piece_montee'],
    prix_min: 1000,
    prix_max: 3500,
    photos: [],
    status: 'active',
    is_premium: false,
    created_at: '2026-04-10T09:00:00Z',
  },
];

export const SEED_DEVIS_REQUESTS = [
  {
    id: 'devis-001',
    client_id: 'user-client-001',
    traiteur_id: 'traiteur-001',
    halouadji_id: null,
    event_date: addDays(T, 60),
    guest_count: 250,
    message: 'Bonjour, je cherche un traiteur pour un mariage de 250 personnes, cuisine algéroise si possible.',
    status: 'pending',
    pro_reply: null,
    created_at: addDays(T, -2),
    responded_at: null,
  },
];

export function buildSeed() {
  return {
    users: SEED_USERS.map((u) => ({ ...u })),
    salles: SEED_SALLES.map((s) => ({ ...s })),
    tarifs: SEED_TARIFS.map((t) => ({ ...t })),
    traiteurs: SEED_TRAITEURS.map((t) => ({ ...t })),
    halouadjis: SEED_HALOUADJIS.map((h) => ({ ...h })),
    devis_requests: SEED_DEVIS_REQUESTS.map((d) => ({ ...d })),
    reservations: SEED_RESERVATIONS.map((r) => ({ ...r })),
    reviews: SEED_REVIEWS.map((r) => ({ ...r })),
    messages: SEED_MESSAGES.map((m) => ({ ...m })),
    notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
    favorites: SEED_FAVORITES.map((f) => ({ ...f })),
    blocked_days: SEED_BLOCKED_DAYS.map((b) => ({ ...b })),
    subscriptions: SEED_SUBSCRIPTIONS.map((s) => ({ ...s })),
    invoices: SEED_INVOICES.map((i) => ({ ...i })),
    promo_codes: SEED_PROMO_CODES.map((p) => ({ ...p })),
    referrals: [],
    counters: { reservation: SEED_RESERVATIONS.length },
    session: null,
  };
}

export const DEMO_TODAY = toISODate(new Date());
