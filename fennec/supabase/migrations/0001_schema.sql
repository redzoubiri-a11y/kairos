-- Fennec — schéma de base (0001)
-- Projet Supabase DÉDIÉ à Fennec. Ne pas appliquer sur le projet Kairos/Mida.
--
-- Organisation : référentiel pédagogique (mondes, mots) → élèves → état SRS
-- par élève/mot → journal des sessions et des boss. Voir fennec/README.md
-- pour la logique générale et docs/curriculum-foundations-semaine-par-semaine.md
-- pour le contenu pédagogique que ce schéma exécute.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- référentiel
-- Immuable côté élève : seedé une fois depuis data/foundations-banque-mots.json,
-- régénéré par fennec/supabase/seed/generate_seed.py si le curriculum évolue.

create table if not exists worlds (
  id          smallint primary key,          -- 1..8 (M1..M8)
  slug        text not null unique,          -- ex. 'm6-food'
  title_en    text not null,                 -- ex. 'Food'
  title_fr    text not null,                 -- ex. 'La nourriture'
  week_start  smallint not null,             -- ex. 21
  week_end    smallint not null              -- ex. 24
);

create table if not exists words (
  id           serial primary key,
  external_id  integer not null unique,      -- id stable venant de la banque de mots (JSON)
  english      text not null,
  french       text not null,
  category     text not null check (category in ('lexique','structure','fonction','décodable')),
  world_id     smallint not null references worlds(id),
  intro_week   smallint not null,            -- ex. 21 (S21)
  intro_day    smallint not null check (intro_day between 1 and 4),
  -- calendrier SRS nominal (labels de semaine 'S21', 'VH1'...), généré à la
  -- conception et rejoué par le moteur offline à partir de la date réelle
  -- d'introduction de l'élève — ces colonnes servent de référence/QA, pas
  -- de source de vérité runtime (voir fennec/src/srs.mjs).
  review_1     text not null,
  review_2     text not null,
  review_3     text not null,
  review_4     text not null,
  review_5     text not null,                -- = seuil de maîtrise nominal
  audio_url    text,                         -- rempli une fois les enregistrements produits
  image_url    text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_words_world on words(world_id);
create index if not exists idx_words_intro_week on words(intro_week);

-- ------------------------------------------------------------------- élèves
-- Un compte Supabase Auth (parent OU enseignant) peut être responsable de
-- plusieurs élèves (fratrie, classe). L'élève lui-même n'a pas forcément de
-- compte (jeune enfant, téléphone partagé) : il est identifié par un profil
-- + un code local (PIN/avatar) géré côté app, pas par auth.users.

create table if not exists guardians (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('parent','teacher')),
  full_name   text,
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists students (
  id             uuid primary key default gen_random_uuid(),
  guardian_id    uuid not null references guardians(id) on delete cascade,
  display_name   text not null,              -- prénom, choisi par l'enfant/le parent
  avatar         text not null default '🦊',
  track          text not null default 'foundations' check (track in ('foundations','builder','bem_sprint')),
  current_week   smallint not null default 1,
  timezone       text not null default 'Africa/Algiers',
  created_at     timestamptz not null default now()
);
create index if not exists idx_students_guardian on students(guardian_id);

-- Classes (mode enseignant) : rattache plusieurs élèves à un enseignant via
-- un code de groupe, sans dupliquer la relation guardian déjà utilisée pour
-- le rapport parent — un élève peut être à la fois suivi par un parent et
-- membre d'une classe.
create table if not exists classrooms (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references guardians(id) on delete cascade,
  name         text not null,
  join_code    text not null unique,          -- ex. 'FEN-7K2Q'
  created_at   timestamptz not null default now()
);

create table if not exists classroom_students (
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

-- ---------------------------------------------------------------- état SRS
-- Une ligne par (élève, mot). C'est la synchronisation en base de l'état géré
-- en local par fennec/src/srs.mjs — voir ce fichier pour l'algorithme complet
-- (intervalles [1,3,7,16,35] jours, recul d'un cran sur échec).

create table if not exists student_word_state (
  student_id     uuid not null references students(id) on delete cascade,
  word_id        integer not null references words(id) on delete cascade,
  step           smallint not null default 0,      -- 0 = pas encore introduit
  ease           real not null default 2.3,         -- facteur multiplicatif (SM-2 simplifié)
  interval_days  integer not null default 0,
  due_at         date,                               -- prochaine échéance (null = pas encore dû)
  last_result    boolean,                             -- dernière réponse : réussite/échec
  reps_ok        smallint not null default 0,         -- réussites consécutives depuis le dernier échec
  mastered_at    timestamptz,                          -- non-null = maîtrisé (5e réussite espacée)
  introduced_at  timestamptz,
  updated_at     timestamptz not null default now(),
  primary key (student_id, word_id)
);
create index if not exists idx_sws_due on student_word_state(student_id, due_at);
create index if not exists idx_sws_mastered on student_word_state(student_id) where mastered_at is not null;

-- -------------------------------------------------------------- sessions
-- Une session = les ~18 écrans d'un jour (cf. docs/script-semaine-type-s21.md).
-- Écrite par la sync depuis la file locale (fennec/src/sync.mjs), potentiellement
-- bien après que la session s'est réellement déroulée hors-ligne : `started_at`
-- fait foi, pas la date d'insertion.

create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  week          smallint not null,
  day           smallint not null check (day between 1 and 5),   -- 5 = boss
  kind          text not null default 'daily' check (kind in ('daily','boss')),
  started_at    timestamptz not null,
  finished_at   timestamptz,
  screens_total    smallint not null default 0,
  screens_correct  smallint not null default 0,
  boss_passed   boolean,                      -- rempli seulement si kind = 'boss'
  boss_variant  text,                          -- ex. 'market_2' si rejoué en variante
  synced_at     timestamptz not null default now()
);
create index if not exists idx_sessions_student on sessions(student_id, started_at desc);

create table if not exists session_events (
  id            bigserial primary key,
  session_id    uuid not null references sessions(id) on delete cascade,
  screen_index  smallint not null,
  word_id       integer references words(id),
  screen_type   text not null,               -- 'listen_touch' | 'say_it' | 'true_false' | ...
  correct       boolean not null,
  response_ms   integer,
  is_retest     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_events_session on session_events(session_id);

-- ---------------------------------------------------------- preuves parent
-- Les enregistrements audio produits aux moments-clés du script (S12, S16,
-- S32, et chaque boss réussi) — c'est le moteur social de la régularité
-- décrit dans l'analyse stratégique.

create table if not exists parent_reports (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  session_id    uuid references sessions(id) on delete set null,
  kind          text not null check (kind in ('weekly_boss','milestone_s12','midyear_s16','final_s32')),
  audio_url     text,                          -- enregistrement de l'enfant, si capturé
  words_known   integer not null default 0,     -- total de mots maîtrisés à cette date
  message_ar    text,                           -- message généré, ex. la ligne S21 de l'exemple
  message_fr    text,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_reports_student on parent_reports(student_id, created_at desc);

-- ------------------------------------------------------- bilans (S1/S16/S32)
-- Le test de positionnement rejoué à l'identique en S16 et S32 (cf. analyse) :
-- delta objectif montré aux parents.

create table if not exists placement_tests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  milestone     text not null check (milestone in ('s1','s16','s32')),
  score         integer not null,             -- score brut du test adaptatif
  max_score     integer not null,
  taken_at      timestamptz not null default now()
);
create unique index if not exists uq_placement_once on placement_tests(student_id, milestone);
