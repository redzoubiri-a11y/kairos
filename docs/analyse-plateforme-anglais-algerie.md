# Analyse stratégique — Plateforme ludique d'apprentissage de l'anglais pour l'Algérie (primaire → BEM)

> Document de conception fondateur. Objectif : définir la méthode la plus **efficiente** pour qu'un élève algérien, parti de zéro, obtienne des résultats spectaculaires et mesurables à la fin d'une année scolaire — le site étant un **complément** de l'école, pas son remplaçant.

---

## 1. Le contexte algérien — ce qui rend ce projet différent d'un « Duolingo de plus »

### 1.1 Le moment historique
- L'anglais est enseigné en **3e année primaire depuis la rentrée 2022** (réforme présidentielle). Les enseignants ont été recrutés et formés dans l'urgence : volume horaire faible (≈ 1h30/semaine), méthodes hétérogènes, peu de supports audio de qualité.
- Au collège (CEM), l'anglais est une matière d'examen au **BEM** (épreuve écrite : compréhension de texte, maîtrise de la langue, production écrite guidée — *situation d'intégration*).
- Résultat : une génération entière de parents **veut** que ses enfants apprennent l'anglais (perçu comme la langue de l'avenir, des études, de YouTube, du gaming, du travail à distance) mais **ne peut pas les aider** (les parents ont été scolarisés en français). C'est exactement l'espace qu'un support numérique doit occuper : **le tuteur que la famille n'a pas.**

### 1.2 La réalité sociolinguistique
L'élève algérien n'arrive pas « vierge » : il navigue déjà entre **darja** (langue maternelle), **arabe standard** (langue de scolarisation), **tamazight** (selon les régions), et **français** (environnement, matières scientifiques plus tard). Trois conséquences de conception :

1. **L'anglais est la langue « neutre »** : contrairement au français, il ne porte pas de charge historique ni de marqueur de classe sociale. Psychologiquement, c'est un terrain vierge où l'élève ne part pas « en retard sur les autres ». La plateforme doit exploiter cet imaginaire positif : l'anglais comme super-pouvoir, pas comme matière scolaire.
2. **L'élève est déjà un traducteur né.** Le code-switching quotidien est un atout cognitif prouvé. La méthode ne doit pas interdire la langue maternelle mais s'en servir comme échafaudage (consignes en arabe au début, retirées progressivement).
3. **L'alphabet latin n'est pas acquis en 3AP.** L'élève de primaire apprend l'alphabet latin *en même temps* via le français (introduit en 3AP aussi). Un parcours « vrai zéro » doit donc inclure **l'alphabétisation latine + la phonétique anglaise**, ce qu'aucune grande plateforme mondiale ne fait pour ce public. C'est un avantage concurrentiel décisif.

### 1.3 La réalité matérielle
- **Android d'abord** (>90 % du parc), souvent un téléphone **partagé** avec la mère ou la fratrie, en fin de journée.
- Data mobile chère et irrégulière, ADSL instable : le produit doit être **offline-first** (PWA légère, audio compressé, leçons pré-téléchargées en Wi-Fi).
- Beaucoup d'élèves passent par les **écoles privées de soutien** (cours particuliers) : la plateforme peut être soit un concurrent, soit — bien plus malin — **un outil que ces écoles et les enseignants adoptent** (mode classe, codes de groupe).

---

## 2. Benchmark mondial — ce qu'il faut prendre, ce qu'il faut refuser

