# Fennec — chantier technique (Supabase + moteur SRS offline)

Ce dossier contient l'implémentation technique de la méthode Fennec (voir
`docs/analyse-plateforme-anglais-algerie.md`, `docs/curriculum-foundations-semaine-par-semaine.md`,
`docs/curriculum-builder-semaine-par-semaine.md`, `docs/script-semaine-type-s21.md`,
`data/foundations-banque-mots.*` et `data/builder-banque-mots.*`).

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
      seed_words.sql          # généré depuis les deux banques de mots (489 items, 16 mondes)
      generate_seed.py        # script qui régénère seed_words.sql si une banque change
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
    index.html, styles.css, screens.mjs, session.mjs, bossSession.mjs, main.mjs, sw.js, manifest.webmanifest
    classroomQuiz.html/.mjs    # quiz projetable (mode classe), vrai écran — voir plus bas
    bemSprint.html/.mjs        # BEM Sprint — BS1-BS8, complet (?week=1..8 ou onglets), vrai écran — voir plus bas
    bemSprintBS1-8.json        # contenu par semaine, écrit à la main (pas généré)
    catalog.json               # copie embarquée du référentiel (bootstrap 100% offline)
    build_catalog.py           # régénère catalog.json depuis les deux banques de mots
    phonics.json               # progression phonics (22 sons, S2→S30), écran "phonics"
    word-emoji.json            # illustrations emoji pour 193/213 mots lexique (placeholder)
    build_word_emoji.py        # régénère word-emoji.json (garde-fou : jamais 2 mots = même emoji)
  design/
    design-system-handoff.md              # spec du design système définitif (tokens, gabarits, copie)
    fennec-design-system-complete.dc.html  # source haute-fidélité (palette marine/rouge/blanc)
```

## Design système

`fennec/app/` applique le design système définitif décrit dans `fennec/design/`
(palette marine `#0A3161` / rouge `#B22234` / crème `#F5F3EE`, Baloo 2 +
IBM Plex Mono, pastilles de progression, bandeau Boss plein marine + panier
rouge à 12 cases). Deux règles de comportement non négociables du handoff,
implémentées dans `screens.mjs` :
- **Jamais rouge sur une erreur** : une mauvaise réponse révèle la bonne en
  "erreur-douce" (gris-bleu neutre), jamais en rouge, jamais de croix.
- **Jamais de son d'échec** : `chimeSuccess()` ne joue qu'à la réussite.

**Interface enfant en arabe.** Les instructions, boutons et titres d'écran
sont en arabe (classe CSS `.ar` pour le RTL) ; le mot anglais enseigné reste
affiché en anglais (LTR) — c'est le contenu pédagogique, pas l'interface.

**Illustrations** : `fennec/app/word-emoji.json` (généré par `build_word_emoji.py`,
validé contre le catalogue par `fennec/test/word-emoji-data.test.js`) fournit
un emoji univoque pour 193 des 213 mots "lexique" — les cartes-options
(écoute→touche, lecture→touche) l'utilisent quand il existe. Les 20 mots
restants (jours de la semaine, adjectifs relationnels comme big/small/tall...)
n'ont pas d'emoji fidèle et unique : ils retombent sur le texte anglais,
jamais sur un emoji forcé ou trompeur. Reste un placeholder temporaire —
à remplacer par de vraies illustrations quand elles existeront.

**Plusieurs enfants sur un même téléphone.** `fennec/app/main.mjs` gère
plusieurs profils locaux (fratrie) — écran "qui joue aujourd'hui ?" au
premier lancement, bouton "🔁 changer d'enfant" dans la barre de dev pour
en changer à tout moment. Chaque profil a son propre `studentId` (déjà la
clé du moteur SRS dans IndexedDB) et son propre pointeur de curriculum/essai
Boss, namespacés en localStorage par profil — aucun changement côté moteur
n'était nécessaire, seule l'orchestration en manquait. Validé en navigateur
réel : deux profils gardent des positions de curriculum indépendantes après
qu'un seul des deux ait joué une session complète.

**Tableaux de bord parent et enseignant (maquettes).** `wireframes/fennec-maquette-dashboard-parent.html`
et `wireframes/fennec-maquette-dashboard-teacher.html` sont des maquettes statiques (pas
branchées à Supabase) sur le même design système. La maquette enseignant reprend
le schéma `classrooms`/`classroom_students` déjà présent en base : en-tête de
classe avec code d'adhésion (ex. `FEN-7K2Q`), graphique de progression
hebdomadaire agrégée sur toute la classe, un bloc "quiz projetable" (mode
Kahoot-like mentionné dans l'analyse stratégique — bouton de démarrage, pas
encore de vraie session temps réel), et une liste d'élèves filtrable
(tous / en retard / prêts pour le Zeugma·Boss) avec pastille de statut Boss
et repère visuel distinct (fond rosé) pour les élèves inactifs depuis
plusieurs jours. Comme le tableau de bord parent, données 100% factices —
prochaine étape : lire directement `student_word_state`/`sessions` par
classe une fois Supabase branché.

