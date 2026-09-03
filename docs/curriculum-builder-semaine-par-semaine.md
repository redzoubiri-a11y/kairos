# Curriculum Builder — semaine par semaine (à partir de S33)

> Suite de Foundations (`docs/curriculum-foundations-semaine-par-semaine.md`), pour l'enfant qui a terminé les 32 semaines et maîtrise ~320–350 mots actifs, l'alphabet latin et les sons de base. Public visé : 5AP–6AP (10–12 ans), niveau A1 solide → A2. Numérotation continue (S33, S34…) pour que le moteur SRS et le curriculum restent une seule ligne du temps sans redémarrage de compteur.
>
> **État de ce document : démarré, pas terminé.** Seuls les MONDES B1 (S33–S36), B2 (S37–S40), B3 (S41–S44), B4 (S45–S48), B5 (S49–S52), B6 (S53–S56) et B7 (S57–S60) sont détaillés au niveau de Foundations. Le monde suivant (B8, bilan final) n'est qu'une esquisse de titre/thème (section "Feuille de route", en bas).

---

## Ce qui change par rapport à Foundations

Foundations construit le socle (sons, ~330 mots, présent simple, phrases courtes). Builder ne recommence pas à zéro : il **suppose la décodabilité acquise** et lève le niveau sur trois fronts à la fois, pas un seul :

1. **Grammaire au-delà du présent.** Le saut principal de Builder est le **passé** (`was/were`, passé régulier en *-ed*, verbes irréguliers fréquents), puis les comparatifs (*bigger, more beautiful*), puis *there is/are*. C'est la différence qualitative avec Foundations, qui reste tout entier au présent simple.
2. **Lecture connectée, pas juste des mots.** Foundations lit des mots et des phrases isolées ; Builder lit et écoute de **courts paragraphes** (3–5 phrases liées), avec une vraie compréhension globale testée (pas juste décoder).
3. **Production plus longue.** Le Boss de Foundations fait dire une phrase ou un dialogue court ; le Boss de Builder fait **raconter un petit passage** (ce que Fennec a fait hier, une description à plusieurs traits) — c'est un saut de production orale/écrite, pas seulement de vocabulaire.

Ce qui ne change pas : le rythme (4 jours + Boss le jeudi), le SRS en continu, la règle "on ne lit jamais un mot dont on n'a pas encore le son ou le motif orthographique", zéro punition sur un Boss raté (variante rejouée), l'ancrage algérien de chaque monde.

### La colonne "Phonics" devient "Lecture & orthographe"

Les sons de base sont acquis en sortie de Foundations ; Builder n'enseigne plus de sons isolés mais des **motifs orthographiques** qui bloquent souvent la lecture fluide à ce niveau : le *e* muet (*make, like, time*), les groupes de prononciation du *-ed* (`/t/ /d/ /ɪd/`), les orthographes irrégulières fréquentes (*said, was, went*), les groupes *r*-contrôlés déjà vus en fin de Foundations (*ar, or, er*) réinvestis dans du texte plus long.

### Catégories de la banque de mots

Mêmes catégories que Foundations (`lexique`, `structure`, `fonction`) plus une nouvelle catégorie **`grammaire`** pour les items qui sont un point de grammaire entraîné comme un pattern SRS à part entière (ex. "played" comme représentant du passé régulier), distincte de `structure` qui reste réservée aux phrases-modèles complètes.

---

## MONDE B1 — « Yesterday & Today » (S33–S36) · Le grand saut : le passé

