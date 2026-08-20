-- Import genere depuis data/top20_restaurants_alger.json (rank 20 exclu)
-- Idempotent : upsert sur google_place_id, ne touche jamais status/owner_id/claim_token/slug/source sur conflit.
--
-- NOTE (2026-08-20, apres coup) : Havana (rank 12) et Safran Paella (rank 17) ont ete
-- importes par ce fichier puis supprimes de la prod sur demande utilisateur (identite/adresse
-- pas assez fiables). Ce fichier garde la trace de ce qui a ete execute a l'origine ;
-- scripts/import-restaurants-alger.js exclut desormais ces 2 ranks pour tout futur run.

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Taj Mahal',
  '07 Rue Idir Toumi, Ben Aknoun 16000, Alger',
  'Ben Aknoun',
  '+213 44 99 62 97',
  'asiatique'::cuisine_type,
  '[{"day":1,"open":"11:30","close":"23:30"},{"day":2,"open":"11:30","close":"23:30"},{"day":3,"open":"11:30","close":"23:30"},{"day":4,"open":"11:30","close":"23:30"},{"day":5,"open":"12:30","close":"23:30"},{"day":6,"open":"11:30","close":"23:30"},{"day":0,"open":"11:30","close":"23:30"}]'::jsonb,
  36.756228,
  3.0091654,
  'alger',
  'draft',
  'google_places',
  'ChIJtWWDQfCxjxIRuH6PB3aU5gg',
  'taj-mahal'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Restaurant El Djenina',
  '10 Rue Franklin Roosevelt, Sidi M''Hamed 16000, Alger',
  'Sidi M''Hamed',
  '+213 773 41 77 65',
  'algerien'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"22:30"},{"day":2,"open":"12:00","close":"22:30"},{"day":3,"open":"12:00","close":"22:30"},{"day":4,"open":"12:00","close":"22:30"},{"day":6,"open":"12:00","close":"22:30"},{"day":0,"open":"12:00","close":"22:30"}]'::jsonb,
  36.7614346,
  3.0476094,
  'alger',
  'draft',
  'google_places',
  'ChIJtfyTGW-yjxIRQTDAGsLzCds',
  'restaurant-el-djenina'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'The Brunch Box & Cookies',
  'L''oasis, Kouba 16050, Alger',
  'Kouba',
  '+213 770 41 37 34',
  'francais'::cuisine_type,
  '[{"day":1,"open":"08:00","close":"16:00"},{"day":2,"open":"08:00","close":"16:00"},{"day":3,"open":"08:00","close":"16:00"},{"day":4,"open":"08:00","close":"16:00"},{"day":5,"open":"08:00","close":"16:00"},{"day":6,"open":"08:00","close":"16:00"},{"day":0,"open":"08:00","close":"16:00"}]'::jsonb,
  36.7407459,
  3.0850757,
  'alger',
  'draft',
  'google_places',
  'ChIJwQO-QyNTjhIR8WKd0cl_KSM',
  'the-brunch-box-cookies'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Restaurant Signature',
  '9 Bd du 11 Décembre 1960, El Biar, Alger',
  'El Biar',
  '+213 799 30 87 66',
  'italien'::cuisine_type,
  '[{"day":1,"open":"11:00","close":"02:00"},{"day":2,"open":"11:00","close":"02:00"},{"day":3,"open":"11:00","close":"02:00"},{"day":4,"open":"11:00","close":"02:00"},{"day":5,"open":"14:00","close":"02:00"},{"day":6,"open":"11:00","close":"02:00"},{"day":0,"open":"11:00","close":"02:00"}]'::jsonb,
  36.7615146,
  3.0245171,
  'alger',
  'draft',
  'google_places',
  'ChIJh-0EDBmyjxIRzKj1YgcbBbM',
  'restaurant-signature'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'El Mordjane',
  '172 Rue Hassiba Ben Bouali, Belouizdad 16015, Alger',
  'Belouizdad',
  '+213 21 68 52 10',
  'algerien'::cuisine_type,
  '[{"day":1,"open":"19:00","close":"22:30"},{"day":2,"open":"19:00","close":"22:30"},{"day":3,"open":"19:00","close":"22:30"},{"day":4,"open":"19:00","close":"22:30"},{"day":5,"open":"19:00","close":"22:30"},{"day":6,"open":"19:00","close":"22:30"},{"day":0,"open":"19:00","close":"22:30"}]'::jsonb,
  36.7516735,
  3.0732918,
  'alger',
  'draft',
  'google_places',
  'ChIJF7mvLpqyjxIRR4Wu4GC8SIo',
  'el-mordjane'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'La Presqu''île Restaurant Poissonnerie Traiteur',
  '16 Chemin Sidi Yahia, Bir Mourad Raïs, Alger',
  'Bir Mourad Raïs',
  '+213 770 20 59 92',
  'autre'::cuisine_type,
  '[{"day":1,"open":"08:30","close":"23:30"},{"day":2,"open":"08:30","close":"23:30"},{"day":3,"open":"08:30","close":"23:30"},{"day":4,"open":"08:30","close":"23:30"},{"day":5,"open":"08:30","close":"23:30"},{"day":6,"open":"08:30","close":"23:30"},{"day":0,"open":"08:30","close":"23:30"}]'::jsonb,
  36.7381448,
  3.045563,
  'alger',
  'draft',
  'google_places',
  'ChIJe5Zr7iutjxIRp87V2ZSBc74',
  'la-presqu-ile-restaurant-poissonnerie-traiteur'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Tantra Restaurant & Lounge',
  'Riadh El Feth, El Madania, Alger',
  'El Madania',
  '+213 21 65 46 54',
  'francais'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"00:00"},{"day":2,"open":"12:00","close":"00:00"},{"day":3,"open":"12:00","close":"00:00"},{"day":4,"open":"12:00","close":"00:00"},{"day":5,"open":"12:00","close":"00:00"},{"day":6,"open":"12:00","close":"00:00"},{"day":0,"open":"12:00","close":"00:00"}]'::jsonb,
  36.7416104,
  3.0733867,
  'alger',
  'draft',
  'google_places',
  'ChIJzaC672GtjxIRc8IZIvc_pMU',
  'tantra-restaurant-lounge'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Saladbox',
  '62 Chemin Sidi Yahia, Hydra, Alger',
  'Hydra',
  '+213 558 19 19 19',
  'mediterraneen'::cuisine_type,
  '[{"day":1,"open":"08:30","close":"23:00"},{"day":2,"open":"08:30","close":"23:00"},{"day":3,"open":"08:30","close":"23:00"},{"day":4,"open":"08:30","close":"23:00"},{"day":5,"open":"08:30","close":"23:00"},{"day":6,"open":"08:30","close":"23:00"},{"day":0,"open":"08:30","close":"23:00"}]'::jsonb,
  36.7396263,
  3.0375628,
  'alger',
  'draft',
  'google_places',
  'ChIJo8A0C3atjxIRbUcZA2f8oWA',
  'saladbox'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Le Ciel d''Alger by AZ Hôtels Kouba',
  'Ave Rabia Mohamed, Kouba 16006, Alger',
  'Kouba',
  '+213 561 66 75 63',
  'autre'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"23:00"},{"day":2,"open":"12:00","close":"23:00"},{"day":3,"open":"12:00","close":"23:00"},{"day":4,"open":"12:00","close":"23:00"},{"day":5,"open":"12:00","close":"23:00"},{"day":6,"open":"12:00","close":"23:00"},{"day":0,"open":"12:00","close":"23:00"}]'::jsonb,
  36.7370398,
  3.0908304,
  'alger',
  'draft',
  'google_places',
  'ChIJt2nRggGtjxIRq7ZBhv4jleo',
  'le-ciel-d-alger-by-az-hotels-kouba'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Caracoya',
  '3 Rue Ben Messaoud, Sidi M''Hamed 16000, Alger',
  'Sidi M''Hamed',
  '+213 44 19 08 00',
  'francais'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"23:00"},{"day":2,"open":"12:00","close":"23:00"},{"day":3,"open":"12:00","close":"23:00"},{"day":4,"open":"12:00","close":"23:00"},{"day":5,"open":"16:00","close":"23:00"},{"day":6,"open":"12:00","close":"23:00"},{"day":0,"open":"12:00","close":"23:00"}]'::jsonb,
  36.766903,
  3.0534975,
  'alger',
  'draft',
  'google_places',
  'ChIJ_RK4Y16yjxIRyJI5vCHkfXg',
  'caracoya'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Restaurant El Boustene (Garden Restaurant Al Boustane)',
  'Riad El Feth, El Madania, Alger',
  'El Madania',
  '+213 794 31 98 02',
  'francais'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"15:00"},{"day":2,"open":"12:00","close":"15:00"},{"day":3,"open":"12:00","close":"15:00"},{"day":4,"open":"12:00","close":"15:00"},{"day":5,"open":"12:00","close":"15:00"},{"day":6,"open":"12:00","close":"15:00"},{"day":0,"open":"12:00","close":"15:00"}]'::jsonb,
  36.7416233,
  3.0776468,
  'alger',
  'draft',
  'google_places',
  'ChIJo1QG7WGtjxIRKfHWdLOo0VM',
  'restaurant-el-boustene-garden-restaurant-al-boustane'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Havana',
  'Centre commercial et de loisirs Bab-Ezzouar, Bab Ezzouar, Alger',
  'Bab Ezzouar',
  '+213 782 36 20 01',
  'mediterraneen'::cuisine_type,
  '[]'::jsonb,
  36.712157,
  3.196699,
  'alger',
  'draft',
  'google_places',
  'ChIJSQvi35VRjhIRy6k7F4jOj18',
  'havana'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Le Bardo',
  '135 Rue Didouche Mourad, Sidi M''Hamed 16000, Alger',
  'Sidi M''Hamed',
  '+213 770 50 24 98',
  'francais'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"22:30"},{"day":2,"open":"12:00","close":"22:30"},{"day":3,"open":"12:00","close":"22:30"},{"day":4,"open":"12:00","close":"22:30"},{"day":5,"open":"12:00","close":"22:30"},{"day":6,"open":"12:00","close":"22:30"},{"day":0,"open":"12:00","close":"22:30"}]'::jsonb,
  36.761577,
  3.0479893,
  'alger',
  'draft',
  'google_places',
  'ChIJvTvj72iyjxIRqifAd9yBpLg',
  'le-bardo'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Les Orientalistes',
  'Riadh El Feth, El Madania, Alger',
  'El Madania',
  '+213 770 95 54 55',
  'francais'::cuisine_type,
  '[{"day":1,"open":"17:00","close":"02:00"},{"day":2,"open":"17:00","close":"02:00"},{"day":3,"open":"17:00","close":"02:00"},{"day":4,"open":"17:00","close":"04:00"},{"day":5,"open":"17:00","close":"03:00"},{"day":6,"open":"17:00","close":"02:00"},{"day":0,"open":"17:00","close":"02:00"}]'::jsonb,
  36.7414828,
  3.0758845,
  'alger',
  'draft',
  'google_places',
  'ChIJ93drOmCtjxIR342NvbwyAP0',
  'les-orientalistes'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Diagonal Glace & Café',
  'Rouiba 16012, Alger',
  'Rouiba',
  '+213 670 20 32 13',
  'autre'::cuisine_type,
  '[]'::jsonb,
  36.7404993,
  3.2867046,
  'alger',
  'draft',
  'google_places',
  'ChIJU_yeSDJFjhIR_el7HYks2BQ',
  'diagonal-glace-cafe'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Restaurant Yulmaz (Bent Bladi)',
  '08 Rue Pichon, Place Maurice Audin, Alger Centre 16000, Alger',
  'Alger Centre',
  '+213 561 52 02 61',
  'mediterraneen'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"22:00"},{"day":2,"open":"12:00","close":"22:00"},{"day":3,"open":"12:00","close":"22:00"},{"day":4,"open":"12:00","close":"22:00"},{"day":6,"open":"12:00","close":"22:00"},{"day":0,"open":"12:00","close":"22:00"}]'::jsonb,
  36.7694222,
  3.0555622,
  'alger',
  'draft',
  'google_places',
  'ChIJV85qLF-yjxIRvyH-0Qx5HVY',
  'restaurant-yulmaz-bent-bladi'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Safran Paella (Tapas)',
  'Tour n°1, Alger',
  '',
  '+213 558 35 95 81',
  'mediterraneen'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"22:30"},{"day":2,"open":"12:00","close":"22:30"},{"day":3,"open":"12:00","close":"22:30"},{"day":4,"open":"12:00","close":"23:00"},{"day":5,"open":"19:30","close":"23:00"},{"day":6,"open":"12:00","close":"23:00"}]'::jsonb,
  36.7276866,
  3.063713,
  'alger',
  'draft',
  'google_places',
  'ChIJ82pfYlmtjxIRGfTFQSOaBg0',
  'safran-paella-tapas'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Le Farfalla',
  'Hydra, Alger',
  'Hydra',
  '+213 20 06 89 25',
  'autre'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"22:30"},{"day":2,"open":"12:00","close":"22:30"},{"day":3,"open":"12:00","close":"22:30"},{"day":4,"open":"12:00","close":"22:30"},{"day":6,"open":"12:00","close":"22:30"},{"day":0,"open":"12:00","close":"22:30"}]'::jsonb,
  36.7547846,
  3.0296486,
  'alger',
  'draft',
  'google_places',
  'ChIJxcb5LhCyjxIR_U7Z6TN6HFM',
  'le-farfalla'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into restaurants (owner_id, name, address, quartier, phone, cuisine_type, opening_hours, latitude, longitude, city, status, source, google_place_id, slug)
values (
  '00000000-0000-0000-0000-000000000099',
  'Le Perchoir',
  'Hydra, Alger',
  'Hydra',
  '+213 560 95 99 26',
  'francais'::cuisine_type,
  '[{"day":1,"open":"12:00","close":"00:00"},{"day":2,"open":"12:00","close":"00:00"},{"day":3,"open":"12:00","close":"00:00"},{"day":4,"open":"12:00","close":"00:00"},{"day":5,"open":"16:00","close":"00:00"},{"day":6,"open":"12:00","close":"00:00"},{"day":0,"open":"12:00","close":"00:00"}]'::jsonb,
  36.7400669,
  3.0298263,
  'alger',
  'draft',
  'google_places',
  'ChIJH1iyH_etjxIR5c0MfP2_mYI',
  'le-perchoir'
)
on conflict (google_place_id) do update set
  name = excluded.name,
  address = excluded.address,
  quartier = excluded.quartier,
  phone = excluded.phone,
  cuisine_type = excluded.cuisine_type,
  opening_hours = excluded.opening_hours,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