| Plateforme | Ce qui marche | Ce qu'il faut refuser |
|---|---|---|
| **Duolingo** | Boucle quotidienne courte, streak, feedback immédiat, répétition espacée intégrée, mascotte affective | Gamification devenue fin en soi (on « joue à Duolingo » sans parler), pas d'alignement scolaire, lecture/écriture supposées acquises |
| **Duolingo ABC / Lingokids** | Alphabétisation + phonics pour les 4-8 ans, TPR (toucher, glisser, répéter) | Contenu culturellement américain, anglais oral seulement |
| **Khan Academy** | **Mastery learning** : on n'avance pas tant que ce n'est pas maîtrisé ; tableau de bord enseignant/parent | Austère pour un enfant de 8 ans |
| **British Council LearnEnglish Kids / BBC Bitesize** | Contenu pédagogiquement irréprochable, chansons, histoires, alignement sur des examens | Zéro boucle d'engagement : l'enfant n'y revient pas seul |
| **Prodigy Math** | Le jeu EST l'exercice (RPG où les combats se gagnent en répondant) : engagement record chez les 8-12 ans | Le déguisement de jeu peut masquer un contenu faible si mal fait |
| **Anki / Quizlet** | La répétition espacée (SRS) est le mécanisme n°1 de rétention du vocabulaire, prouvé depuis Ebbinghaus | Inutilisable directement par un enfant : il faut la cacher dans le jeu |
| **Kahoot** | Le multijoueur en classe transforme la révision en événement social | Éphémère, aucune mémoire longue |

**Synthèse** : aucune plateforme mondiale ne combine (a) alphabétisation latine + phonics, (b) mastery learning, (c) SRS invisible, (d) alignement sur un examen national, (e) offline-first arabe/darja. La combinaison de ces cinq éléments **est** le produit.

---

## 3. Les fondations scientifiques — ce qui fait réellement progresser (le « support » ne suffit pas)

Le brief le dit : *ce n'est pas le support qui fait avancer l'apprentissage*. Exact. Un siècle de recherche donne les mécanismes qui font avancer, et le site n'est que la machine qui les rend inévitables :