*Fennec raconte ce qu'il a fait hier — première fois que l'enfant parle d'un moment qui n'est pas maintenant.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S33** | yesterday, today, was, were, happy/sad/tired (révisés) + **I was happy yesterday**, **It was sunny** | *e* muet : *make, like, time, home, name* (mots déjà connus au présent, relus avec le motif) | Fennec raconte sa journée d'hier en 3 phrases avec *was* — l'enfant valide vrai/faux |
| **S34** | play, walk, watch, jump, listen + **-ed** régulier : **I played football**, **I watched TV** | Groupes de prononciation du *-ed* : */t/* (*watched*), */d/* (*played*), */ɪd/* (*wanted*) — jeu d'écoute et de tri | Mini-boss : trier 8 actions d'hier par son de *-ed* |
| **S35** | go→went, eat→ate, see→saw, have→had, do→did + **I went to the market**, **I ate couscous** | Orthographes irrégulières fréquentes : *was, went, said, saw* — flashcards dédiées (elles ne suivent aucune règle, donc mémorisation directe) | Fennec interviewé : "What did you do yesterday?" — l'enfant choisit/dit 3 réponses avec des verbes irréguliers |
| **S36** | Révision : mélange passé régulier + irrégulier, **last week** | Premier paragraphe connecté (4–5 phrases) : *"Yesterday, Fennec went to the market. He bought bread and dates. Then he played with his friends. He was very happy."* — lu et écouté, questions de compréhension | **BOSS : « Le journal de Fennec »** — l'enfant raconte (à voix haute, enregistré) 3–4 phrases sur ce qu'il a fait hier ou la semaine dernière, mélangeant passé régulier et irrégulier. 34 mots/structures actifs de plus (voir `data/builder-banque-mots.json`, généré par `scripts/generate-builder-word-bank.py`) |

**Sortie du monde B1** : l'enfant distingue et utilise correctement *was/were*, au moins 6 verbes irréguliers fréquents, le passé régulier en *-ed* (à l'oral, sans exiger la prononciation fine des 3 groupes), et peut suivre un paragraphe de 4–5 phrases liées par leur sens (pas juste mot à mot).

---

## MONDE B2 — « Comparing Things » (S37–S40) · Comparer

*Fennec organise le concours du désert : qui est le plus rapide, le plus grand, le plus beau ?*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S37** | tall, short, fast, slow + comparatif court **-er** : **taller, shorter, faster, slower** + **Fennec is taller than the cat** | Règle d'orthographe du **-er** court : ajout simple (*tall→taller*) vs doublement de consonne (*big→bigger*) | Comparer deux animaux du zoo (S17-20 réactivés) avec *taller than / faster than* |
| **S38** | beautiful, expensive, difficult, interesting + comparatif long **more…than** : **more beautiful than** | Règle : mots courts (1 syllabe) → *-er*, mots longs (2+ syllabes) → *more…* — tri d'adjectifs par longueur | Mini-boss du marché : comparer deux objets avec *more expensive than* |
| **S39** | good→better→best, bad→worse→worst (comparatifs irréguliers) + superlatif **the fastest**, **the most beautiful** | Orthographes irrégulières à mémoriser directement (*better, best, worse, worst* ne suivent aucune règle) | Quiz "Who's the best?" — classer 3 animaux sur une qualité avec le superlatif |
| **S40** | Révision : mélange *-er / more / irréguliers*, description à plusieurs traits (**a big, brown, fast dog**) | Paragraphe connecté : *"In the desert, the fennec is small but fast. The camel is bigger and slower. The eagle is the fastest of all."* — questions de compréhension | **BOSS : « Le concours du désert »** — l'enfant décrit et compare 2-3 animaux sur plusieurs traits (taille, vitesse, beauté), à voix haute, enregistré. 26 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B2** : l'enfant forme correctement le comparatif court (*-er*) et long (*more…*), connaît au moins 4 comparatifs/superlatifs irréguliers, utilise le superlatif (*the…-est / the most…*), et peut décrire un objet ou un animal sur plusieurs traits à la fois dans une même phrase.

---

## MONDE B3 — « Around Town » (S41–S44) · Se repérer

*Fennec fait visiter sa ville : où sont les choses, comment y aller.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S41** | street, shop, bank, hospital + **there is / there isn't** + **There is a bank on Main Street** | Contraction *there's* — lecture des deux formes (pleine et contractée) | Décrire ce qui se trouve sur une image de rue avec *there is/there isn't* |
| **S42** | shops (pluriel révisé) + **there are / there aren't** + **There are three shops near my house** | Révision des règles de pluriel (*-s / -es*) réinvesties dans des phrases plus longues | Mini-boss : compter et décrire des objets au pluriel dans une scène |
| **S43** | next to, between, opposite, in front of, behind + **The bank is next to the school** (approfondit *in/on/under* de Foundations S29) | Lecture d'un jeu de phrases de position sur un plan simple | Guider Fennec dans la ville à partir de phrases de position |
| **S44** | go straight, turn left, turn right, cross the street, map + Révision : *there is/are* + prépositions | Paragraphe connecté avec un petit plan de ville ; questions de compréhension | **BOSS : « Le plan de la ville de Fennec »** — l'enfant donne un itinéraire simple d'un point à un autre (*go straight, turn left…*), enregistré. 23 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B3** : l'enfant utilise correctement *there is/there are* (affirmatif et négatif), au moins 5 prépositions de lieu, et peut donner ou suivre un itinéraire simple à 2-3 étapes.

---

## MONDE B4 — « Plans & Future » (S45–S48) · Parler de demain

*Fennec prépare son été — première fois que l'enfant parle de ce qui n'est pas encore arrivé.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S45** | weekend, holiday, plan + **going to** (affirmatif) + **I'm going to visit my grandma** | Orthographe du *-ing* : *e* muet disparaît (*make→making*), consonne doublée (*swim→swimming*) | Fennec annonce son projet du week-end, l'enfant valide vrai/faux |
| **S46** | tomorrow, next week + **going to** (question et négation) : **Are you going to…?**, **I'm not going to…** + **What are you going to do tomorrow?** | Lecture d'un dialogue question/réponse au futur proche | Mini-boss : jeu de rôle, interviewer un camarade sur ses projets |
| **S47** | this evening, next year, travel, summer + **We are going to travel in the summer** | Paragraphe connecté sur un projet de vacances ; questions de compréhension | Jeu d'association : relier chaque personnage de la classe Fennec à son projet |
| **S48** | next month + Révision totale B1→B4 | Relecture des 4 mondes : reconnaître passé, comparatifs, *there is/are*, futur proche dans un même texte court | **BILAN DE MI-PARCOURS BUILDER** : même test qu'en S33 → delta montré aux parents. **BOSS : « Les projets de Fennec »** — l'enfant raconte 2-3 projets futurs avec *going to*, enregistré. 17 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B4** : l'enfant forme le futur proche (*going to*) à l'affirmatif, au négatif et à l'interrogatif, et peut reconnaître/mélanger passé (B1), comparatifs (B2), *there is/are* (B3) et futur proche (B4) dans un texte court — c'est la première vraie consolidation transversale de Builder, sur le même principe que le bilan de mi-année de Foundations (S16).

---

## MONDE B5 — « Story Time » (S49–S52) · Raconter une histoire

*Fennec devient conteur — les quatre grammaires apprises (passé, comparatifs, there is/are, futur proche) se mettent enfin au service d'un vrai récit.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S49** | story, once upon a time, **after that** + **Once upon a time, there was a fennec** | Lecture d'un court récit (4-5 phrases) avec *then* (S36, révisé) et *after that* comme connecteurs de séquence | Remettre les phrases d'une petite histoire dans le bon ordre |
| **S50** | **because** (raison) + **didn't** (négation du passé) + **He was hungry because he didn't eat** | Lecture de phrases cause→conséquence, question "pourquoi ?" posée sur chacune | Mini-boss : relier une cause à sa conséquence dans une série de phrases |
| **S51** | **but** (contraste), **so** (conséquence) + **It was raining, so he stayed home**, **He was tired but happy** | Lecture d'un récit de 6-8 phrases mêlant les quatre connecteurs (*then, because, but, so*) | Reconter à l'oral une histoire courte en réutilisant au moins 2 connecteurs |
| **S52** | **the end** + Révision : passé, comparatifs, *there is/are*, futur proche réunis dans un même récit | Première histoire longue lue seul (6-8 phrases, tous les acquis de B1-B4 réinvestis) : *"Once upon a time, there was a fennec. He was hungry, so he went to the market. He bought bread, then he went home. He was tired but happy."* | **BOSS : « Le conteur »** — l'enfant raconte une histoire courte (5-6 phrases) de son choix, avec au moins 2 connecteurs, enregistré. 12 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B5** : l'enfant lit seul un texte connecté de 6-8 phrases, utilise au moins 4 connecteurs (*then, because, but, so*) à l'oral, et peut raconter une histoire courte en réinvestissant spontanément passé, comparatifs, *there is/are* et futur proche — la vraie preuve que les quatre mondes précédents tiennent ensemble.

---

## MONDE B6 — « Feelings & Opinions » (S53–S56) · Donner son avis

*Fennec anime un petit débat — l'enfant ne décrit plus seulement le monde, il dit ce qu'il en pense.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S53** | boring, funny, exciting, scary + **I think it's funny** | Orthographe des adjectifs en *-y* (*funny, scary*) — lecture et tri | Réagir à des images/situations avec une phrase d'opinion |
| **S54** | love, hate, agree, disagree + **I love reading, but I hate maths** | Lecture d'un court dialogue d'opinions contrastées | Mini-boss "jeu du débat" : dire si on est d'accord ou pas avec des affirmations simples |
| **S55** | **in my opinion**, worried, proud, surprised + **In my opinion, football is more exciting than tennis** (réinvestit le comparatif de B2) | Paragraphe connecté : une opinion suivie d'une raison (*because*, B5) | Donner une opinion sur un sujet simple, avec une raison |
| **S56** | debate, **What do you think?** + Révision : opinions + raisons + comparatifs mélangés | Relecture d'un mini-débat entre deux personnages Fennec, questions de compréhension | **BOSS : « Le débat de Fennec »** — l'enfant donne 2 opinions sur un sujet simple (animal préféré, activité préférée) avec une raison à chaque fois, enregistré. 17 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B6** : l'enfant exprime une opinion (*I think…, in my opinion…*), la nuance (*love/like/don't like/hate*), marque l'accord/désaccord, et justifie un avis avec *because* — première étape vers l'argumentation simple.

---

## MONDE B7 — « My Country, My World » (S57–S60) · Parler de son pays

*Fennec fait le tour du monde et revient toujours à l'Algérie — le monde s'ouvre, l'ancrage reste local.*

| Sem. | Oral (mots & structures) | Lecture & orthographe | Boss / événement |
|---|---|---|---|
| **S57** | country, capital, language, flag + **Algeria is a country in Africa** | Lecture de phrases factuelles courtes sur des pays | Associer pays, capitale et drapeau dans un mini-quiz |
| **S58** | north, south, east, west, mountain + **The Sahara is in the south of Algeria** | Lecture d'un court paragraphe géographique sur l'Algérie | Repérer les points cardinaux sur la carte de Fennec (S1 : la maison de Fennec, réactivée) |
| **S59** | continent, population + **Algeria is bigger than France** (réinvestit le comparatif de B2) + **People speak Arabic and French in Algeria** | Paragraphe comparant deux pays (taille, langue) | Mini-quiz : comparer l'Algérie à un autre pays sur un trait (taille, langue, population) |
| **S60** | world, **I am from Algeria** + Révision : géographie + comparatifs + *there is/are* réunis | Relecture d'une courte présentation de pays, questions de compréhension | **BOSS : « Le tour du monde de Fennec »** — l'enfant présente son pays en 3-4 phrases (capitale, langue, position géographique), enregistré. 17 mots/structures actifs de plus (voir `data/builder-banque-mots.json`) |

**Sortie du monde B7** : l'enfant nomme et situe son pays (capitale, langue, position géographique, points cardinaux), compare son pays à un autre sur un trait simple, et peut présenter son pays en quelques phrases — le monde s'élargit, mais chaque monde de Builder reste ancré dans le réel algérien, comme dans Foundations.

---

## Feuille de route (mondes suivants — titres et thème seulement, pas encore détaillés)

| Monde | Semaines | Thème pressenti | Saut grammatical/lexical visé |
|---|---|---|---|
| B8 | S61–S64 | *Builder Show* | Grande révision + bilan final (delta depuis S33) — clôture Builder, passerelle vers un futur contenu intermédiaire/BEM |

Chaque monde suivant sera écrit avec le même niveau de détail que B1 (table semaine par semaine + script de génération de banque de mots) au fur et à mesure, pas anticipé en bloc — pour rester fidèle au vrai déroulé pédagogique et pouvoir ajuster B2 en fonction de ce que B1 donne réellement en usage.
