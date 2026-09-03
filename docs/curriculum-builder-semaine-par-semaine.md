# Curriculum Builder — semaine par semaine (à partir de S33)

> Suite de Foundations (`docs/curriculum-foundations-semaine-par-semaine.md`), pour l'enfant qui a terminé les 32 semaines et maîtrise ~320–350 mots actifs, l'alphabet latin et les sons de base. Public visé : 5AP–6AP (10–12 ans), niveau A1 solide → A2. Numérotation continue (S33, S34…) pour que le moteur SRS et le curriculum restent une seule ligne du temps sans redémarrage de compteur.
>
> **État de ce document : démarré, pas terminé.** Seuls les MONDES B1 (S33–S36), B2 (S37–S40), B3 (S41–S44) et B4 (S45–S48) sont détaillés au niveau de Foundations. Les mondes suivants ne sont qu'une esquisse de titres/thèmes (section "Feuille de route", en bas) — à détailler monde par monde, pas tous d'un coup.

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

## Feuille de route (mondes suivants — titres et thème seulement, pas encore détaillés)

| Monde | Semaines | Thème pressenti | Saut grammatical/lexical visé |
|---|---|---|---|
| B5 | S49–S52 | *Story Time* | Lecture de récits plus longs (6–8 phrases), connecteurs (*then, after, because*) |
| B6 | S53–S56 | *Feelings & Opinions* | Expression d'opinion (*I think…, in my opinion*), adjectifs nuancés |
| B7 | S57–S60 | *My Country, My World* | Vocabulaire civique/géographique simple, comparaison Algérie/monde |
| B8 | S61–S64 | *Builder Show* | Grande révision + bilan final (delta depuis S33) — clôture Builder, passerelle vers un futur contenu intermédiaire/BEM |

Chaque monde suivant sera écrit avec le même niveau de détail que B1 (table semaine par semaine + script de génération de banque de mots) au fur et à mesure, pas anticipé en bloc — pour rester fidèle au vrai déroulé pédagogique et pouvoir ajuster B2 en fonction de ce que B1 donne réellement en usage.
