# Fennec — chantier technique (Supabase + moteur SRS offline)

Ce dossier contient l'implémentation technique de la méthode Fennec (voir
`docs/analyse-plateforme-anglais-algerie.md`, `docs/curriculum-foundations-semaine-par-semaine.md`,
`docs/script-semaine-type-s21.md` et `data/foundations-banque-mots.*`).

**Important — isolation du projet Supabase.** Le projet Supabase connecté à cette session
(« Kairos », `rghjgyzpdadapmktislv`) est la **base de production de Mida** (réservation de
restaurants). Rien ici ne doit y être appliqué. Ces migrations sont écrites pour un **projet
Supabase séparé**, à créer pour Fennec (ex. « Fennec » ou « kairos-fennec »), et ne touchent à
aucune table Mida.

## Ce qu'il y a dans ce dossier

```
fennec/
  supabase/
    migrations/
      0001_schema.sql        # tables : mondes, mots, élèves, état SRS, sessions, boss
      0002_rls.sql            # Row Level Security : un élève ne voit que ses données,
                               # un parent ne voit que ses enfants, un enseignant que sa classe
    seed/
      seed_words.sql          # généré depuis data/foundations-banque-mots.json (335 items)
      generate_seed.py        # script qui régénère seed_words.sql si la banque change
  src/
    srs.js                    # moteur de répétition espacée — pur, sans dépendance, testable
    db.mjs                     # couche offline : IndexedDB (cache mots + état SRS + file de sync)
    sync.mjs                   # synchronisation offline ↔ Supabase (push file, pull mises à jour)
  test/
    srs.test.js               # tests du moteur SRS (node:test, zéro dépendance)
```

## Pourquoi cette architecture

Le principe directeur (cf. l'analyse) : **offline-first**, parce que la data mobile en Algérie
est chère et irrégulière. L'enfant doit pouvoir faire sa session de 15 minutes sans réseau ; la
synchronisation avec Supabase (progression, rapport parent, tableau de bord enseignant) se fait
en arrière-plan dès qu'une connexion est disponible.

Concrètement :

1. **La vérité pédagogique vit côté client.** Le moteur SRS (`srs.js`) tourne entièrement en
   local : il décide quel mot réviser aujourd'hui à partir de l'état stocké dans IndexedDB. Il
   n'a besoin de Supabase pour rien — c'est un module pur (mêmes entrées → mêmes sorties),
   ce qui le rend testable sans backend et réutilisable tel quel dans une session de test unitaire
   comme dans l'app.
2. **Supabase est la source de vérité partagée**, pas le moteur temps réel de la session.
   Les tables stockent : le référentiel des mots/mondes (immuable, seedé une fois), l'état SRS de
   chaque élève pour chaque mot (dernière révision, prochaine échéance, nombre de réussites),
   le journal des sessions et des boss (pour le tableau de bord parent/enseignant et les mesures
   S1/S16/S32 de l'analyse).
3. **La sync est une file, pas un flux temps réel.** Chaque action de l'enfant (réponse à un
   écran) est écrite immédiatement en local, puis empilée dans une file `pending_sync`. Un
   travailleur de fond vide la file vers Supabase dès que `navigator.onLine` repasse à `true`.
   Aucune perte de session en cas de coupure — l'expérience de l'enfant ne dépend jamais du réseau.

## Démarrage

```bash
# 1. Créer un projet Supabase dédié à Fennec (PAS le projet Kairos/Mida existant)
supabase link --project-ref <ref-du-projet-fennec>

# 2. Appliquer les migrations
supabase db push
# ou, mot à mot :
psql "$DATABASE_URL" -f fennec/supabase/migrations/0001_schema.sql
psql "$DATABASE_URL" -f fennec/supabase/migrations/0002_rls.sql

# 3. Régénérer et charger le référentiel de mots (335 items de Foundations)
python3 fennec/supabase/seed/generate_seed.py
psql "$DATABASE_URL" -f fennec/supabase/seed/seed_words.sql

# 4. Lancer les tests du moteur SRS (aucune dépendance à installer)
node --test fennec/test/
```

## Prochaines briques (hors scope de ce chantier)

- Interface enfant (PWA) qui consomme `db.mjs`/`srs.js` — les maquettes `wireframes/fennec-maquette-*.html`
  montrent l'UI cible.
- Tableau de bord parent/enseignant côté web, lisant directement les tables Supabase.
- Assets audio (actuellement simulés par la synthèse vocale dans les maquettes).