**Quiz projetable (mode classe).** `fennec/app/classroomQuiz.html` est un
vrai écran, pas une maquette — accessible depuis le tableau de bord
enseignant (`wireframes/fennec-maquette-dashboard-teacher.html`, bouton
"▶ بدء الاختبار الجماعي"). L'enseignant choisit une semaine limite et un
nombre de questions ; l'app tire de vrais mots de `catalog.json` (via
`pickDistractors` du moteur réel, `src/queue.mjs`) et les présente en plein
écran, un à la fois, avec une barre de temps. Ce n'est **pas** un
Kahoot multi-appareils synchronisé (ça demanderait Supabase, mis de côté ce
chantier) : un seul appareil pilote (celui branché au vidéoprojecteur), la
classe répond à voix haute ou à main levée, l'enseignant clique la réponse
choisie par le consensus. Règle "jamais rouge" respectée : la bonne réponse
s'illumine en vert, les autres s'estompent, aucune ne devient rouge. Ajouté
au cache du service worker (`sw.js`, `fennec-v5`) pour rester utilisable
même avec une connexion de classe capricieuse.

**Curriculum Builder intégré (S33-S64, en continuité de Foundations).**
`catalog.json` embarque maintenant les deux banques de mots
(`data/foundations-banque-mots.json` : 339 items, S1-S32 ; `data/builder-banque-mots.json` :
150 items, S33-S64) fusionnées en un seul référentiel de 489 mots par
`build_catalog.py`. L'app n'a **aucune notion de "piste" (track)** : un
élève qui termine le Boss de S32 enchaîne directement sur S33 avec le même
pointeur de curriculum, sans code spécifique — c'est la logique déjà en
place (`main.mjs`/`session.mjs`/`bossSession.mjs` avancent simplement
`pointer.week`/`pointer.day`, sans plafond codé en dur) qui a rendu cette
intégration possible sans y toucher. Seuls deux fichiers ont changé :
`build_catalog.py` (fusion des deux banques, wordId Builder décalés de
`BUILDER_ID_OFFSET=10000` pour ne jamais entrer en collision avec
Foundations, worldId Builder continuant la numérotation Foundations :
B1→9 … B8→16) et `fennec/supabase/seed/generate_seed.py` (même logique,
tenu à jour même si Supabase reste hors-service ce chantier). La nouvelle
catégorie `grammaire` (introduite par Builder) retombe naturellement sur
la rotation d'écrans déjà existante (`screenKindFor` dans `queue.mjs`),
aucune modification du moteur n'a été nécessaire.

Validé en navigateur réel (Playwright) : pointeur placé directement à
S33·jour 1 (équivalent "l'enfant a fini Foundations"), session jouée
jusqu'à la victoire avec du vrai contenu Builder (world M9 affiché,
mot "yesterday" introduit), pointeur avancé à S33·jour 2 et persistant
après rechargement ; jour Boss de fin de monde B1 (S36) démarre
normalement ; semaine sans contenu nouveau (S64, fin du curriculum Builder)
affiche le message de repli existant au lieu de planter.