1. **Retrieval practice (l'effet test)** — se souvenir activement > relire. Chaque écran doit être une question, jamais une page à lire. Roediger & Karpicke : +50 % de rétention à long terme vs relecture.
2. **Répétition espacée** — revoir juste avant d'oublier. Un mot vu à J0, J1, J3, J7, J16, J35 est acquis à vie. C'est l'algorithme central du produit, invisible pour l'enfant (il croit « débloquer des mondes », le système lui ressert en réalité ce qu'il est sur le point d'oublier).
3. **Mastery learning (Bloom)** — le tutorat individuel avec exigence de maîtrise produit un gain de 2 écarts-types (« problème 2 sigma »). Traduction produit : on ne passe pas au monde suivant sous 80 % de réussite, mais l'échec est indolore (on rejoue, on ne redouble pas).
4. **Input compréhensible (Krashen)** — on acquiert une langue en comprenant des messages légèrement au-dessus de son niveau (i+1), dans un climat sans anxiété. Traduction : histoires audio illustrées, dessins animés courts, où 90 % est déjà connu et 10 % est nouveau et deviné par le contexte.
5. **Phonics systématique** — pour lire l'anglais de zéro, l'approche synthétique (son → lettre → fusion) écrase toutes les autres (rapports nationaux UK/US). Indispensable ici puisque l'alphabet latin lui-même est en cours d'acquisition.
6. **Charge cognitive (Sweller)** — un seul objectif par leçon, écrans épurés, consignes minimales. Le « ludique » ne doit jamais ajouter du bruit à l'apprentissage : **le jeu doit être l'exercice, pas autour de l'exercice** (leçon de Prodigy).
7. **Feedback immédiat et correctif** — pas seulement « faux », mais *pourquoi*, montré, puis re-testé 2 écrans plus loin.

---

## 4. Conception psychologique — pourquoi l'enfant reviendra demain

### 4.1 Théorie de l'autodétermination (Deci & Ryan) : les 3 carburants
- **Compétence** : progression visible et honnête (carte de mondes, mots maîtrisés, badge « je sais me présenter »). L'enfant doit réussir ~80 % du temps — le taux qui maximise l'apprentissage ET le plaisir.
- **Autonomie** : micro-choix constants (choisir son avatar, l'ordre des activités du jour, le thème de l'histoire) dans un chemin globalement imposé par l'algorithme.
- **Relation** : une **mascotte** qui accueille par le prénom, se souvient (« hier tu as appris *hungry* ! »), et un mode duo/fratrie (voir §6).

### 4.2 Les pièges à éviter absolument
- **Sur-gamification extrinsèque** : trop de pièces/gemmes détruit la motivation intrinsèque (effet de surjustification). Règle : les récompenses célèbrent la **maîtrise**, jamais le simple temps passé.
- **Anxiété langagière** : l'école algérienne note et sanctionne ; la plateforme doit être l'espace où **l'erreur est gratuite**. Jamais de note rouge, jamais de classement public par niveau, jamais de « game over ».
- **Streak punitif** : le streak à la Duolingo culpabilise. Version saine : « flamme d'équipe » hebdomadaire (4 jours sur 7 suffisent), gelable, tournée vers l'effort régulier et non la perfection.
- **Deux psychologies d'âge distinctes** :
  - **7-10 ans (primaire)** : magie, personnages, chansons, TPR (mimer, toucher, glisser), sessions de 10 min, zéro texte de consigne (tout en audio/icônes).
  - **11-15 ans (CEM)** : statut social, identité, humour, culture (foot, gaming, musique), défis entre amis, et — décisif en 4AM — **la promesse concrète du BEM** (« ce module = 3 points sur ta production écrite »).

### 4.3 Philosophie du produit
L'anglais n'est pas une matière, c'est **une clé**. Le fil narratif de toute la plateforme : *chaque monde débloqué débloque un morceau du monde réel* (comprendre une chanson, un tutoriel de jeu, écrire à un correspondant, lire un panneau d'aéroport). L'objectif philosophique : former des élèves qui **s'approprient** la langue au lieu de la subir — l'exact inverse du rapport scolaire classique aux langues en Algérie. Et une éthique assumée : outil d'**équité** (l'élève de Djelfa a le même tuteur que l'élève d'Hydra), gratuit ou quasi-gratuit dans son cœur, sans publicité, sans exploitation de l'attention.

### 4.4 Conception sociale — l'apprentissage n'est jamais solitaire en Algérie
- **La famille est le premier moteur** : un espace parent en arabe/français, ultra-simple, qui envoie une fierté par semaine (« Yacine sait maintenant se présenter en anglais — écoutez-le ») transforme le parent en allié plutôt qu'en contrôleur. Le parent qui *entend* son enfant parler anglais devient le meilleur canal d'acquisition du pays.
- **La fratrie** : le téléphone étant partagé, faire de la contrainte une force — profils multiples sur un appareil, défis grand frère/petite sœur.
- **L'enseignant et l'école de soutien** : mode classe gratuit (codes de groupe, tableau de bord, séances Kahoot-like projetables). L'enseignant qui recommande la plateforme comme « devoirs » est le canal de distribution le moins cher et le plus crédible.
- **Le collectif** : événements nationaux synchronisés (« la semaine des 1000 mots », ligues par wilaya sur l'*effort*, pas le niveau) — l'émulation sans humiliation.

---

## 5. La méthode — architecture pédagogique pour des résultats spectaculaires en une année

### 5.1 L'équation de base
**Résultat = intensité × régularité × qualité du mécanisme.** L'école donne ~1h30–3h/semaine peu efficientes. La plateforme vise **15–20 min/jour, 5 j/7** ≈ **+90 h/an de pratique active** (retrieval pur, pas d'écoute passive) — soit l'équivalent de **2 à 3 années scolaires supplémentaires** en volume utile. C'est là, et nulle part ailleurs, que naissent les résultats « spectaculaires ».

### 5.2 La boucle quotidienne (le cœur du produit, 15 min)
1. **Réveil (3 min)** — révision SRS déguisée en mini-jeu : les mots/structures au bord de l'oubli.
2. **Nouveau (7 min)** — UNE notion (5-8 mots ou 1 structure), présentée en contexte (histoire/scène), pratiquée en retrieval immédiat sous 4 formats (écouter→toucher, dire, lire, écrire/ordonner).
3. **Immersion (4 min)** — input compréhensible : histoire audio illustrée ou clip où la notion du jour réapparaît (i+1).
4. **Victoire (1 min)** — la mascotte montre le progrès concret : « Tu connais 214 mots. Il y a 3 mois : 0. »

### 5.3 Trois parcours, un seul moteur
| Parcours | Public | Objectif fin d'année (mesurable) |
|---|---|---|
| **Foundations** | 3AP–5AP, vrai zéro | Alphabet + phonics complets ; lit et écrit des mots simples ; **300-400 mots** ; se présente, décrit, compte, répond à l'oral (pré-A1 solide → A1) |
| **Builder** | 1AM–3AM | **800-1200 mots**, présent/passé/futur simples, lit un texte court en autonomie, écrit un paragraphe de 5-6 phrases (A1 → A2) |
| **BEM Sprint** | 4AM | Maîtrise du **format exact de l'épreuve** : banque de textes types + questions types, situations d'intégration corrigées pas à pas, examens blancs chronométrés avec score prédictif. Objectif : **+4 à +6 points** sur la note d'anglais au BEM |
Le placement initial se fait par un test adaptatif de 5 minutes ; un élève de 2AM au niveau zéro commence dans Foundations sans le savoir (habillage adapté à son âge).

### 5.4 L'alignement scolaire : le multiplicateur
La plateforme suit la **progression officielle du programme algérien** (mêmes séquences : « Me and my friends », « My family », etc.) mais avec un mécanisme 10× meilleur. Effet : ce que l'élève fait le soir **fait remonter ses notes en classe dès le premier trimestre** — et cette note qui monte est la preuve sociale qui verrouille parents, enseignants et l'élève lui-même. C'est le pont explicite avec la philosophie du brief : le site ne remplace pas l'école, **il rend l'école rentable**.

### 5.5 La mesure (sans mesure, pas de « spectaculaire »)
- **Test de positionnement** en septembre → même test en janvier et en mai : delta objectif, montré aux parents.
- Tableau de bord : mots maîtrisés (pas « vus »), minutes de pratique active, taux de rétention SRS, et pour la 4AM un **score BEM prédit**.
- KPI produit qui garantissent le résultat : rétention J30 > 40 %, médiane ≥ 4 sessions/semaine, taux de réussite par exercice maintenu autour de 80 %.

---

## 6. Traduction produit (résumé exécutable)

1. **PWA mobile-first offline** (Android bas de gamme, < 5 Mo initial, packs de leçons téléchargeables, audio Opus compressé) — stack possible : web + Supabase, cohérent avec l'existant.
2. **Interface trilingue évolutive** : consignes audio en darja/arabe au niveau zéro → anglais progressif ; interface parent en arabe et français.
3. **Une mascotte** (fennec — évident et juste : intelligent, du désert, maillot national) qui parle, félicite, et incarne la relation.
4. **Le jeu est l'exercice** : mondes sur une carte de l'Algérie vers le monde, boss de fin de monde = test de maîtrise, récompenses = capacités réelles débloquées.
5. **Mode classe gratuit** (codes, tableau de bord, quiz projetable) = canal de distribution.
6. **Rapport parent hebdomadaire** avec un enregistrement audio de l'enfant = canal de rétention.
7. **BEM Sprint** en produit d'appel payant possible (les familles paient déjà les cours de soutien) pendant que le cœur reste gratuit.

### Feuille de route de validation (avant de tout construire)
- **Phase 1 (2-3 mois)** : uniquement la boucle quotidienne de *Foundations* (phonics + 100 premiers mots) + SRS. Tester sur 30-50 élèves réels (une école de soutien partenaire). Critère de succès : 4 sessions/semaine sans relance après 4 semaines.
- **Phase 2** : parcours Builder + mode classe.
- **Phase 3 (avant mars)** : BEM Sprint pour la session de juin.

---

## 7. La réponse en une phrase

> Ce qui produira des résultats spectaculaires en une année, ce n'est ni le ludique ni le support : c'est **15 minutes par jour de rappel actif, espacé et maîtrisé, aligné sur le programme officiel, rendues inévitables par un jeu qui respecte la psychologie de l'enfant algérien et rendues visibles par des mesures que les parents et l'école peuvent constater**. Le ludique est le moteur de la régularité ; la science de la mémoire est le moteur du résultat ; l'alignement BEM est le moteur de la confiance.
