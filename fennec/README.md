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
    word-emoji.json            # illustrations emoji pour 211/286 mots lexique (placeholder)
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
un emoji univoque pour 211 des 286 mots "lexique" (Foundations + Builder)
— les cartes-options (écoute→touche, lecture→touche) l'utilisent quand il
existe. Les mots restants (jours de la semaine, adjectifs relationnels
comme big/small/tall...)
n'ont pas d'emoji fidèle et unique : ils retombent sur le texte anglais,
jamais sur un emoji forcé ou trompeur. Reste un placeholder temporaire —
à remplacer par de vraies illustrations quand elles existeront.

**Correctif de densité visuelle, suite à un retour direct sur l'app réelle
("le contenu est pauvre", écrans qui paraissent vides).** Plusieurs écrans
courants (intro de session, découverte d'un mot nouveau) n'étaient jamais
enveloppés dans `.win` — la classe qui centre et donne du poids visuel au
contenu — et flottaient donc en haut de l'écran avec un grand vide en
dessous. Corrigé dans `session.mjs`/`screens.mjs` (ajout du conteneur
`.win`) et dans `styles.css` :
- `.win` devient une vraie carte visible (fond, bordure, ombre portée),
  pas du texte flottant sur le fond.
- Fond de page légèrement texturé (pastilles très diluées, marine/rouge)
  plutôt qu'un aplat uni.
- Avatar-fox agrandi (120→140px) avec un halo doux.
- Barre de développement resserrée sur une seule ligne compacte (elle
  dominait visuellement l'écran alors que ce n'est qu'un outil de test,
  jamais montré à un vrai enfant).

Corrigé dans la foulée un bug de balisage préexistant que ce changement a
rendu visible : plusieurs écrans (`bossSession.mjs`, l'écran de fin de
programme dans `main.mjs`) plaçaient un emoji dans `<div class="win emoji-lg">`
— la classe `win` en trop créait une carte imbriquée dans la carte
parente (invisible tant que `.win` n'avait pas de bordure/ombre propres).
Retiré partout, ne reste que `emoji-lg`. Vérifié en navigateur réel sur
les 5 écrans concernés (sélecteur de profil, intro de session, découverte
d'un mot, intro Boss, écran de fin de programme).

Volontairement pas traité dans cette passe (périmètre validé avec
l'utilisateur avant de commencer) : remplacer les emoji par de vraies
illustrations générées — un chantier à part, plus lourd, à cadrer
séparément.

**Généralisé à tous les écrans de jeu.** Le même vide se retrouvait sur les
écrans QCM (`listen_touch`/`read_touch`), vrai/faux, "dis le mot à voix
haute", construction de phrase et phonics — aucun n'était enveloppé dans
`.win`. `.win` passe de `margin:auto` (bloc centré à la taille de son
contenu) à `flex:1` avec `justify-content:center` : la carte occupe
maintenant la majorité de l'écran et centre son contenu à l'intérieur —
sauf s'il porte lui-même un `flex:1` (la grille de QCM), qui prend alors
naturellement toute la place restante dans la carte plutôt que dans tout
l'écran. Les 5 renderers concernés (`renderChoice`, `renderTrueFalse`,
`renderSayIt`, `renderConstruct`, `renderPhonics` dans `screens.mjs`)
enveloppent désormais leur contenu dans `.win`. Validé en navigateur réel
sur les 5 types d'écran (semaine 5, jour 2) plus l'écran de fin de session
— déjà enveloppé dans `.win`, continue de fonctionner à l'identique.

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
programme (exactement BS8·jour5). Ces deux clés (score d'examen, fiche de
révision) sont namespacées par profil actif comme le reste de l'app
(`fennec_active_profile`, même convention que `fennec_pointer_<id>` dans
`main.mjs`) — sans quoi deux enfants du même foyer sur le même téléphone
auraient partagé leur score et leur fiche, une incohérence trouvée et
corrigée après coup.
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

**Correctif important : les Boss de semaines de pure révision ne se
déclenchaient jamais.** Chaque semaine de Boss du curriculum (Foundations
S4/S8/S12/S16/S20/S24/S28/S32, Builder S64) est une semaine qui n'introduit
**aucun** mot par conception — c'est écrit noir sur blanc comme "Révision"
dans les deux documents de curriculum. `buildBossPlan()` (`src/queue.mjs`)
filtrait sur `introWeek === week` : sur 7 des 8 mondes de Foundations et
le Boss final de Builder, le plan de défis était donc vide, et l'app
sautait silencieusement à la semaine suivante sans jamais faire jouer le
Boss — trouvé en testant le mécanisme d'enregistrement audio (ci-dessous)
sur S12. Corrigé pour piocher dans les 4 semaines du monde en cours
(`introWeek <= week && introWeek > week - 4`), pas la seule semaine du
Boss ; nouveau test de non-régression dans `test/queue.test.js`. Validé en
navigateur réel : S12 déclenche désormais un vrai "تحدي الزعيم" au lieu de
sauter à S13.

**Enregistrement audio des Boss (jusqu'ici jamais implémenté).** L'analyse
stratégique (§4.4) et les deux curriculums décrivent un enregistrement de
l'enfant à chaque Boss majeur (Foundations S12/S16/S32, chaque Boss de
Builder) comme *le* levier de rétention parent — mais aucun code
n'existait pour ça avant ce chantier : chaque Boss ne faisait que du
texte/QCM. `fennec/app/recordedBossWeeks.mjs` liste ces semaines avec la
consigne exacte du document source ; `bossSession.mjs` insère un écran
d'enregistrement (MediaRecorder natif, sans dépendance) entre la victoire
du Boss et le partage aux parents pour ces semaines, avec lecture
immédiate et sauvegarde du Blob dans un nouvel object store IndexedDB
`recordings` (`src/db.mjs`, DB_VERSION 2). Dégradation propre si le micro
est indisponible/refusé (bouton "تخطي ومتابعة") — ne bloque jamais la
progression de l'enfant. Validé en navigateur réel (Chromium avec faux
micro) : capture audio réelle, lecture via blob URL, sauvegarde en
IndexedDB avec le bon studentId/semaine, et repli fonctionnel sans micro.
Ce que ça ne fait pas encore : le tableau de bord parent (maquette) ne lit
toujours pas ces enregistrements réels — ses cartes "تسجيلات صوتية"
restent des données factices, cf. plus haut. Cela dit, les enregistrements
sont maintenant réécoutables **dans l'app elle-même** (ci-dessous) : ils
n'étaient plus tout à fait "écrits mais inutilisables".

**Complément : écran de réécoute des enregistrements.** Juste après le
correctif ci-dessus, un enregistrement sauvegardé n'était lisible qu'une
fois, juste après l'avoir fait — aucun moyen de le réécouter ensuite, seul
le tableau de bord parent (maquette non branchée) était censé le faire un
jour. Ajouté un lien "🎙 التسجيلات" sur chaque tuile de l'écran "من يلعب
اليوم؟" (`renderRecordings()`, `main.mjs`) qui liste les enregistrements
du profil (triés par semaine, lecteur `<audio controls>` natif par Blob
IndexedDB), sans activer le profil ni dépendre du réseau — juste
`store.getRecordings()`, déjà en place. État vide géré explicitement.
Validé en navigateur réel : deux enregistrements factices sauvegardés
directement en IndexedDB apparaissent triés (S12 avant S16) avec lecteur
audio fonctionnel, un profil sans enregistrement affiche le message vide,
et le bouton "← رجوع" revient au sélecteur de profil.

**Correctif : l'emoji ne s'affichait jamais dans le quiz projetable.**
`word-emoji.json` est indexé par `wordId` (cf. `screens.mjs`, qui fait
`wordEmoji[String(opt.wordId)]` correctement) mais `classroomQuiz.mjs`
cherchait `wordEmoji[q.word.english]` — une clé qui n'existe jamais dans ce
fichier. Résultat : sur les 193 mots qui ont pourtant un emoji, aucun ne
s'affichait jamais en mode classe ; chaque question retombait
silencieusement sur le texte seul. Corrigé pour indexer par `wordId`,
comme `screens.mjs`. Validé en navigateur réel sur 8 questions
consécutives : 4/8 affichent bien leur emoji (black→⚫, wash→🧼, look!→🔍,
touch→☝️), les 4 autres portent sur des mots sans emoji couvert et restent
sur texte seul — comportement attendu, pas un nouveau bug.

**Correctif plus profond, trouvé en creusant l'emoji ci-dessus : des
leurres pouvaient être indiscernables de la bonne réponse.** 17 mots
apparaissent deux fois dans le catalogue fusionné (489 mots) avec deux
`wordId` différents — une fois introduits en Foundations, une fois
repris/renforcés en Builder à une semaine ultérieure (ex. "play" wordId
289 et 10007 ; "fast", "week", "camel", "desert"... la liste complète est
dans le commentaire de `pickDistractors`, `src/queue.mjs`). `pickDistractors()`
n'excluait que le `wordId` du mot cible, pas ces doublons par texte : un
écran pouvait donc (a) piocher l'autre occurrence du mot cible comme
leurre — bonne réponse et leurre identiques — ou (b) piocher deux leurres
qui sont eux-mêmes la même paire dupliquée entre eux (observé en test :
options `["week", "fast", "fast"]`, deux "fast" différents). Dans les deux
cas, deux options du même écran affichaient le même texte/emoji,
indiscernables pour l'enfant. Corrigé en excluant aussi par texte anglais
et en dédupliquant le pool avant tirage (deux nouveaux tests de
non-régression dans `test/queue.test.js`). Vérifié par un balayage complet
en navigateur réel : ~9700 écrans générés (toutes les semaines du
catalogue, sessions quotidiennes et Boss, 10-20 tirages aléatoires par
semaine) — zéro option dupliquée après correction, contre 1 détectée avant.

Cette même confusion Foundations/Builder expliquait aussi pourquoi
`word-emoji.json` affichait 0/73 mots Builder illustrés malgré plusieurs
mots repris du dictionnaire déjà curaté pour Foundations : le fichier
n'avait simplement jamais été régénéré depuis l'ajout de Builder au
catalogue, et le garde-fou anti-doublon de `build_word_emoji.py`
(légitimement strict à l'origine) rejetait la régénération dès qu'un même
mot anglais apparaissait deux fois — exactement le cas Foundations/Builder
ci-dessus. Garde-fou assoupli pour ne rejeter que deux mots anglais
*différents* partageant un emoji (toujours interdit), pas la même
répétition légitime d'un même mot ; régénéré : 211/286 mots lexique
illustrés désormais (was 196/213 sur Foundations seul, Builder passe de
0/73 à 15/73 pour les mots qu'il partage avec Foundations).

**Correctif : icône et splash screen PWA d'une ancienne palette.**
`manifest.webmanifest` (`theme_color: #177245`, `background_color:
#EFE3CB` — vert/doré) et `icons/icon.svg` (fond `#177245`) dataient d'une
itération de design antérieure au système marine/rouge/crème actuellement
en place partout ailleurs (`styles.css`, le `<meta name="theme-color"
content="#0A3161">` déjà correct d'`index.html`) : jamais mis à jour au
moment du handoff du design système définitif. Concrètement, "ajouter à
l'écran d'accueil" installait une icône verte et un splash screen
vert/doré, en contradiction immédiate avec l'app marine/rouge/crème qui
s'affiche juste après. Aligné sur les tokens déjà en vigueur partout
ailleurs (`#0A3161` marine, `#F5F3EE` crème) — pas une nouvelle décision
de design, une correction de cohérence avec un système déjà arrêté et
documenté. Validé en navigateur réel : manifest, meta `theme-color` et
`icon.svg` renvoient désormais tous la même couleur marine.

**Correctif : aucun écran de fin de programme au-delà de S64.** Une fois le
Boss du correctif ci-dessus réellement déclenché partout, un second trou est
apparu : `main.mjs` ne savait pas dire "le programme est terminé". Passé la
dernière semaine de contenu (S64, fin de Builder B8), `buildDailyQueue()`/
`buildScreenPlan()` renvoyaient un plan vide tous les jours ("لا يوجد شيء
للمراجعة اليوم!") et le pointeur continuait d'avancer indéfiniment sans que
rien ne le signale à l'enfant — un cul-de-sac silencieux plutôt qu'une vraie
fin. Ajouté `curriculumComplete()` (`src/queue.mjs`, testé) : dès que le
pointeur dépasse la fin du dernier monde de 4 semaines, `boot()` affiche un
écran "🏁 البرنامج كاملاً" avec un lien direct vers BEM Sprint (la suite
documentée) et un retour à Madrassatidz, au lieu de continuer la boucle à
vide. Validé en navigateur réel (pointeur forcé à S65) : écran de fin
correct, clic sur "ابدأ BEM Sprint ←" navigue bien vers `bemSprint.html` ;
une session normale (S1) n'est pas affectée.

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

Le projet Supabase dédié à Fennec existe déjà (`fennec`, ref
`khmjrwemtjrqdrmvsdlg` — voir section "Supabase — projet réel branché"
ci-dessus) : `fennec/app/index.html` y est déjà connecté, rien à faire pour
le développement courant. Ce qui suit ne sert qu'à recréer un projet
Supabase Fennec **from scratch** (ex. environnement séparé) :

```bash
# 1. Créer un NOUVEAU projet Supabase dédié à Fennec (PAS le projet Kairos/Mida
#    existant, PAS forcément le projet khmjrwemtjrqdrmvsdlg déjà en place)
supabase link --project-ref <ref-du-nouveau-projet>

# 2. Appliquer les migrations
supabase db push
# ou, mot à mot :
psql "$DATABASE_URL" -f fennec/supabase/migrations/0001_schema.sql
psql "$DATABASE_URL" -f fennec/supabase/migrations/0002_rls.sql

# 3. Régénérer et charger le référentiel de mots (489 items, Foundations + Builder)
python3 fennec/supabase/seed/generate_seed.py
psql "$DATABASE_URL" -f fennec/supabase/seed/seed_words.sql

# 4. Activer la connexion anonyme (désactivée par défaut sur un projet neuf) :
#    Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins

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

## Supabase — projet réel branché

Un projet Supabase **dédié à Fennec** existe désormais (`fennec`, ref
`khmjrwemtjrqdrmvsdlg`, région eu-west-1 — séparé du projet Kairos/Mida
existant, comme prévu plus haut). Plan Pro (nécessaire : le compte avait
déjà atteint la limite de 2 projets gratuits). État :

- **Schéma + RLS appliqués** (`0001_schema.sql`, `0002_rls.sql`), corrigés
  au passage : le `CHECK` de `words.category` ne listait pas `'grammaire'`
  (catégorie introduite par Builder après l'écriture du schéma initial —
  jamais testé jusqu'ici puisque Supabase était mis de côté) ; la fonction
  utilitaire `fennec_visible_student()` est passée du schéma `public` à
  `internal` (une fonction `SECURITY DEFINER` dans `public` est appelable
  directement par n'importe quel compte via `/rest/v1/rpc/...`, jamais
  l'usage prévu) ; chaque `auth.uid()` direct dans une policy est enveloppé
  dans `(select auth.uid())` (lint `auth_rls_initplan` — sans ça, Postgres
  le réévalue à chaque ligne). Zéro alerte de sécurité restante
  (`get_advisors`).
- **Référentiel seedé** : 16 mondes, 489 mots (`fennec/supabase/seed/`).
- **Connexion anonyme par appareil** (`ensureAnonSession`/`ensureGuardian`/
  `ensureStudent`, `fennec/src/sync.mjs`) : pas d'écran de login, cohérent
  avec le principe "aucune friction avant de jouer" déjà en place partout
  ailleurs — un appareil = une session Auth anonyme = un guardian ; chaque
  profil enfant local devient une ligne `students` (réutilise directement
  `profile.id` comme id distant, aucune table de correspondance à
  maintenir). Câblé dans `main.mjs` (`maybeConfigureSync`), testé
  unitairement (`test/sync.test.js`).
- **Config injectée** dans `fennec/app/index.html` (URL + clé publishable —
  cette clé est conçue pour être exposée côté client, c'est la RLS qui
  protège les données, pas le secret de la clé).
- **Vérifié réellement, pas supposé** : le bac à sable de cette session ne
  peut pas atteindre `esm.sh` ni `*.supabase.co` (proxy réseau restreint à
  quelques domaines) — le chemin auth/RLS a donc été vérifié en déployant
  une Edge Function temporaire (`verify-sync-flow`, désactivée depuis — un
  simple stub HTTP 410, aucun outil ne permet de supprimer une Edge
  Function via l'API) qui reproduit exactement
  `ensureAnonSession → ensureGuardian → ensureStudent` côté serveur (réseau
  Supabase, pas le bac à sable), invoquée depuis Postgres via `pg_net`
  (installé puis retiré une fois la vérification faite). Deux vrais bugs
  trouvés et corrigés grâce à ce test, jamais visibles avant puisque
  Supabase était mis de côté depuis le début du chantier :
  1. **Connexion anonyme désactivée par défaut** sur un projet neuf
     (`"Anonymous sign-ins are disabled"`) — activée manuellement dans
     **Dashboard → Authentication → Sign In / Providers → Anonymous
     Sign-Ins** (aucun outil ne permet de le faire à distance).
  2. **Récursion infinie entre les policies `students` et
     `classroom_students`** (`infinite recursion detected in policy for
     relation "students"`) : la policy select de `students` interrogeait
     `classroom_students` pour la branche "élève inscrit dans une classe",
     dont la policy select interroge à son tour `students` pour sa propre
     branche "élève de ce tuteur" — un cycle A→B→A. Cassait l'écriture de
     `student_word_state`/`sessions` (la sync réelle de l'app). Corrigé en
     passant cette branche par un helper `SECURITY DEFINER`
     (`internal.fennec_teacher_sees_student`, même principe que
     `fennec_visible_student` déjà en place pour les autres tables — une
     fonction `SECURITY DEFINER` contourne RLS sur ses propres requêtes
     internes, donc pas de ré-entrée dans la policy qu'elle interroge).
  Après ces deux corrections, un run complet confirme : connexion anonyme,
  création guardian/student, écriture `student_word_state`/`sessions`, ET
  qu'un guardian ne peut pas créer un élève rattaché à un autre guardian
  (RLS refusée comme attendu, `blockedAsExpected: true`). Toutes les
  données de test ont été nettoyées après coup (0 users/guardians/students
  restants). Zéro alerte de sécurité restante après ce second correctif
  (`get_advisors`) ; les nouvelles alertes "accès anonyme" (WARN) qui
  apparaissent en activant la connexion anonyme sont attendues et
  acceptées ici — un compte anonyme EST le tuteur légitime du foyer dans ce
  modèle, pas un accès à distinguer d'un compte "permanent" qui n'existe
  pas encore.
**Tableau de bord parent branché au projet réel.** `wireframes/fennec-maquette-dashboard-parent.html`
lisait jusqu'ici des données figées en dur. Réécrit pour lire le vrai
projet Supabase (même `FENNEC_SUPABASE_URL`/`KEY` que l'app, même session
anonyme — partagée via `localStorage` si la page est servie depuis la même
origine que `fennec/app/`, sans écran de login) :
- Sélecteur d'enfants réel (`students` du guardian courant), identité et
  position (`current_week`) réelles.
- Tuiles réelles : mots maîtrisés (`student_word_state.mastered_at`),
  précision moyenne (`screens_correct`/`screens_total` des sessions
  quotidiennes), nombre de séances jouées cette semaine.
- Graphique d'activité hebdomadaire calculé à partir des vraies minutes de
  jeu (`finished_at - started_at` de chaque session, sommées par semaine) —
  pas des minutes inventées.
- Historique Boss réel (`sessions` où `kind='boss'`, `boss_passed`,
  `boss_variant`, score réel).
- Bilans trimestriels (`placement_tests`) et delta réel entre deux bilans —
  légitimement vide pour l'instant, aucune fonctionnalité de l'app
  n'écrit encore dans cette table.
- État vide honnête (pas de session, pas de guardian, ou aucun enfant) au
  lieu de données factices : *"لم يلعب أي طفل بعد على هذا الجهاز"*.
- Les preuves audio restent explicitement non branchées : les
  enregistrements vivent en IndexedDB local (voir plus haut), aucune
  fonctionnalité ne les envoie vers `parent_reports.audio_url` — la carte
  le dit maintenant explicitement plutôt que d'afficher des exemples
  inventés.

Ce que ça ne fait pas encore : le tableau de bord enseignant reste une
maquette à données figées (aucune fonctionnalité de classe/code
d'inscription n'existe dans l'app réelle pour l'instant, cf. plus bas) ; le
portail Madrassatidz n'affiche toujours aucune donnée réelle (c'est un
simple aiguillage vers les trois pistes, pas un tableau de bord). Comme
pour le reste de la sync, non testable en bout en bout dans ce bac à sable
(bloque `esm.sh`) — vérifié à la place que la page se dégrade proprement
(message d'erreur clair, aucun crash JS) quand `esm.sh` est inatteignable.

**Correctif critique : le branchement Supabase pouvait empêcher l'app
entière de démarrer.** `maybeConfigureSync()` (`fennec/app/main.mjs`)
importait `supabase-js` depuis `esm.sh` sans jamais protéger cet import —
et `boot()` l'attend sans le protéger non plus. Sur un réseau qui bloque ce
CDN (filtre scolaire, bloqueur de pub, panne CDN passagère, ou tout
simplement le bac à sable de ce chantier), l'échec de l'import remontait
tel quel jusqu'à `boot()` et empêchait TOUTE la suite de s'exécuter — ni
session quotidienne, ni Boss, ni écran de fin de programme, rien. Exactement
la panne que l'architecture "offline-first" de tout le reste de l'app est
censée rendre impossible. Trouvé en testant réellement une session dans cet
environnement (qui bloque justement `esm.sh`). Corrigé en enveloppant toute
la fonction dans un seul `try/catch` : un CDN indisponible désactive
silencieusement la sync pour cette fois-ci (comme prévu), plus jamais
l'app entière. Validé en navigateur réel : session complète jouée sans
erreur JS dans cet environnement où `esm.sh` reste bloqué.

**Deuxième correctif, trouvé dans la foulée : l'ordre de synchronisation
des sessions pouvait bloquer la file pour de bon.** Les `session_event`
(une réponse par écran) sont mis en file (`pending_sync`) tout au long
d'une session, alors que le `session_summary` qui crée la ligne `sessions`
distante n'était mis en file qu'à la toute fin (`finish()`). La policy RLS
d'écriture de `session_events` exige que `session_id` corresponde à une
ligne `sessions` déjà visible — donc si la sync tournait avant la fin
d'une session (première session réelle d'un enfant, ou simplement un
retour réseau en plein milieu), le tout premier `session_event` était
systématiquement rejeté et bloquait la file pour toujours (les tentatives
suivantes repartent du même point, avec la même erreur). Vérifié
réellement contre le projet Supabase (le rejet apparaît comme une erreur
RLS `42501`, pas une violation de clé étrangère — mais le résultat pratique
est identique). Corrigé en mettant en file un `session_summary` "placeholder"
(`finishedAt: null`) dès le DÉBUT de la session (`session.mjs`/
`bossSession.mjs`), avant tout `session_event` — `sendOne()` fait déjà un
`upsert`, donc le résumé final à la fin remplace proprement le placeholder.
Revérifié de bout en bout contre le projet réel : placeholder → deux
`session_event` → résumé final upserté par-dessus (`18/16`, `finished_at`
renseigné) → tout accepté, dans cet ordre précis.

## Prochaines briques (hors scope de ce chantier)

- Vrais assets audio/image (actuellement : texte + synthèse vocale du
  navigateur, emoji-placeholder pour 211/286 mots lexique ; `word.audioUrl`/
  `word.imageUrl` déjà prévus dans le schéma).
- Tableau de bord enseignant toujours en données figées (pas de
  fonctionnalité classe/code d'inscription dans l'app réelle) ; portail
  Madrassatidz reste un aiguillage statique.
- Synchroniser les enregistrements audio (IndexedDB local) vers
  `parent_reports.audio_url` pour que le tableau de bord parent les affiche
  réellement.
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
tableaux de bord, correctif du Boss sur les semaines de pure révision,
enregistrement audio réel des Boss majeurs et écran de réécoute dans
l'app, écran de fin de programme renvoyant vers BEM Sprint, correctif de
l'emoji manquant dans le quiz projetable, correctif des leurres
indiscernables sur les 17 mots repris entre Foundations et Builder,
régénération de word-emoji.json pour couvrir aussi Builder, alignement de
l'icône/manifest PWA sur la palette marine/rouge/crème actuelle (au lieu
d'un vert/doré resté d'une itération antérieure), création + branchement
d'un vrai projet Supabase dédié (schéma, RLS, seed, connexion anonyme),
correctif d'une récursion RLS infinie entre `students`/`classroom_students`,
branchement réel du tableau de bord parent à ce projet, correctif d'une
panne complète de l'app quand le CDN de supabase-js est inatteignable, et
correctif de l'ordre de sync qui pouvait bloquer la file pour de bon dès la
première session, et garde-fou similaire sur le fetch du contenu BEM
Sprint (message d'erreur clair plutôt qu'un plantage de page).