**BEM Sprint — les 8 semaines réelles, complet.** `fennec/app/bemSprint.html`
est un vrai écran, pas une maquette — accessible directement (pas encore lié
depuis `index.html` ni un tableau de bord), ou via `?week=1`/`?week=2`, ou
les onglets BS1 à BS8 en haut de l'écran (rechargent la page avec le
paramètre — pas de SPA routing ici, volontairement simple). Chaque semaine
a son texte support original écrit pour ce chantier (`bemSprintBS1.json`,
`bemSprintBS2.json` — jamais une copie d'une épreuve BEM réelle, voir la
note du curriculum à ce sujet) et ses 7 items : BS1 (Reading Comprehension)
— idée générale, vrai/faux justifié par citation exacte, questions WH,
référents ; BS2 (Lexis) — synonymes/antonymes trouvés dans le texte,
association mot/définition, déduction par le contexte ; BS3
(Mechanics & Morphology) — ponctuation/majuscules/apostrophe (QCM entre
versions correctes et fautives, pas de saisie libre à corriger) et
dérivation nom/adjectif (préfixe *un-*, suffixes *-ness/-ful*) ; BS4
(Syntax, la sous-partie la mieux notée) — concordance des temps en
contexte, préposition, article, question tag, connecteur logique ; BS5
(Pronunciation) — classement de sons à l'écrit (accentuation syllabique,
groupes *-ed*/*-s-es*, intrus), jamais de production orale puisque
l'épreuve réelle est écrite ; BS6 (Written Expression) — **structurellement
différent**, pas de QCM : une vraie situation d'intégration (notes
télégraphiques) avec une vraie zone de rédaction libre, vérification par
mots-clés que chaque note a été utilisée (signal grossier et assumé comme
tel, pas une prétention de corriger la grammaire), puis auto-évaluation à
la grille analytique du BEM — exactement l'activité prévue par le
curriculum (BS6·jour4), pas un artifice inventé pour l'occasion. L'écran
de fin affiche ✅ "tâche accomplie", pas un score chiffré qui serait
trompeur pour de la rédaction libre ; BS7 (premier examen blanc) —
combine les 6 semaines précédentes sur un texte inédit avec le **vrai
barème du BEM par item** (2,5+2,5+2 = 7 Reading Comprehension, 2+3+2 = 7
Mastery of Language, 6 Written Expression = 20 au total) et un vrai
chrono d'examen (`data.durationMinutes`, 120 par défaut, `?duration=`
pour la démo/le test) qui déclenche automatiquement la fin de l'épreuve
à expiration — même en plein milieu d'un item, exactement comme le jour
de l'examen réel ; BS8 (deuxième examen blanc) réutilise exactement le
même moteur que BS7, avec trois ajouts propres au curriculum : le score
de chaque semaine "examen" est persisté en localStorage (le seul état
persisté de tout BEM Sprint) pour calculer un **delta objectif réel**
entre BS7 et BS8 (même logique que les bilans S1→S16→S32 de Foundations),
un rappel statique de stratégie jour J (ordre des questions, ne pas
bloquer, ne jamais laisser une réponse vide), et une **fiche de révision
personnelle** — texte libre sauvegardé en localStorage, où l'élève note
ses propres erreurs récurrentes plutôt qu'un résumé générique du
programme (exactement BS8·jour5).
Lien retour vers
Madrassatidz en haut de l'écran et sur l'écran de fin (comme le reste de
l'app), plus un lien de retour vers Fennec sur l'écran de fin.
**Choix d'architecture assumé, pas neutre** : le document laissait deux
options ouvertes (détourner le SRS existant vers des motifs d'erreur, ou
construire un moteur séparé) ; ces deux premières semaines ne tranchent
ni l'une ni l'autre — c'est un mode "practice" autonome sans état persisté
(comme `classroomQuiz.mjs`), qui prouve que le format d'activités fonctionne
avant d'investir dans l'une des deux architectures. **Les 8 semaines de
BEM Sprint sont maintenant intégrées.** Validé en navigateur réel : score
exact (7/7 sur BS1 à BS5 en répondant juste, testé aussi avec des
réponses fausses), BS6 testé avec un texte incluant volontairement 3 des
5 notes (détection keyword correcte), BS7 testé en réussite totale
(20/20, répartition exacte 7/7/6 par partie) et en expiration du chrono
(arrêt automatique à 0, score partiel exact sur ce qui a été répondu),
BS8 testé avec un score volontairement mélangé (13,5/20) affichant le
bon delta face à un BS7 à 20/20 (▼ -6,5), fiche de révision persistée et
relue correctement depuis localStorage, sélecteur de semaine fonctionnel,
liens de fin fonctionnels, correction "jamais rouge" (bonne réponse en
surbrillance verte/navy, jamais de rouge), rejouable.

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

# 3. Régénérer et charger le référentiel de mots (489 items, Foundations + Builder)
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
IndexedDB (335 mots à l'époque de cette validation initiale, 489 aujourd'hui
avec Builder intégré — voir plus haut), session jouée du premier écran à la
victoire avec le vrai moteur (introduction, révision, plan d'écrans
dynamique), état SRS persisté avec la bonne échéance calendaire, position
dans le curriculum qui survit à un rechargement de page, mot redevenant "dû"
en révision après avance de l'horloge virtuelle — et **fonctionnement
complet réseau totalement coupé** après un premier chargement (service
worker + cache de l'app shell).

## Prochaines briques (hors scope de ce chantier)

- Vrais assets audio/image (actuellement : texte + synthèse vocale du
  navigateur, emoji-placeholder pour 196/213 mots lexique ; `word.audioUrl`/
  `word.imageUrl` déjà prévus dans le schéma).
- Brancher les tableaux de bord parent/enseignant (actuellement des
  maquettes à données figées, `wireframes/fennec-maquette-dashboard-*.html`)
  et le portail Madrassatidz à un vrai projet Supabase — mis de côté ce
  chantier (quota de projets gratuits bloqué sur le compte, cf. historique).
- BEM Sprint n'a toujours pas de moteur de répétition espacée propre (cf.
  la note d'architecture non tranchée en tête de `bemSprint.mjs`) : c'est
  un mode "practice" sans suivi de progression dans le temps, pas encore
  un vrai troisième pilier au niveau de Foundations/Builder sur ce plan.

Déjà fait dans ce chantier (à ne pas reproposer sans raison nouvelle) :
habillage visuel définitif (palette marine/rouge/crème, RTL, règles
erreur-douce), écran Boss réel avec chemins victoire et défaite testés,
profils multiples (fratrie), quiz projetable en mode classe, curriculum
et intégration complets de Foundations (32 semaines) et Builder (8
mondes), curriculum et intégration complets de BEM Sprint (8 semaines,
BS1-BS8, y compris les deux examens blancs chronométrés avec delta
objectif), portail Madrassatidz reliant les trois pistes et les deux
tableaux de bord.
