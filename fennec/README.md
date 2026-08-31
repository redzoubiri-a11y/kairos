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
    srs.mjs                    # moteur de répétition espacée — pur, sans dépendance, testable
    db.mjs                     # couche offline : IndexedDB (cache mots + état SRS + file de sync)
    sync.mjs                   # synchronisation offline ↔ Supabase (push file, pull mises à jour)
    queue.mjs                  # construit le plan d'écrans du jour depuis catalogue + état SRS réels
  test/
    srs.test.js               # tests du moteur SRS (node:test, zéro dépendance)
    queue.test.js             # tests de la construction du plan d'écrans
    sync.test.js              # tests de la synchronisation (client Supabase simulé)
  app/                        # PWA réelle, branchée sur src/*.mjs (pas une maquette)
    index.html, styles.css, main.mjs, session.mjs, sw.js, manifest.webmanifest
    catalog.json               # copie embarquée du référentiel (bootstrap 100% offline)
    build_catalog.py           # régénère catalog.json depuis data/foundations-banque-mots.json
```

## Pourquoi cette architecture

Le principe directeur (cf. l'analyse) : **offline-first**, parce que la data mobile en Algérie
est chère et irrégulière. L'enfant doit pouvoir faire sa session de 15 minutes sans réseau ; la
synchronisation avec Supabase (progression, rapport parent, tableau de bord enseignant) se fait
en arrière-plan dès qu'une connexion est disponible.

Concrètement :

1. **La vérité pédagogique vit côté client.** Le moteur SRS (`srs.mjs`) tourne entièrement en
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

# 4. Lancer les tests (aucune dépendance à installer — node:test natif)
node --test fennec/test/
```

## Lancer la vraie PWA en local

`fennec/app/` n'est pas une maquette : elle importe directement `../src/db.mjs`,
`../src/srs.mjs`, `../src/queue.mjs` et `../src/sync.mjs` — chaque réponse de
l'enfant appelle réellement le moteur SRS et persiste réellement dans IndexedDB.
Sans configuration Supabase, elle tourne intégralement en local (catalogue
embarqué `catalog.json`, aucune donnée envoyée nulle part) ; c'est le mode par
défaut, pensé pour être démontrable sans dépendre d'un projet Supabase.

```bash
# Régénérer le catalogue embarqué si la banque de mots a changé
python3 fennec/app/build_catalog.py

# Servir fennec/ (pas fennec/app/) pour que les imports relatifs ../src/*.mjs
# résolvent correctement
cd fennec && python3 -m http.server 8734
# puis ouvrir http://localhost:8734/app/index.html
```

Une **barre de développement** en haut de l'app affiche la position dans le
curriculum et une horloge virtuelle : les boutons « +1 jour »/« +7 jours »
avancent cette horloge (stockée en `localStorage`, jamais `new Date()` en dur
dans le moteur) pour observer le vrai calendrier SRS (J+1, J+3, J+7…) sans
attendre plusieurs jours réels. « ↻ réinitialiser » vide IndexedDB et
`localStorage` pour repartir d'un élève neuf.

Pour brancher Supabase (une fois le projet Fennec créé et migré, cf.
ci-dessus), injecter avant le chargement de `main.mjs` :
```html
<script>
  window.FENNEC_SUPABASE_URL = '...';
  window.FENNEC_SUPABASE_KEY = '...'; // clé publique anon, jamais la clé service_role
</script>
```
Sans ces deux variables, `maybeConfigureSync()` (`fennec/app/main.mjs`) laisse
l'app en mode 100 % local — c'est un choix explicite, pas un mode dégradé.

**Validé en conditions réelles (Playwright + Chromium)** : catalogue chargé en
IndexedDB (335 mots), session jouée du premier écran à la victoire avec le
vrai moteur (introduction, révision, plan d'écrans dynamique), état SRS
persisté avec la bonne échéance calendaire, position dans le curriculum qui
survit à un rechargement de page, mot redevenant "dû" en révision après avance
de l'horloge virtuelle — et **fonctionnement complet réseau totalement coupé**
après un premier chargement (service worker + cache de l'app shell).

## Prochaines briques (hors scope de ce chantier)

- Habillage visuel définitif une fois le design système Fennec formalisé
  (actuellement : palette/typo reprises telles quelles des maquettes
  `wireframes/fennec-maquette-*.html`).
- Vrais assets audio/image (actuellement : texte + synthèse vocale du
  navigateur, `word.audioUrl`/`word.imageUrl` déjà prévus dans le schéma).
- Tableau de bord parent/enseignant côté web, lisant directement les tables
  Supabase.
- Écran Boss dédié dans l'app réelle (le moteur `queue.mjs`/`srs.bossVerdict`
  le permet déjà ; seul le rendu spécifique — panier, variante — reste à
  écrire, sur le modèle de `wireframes/fennec-maquette-boss-s21.html`).
