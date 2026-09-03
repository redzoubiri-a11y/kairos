#!/usr/bin/env python3
"""Génère la banque de mots Builder — MONDES B1 à B8, complet (S33-S64).

Suite de generate-foundations-word-bank.py : même modèle SRS (intervalles
J+1, J+3, J+7, J+16, J+35), même calendrier école dimanche->jeudi (5
sessions/semaine réelles, jeudi = jour Boss donc pas de nouvel item).
Numérotation de semaine continue depuis Foundations (S33, S34...) — voir
docs/curriculum-builder-semaine-par-semaine.md.

Curriculum Builder complet : les 8 mondes sont peuplés. B8 (S61-S64) est
volontairement quasi vide en nouveaux items — c'est le monde de
consolidation finale, pas d'introduction (même logique que S29-S32 en
Foundations).

Note dédup : "then" (introduit S36) n'est pas réintroduit en S49 — la
clé de dédoublonnage est globale au script, donc tout mot déjà présent
dans un monde antérieur est silencieusement ignoré s'il réapparaît (voir
la boucle de génération plus bas). C'est voulu : S49 réutilise "then" à
l'oral (cf. curriculum) sans le re-déclarer comme nouvel item SRS.

Sorties :
  data/builder-banque-mots.csv
  data/builder-banque-mots.json
"""

import csv, json, os

# ---------------------------------------------------------------- lexique
# (en, fr, catégorie) — catégories : lexique / structure / fonction / grammaire
# "grammaire" = item qui représente un point de grammaire entraîné comme
# pattern SRS à part entière (ex. "played" pour le passé régulier), distinct
# de "structure" qui reste une phrase-modèle complète.
W = {
33: [("yesterday","hier","lexique"),("today","aujourd'hui","lexique"),
     ("was","était (I/he/she/it)","grammaire"),("were","étiez/étaient (you/we/they)","grammaire"),
     ("I was happy yesterday","j'étais content hier","structure"),
     ("It was sunny","il faisait beau (soleil)","structure")],
34: [("play","jouer","lexique"),("walk","marcher","lexique"),("watch","regarder","lexique"),
     ("jump","sauter","lexique"),("listen","écouter","lexique"),
     ("played","a joué","grammaire"),("watched","a regardé","grammaire"),
     ("I played football","j'ai joué au football","structure"),
     ("I watched TV","j'ai regardé la télé","structure")],
35: [("go","aller","lexique"),("went","est allé","grammaire"),
     ("eat","manger","lexique"),("ate","a mangé","grammaire"),
     ("see","voir","lexique"),("saw","a vu","grammaire"),
     ("have","avoir","lexique"),("had","avait / a eu","grammaire"),
     ("do","faire","lexique"),("did","a fait","grammaire"),
     ("I went to the market","je suis allé au marché","structure"),
     ("I ate couscous","j'ai mangé du couscous","structure"),
     ("What did you do yesterday?","qu'as-tu fait hier ?","structure")],
36: [("last week","la semaine dernière","lexique"),("then","ensuite","fonction"),
     ("said","a dit","grammaire"),("bought","a acheté","grammaire"),
     ("Yesterday, Fennec went to the market","hier, Fennec est allé au marché","structure"),
     ("He was very happy","il était très content","structure")],
37: [("tall","grand (taille)","lexique"),("short","petit (taille) / court","lexique"),
     ("fast","rapide","lexique"),("slow","lent","lexique"),
     ("taller","plus grand","grammaire"),("faster","plus rapide","grammaire"),
     ("Fennec is taller than the cat","Fennec est plus grand que le chat","structure")],
38: [("beautiful","beau/belle","lexique"),("expensive","cher","lexique"),
     ("difficult","difficile","lexique"),("interesting","intéressant","lexique"),
     ("more beautiful","plus beau","grammaire"),
     ("more expensive than","plus cher que","structure")],
39: [("good","bon","lexique"),("bad","mauvais","lexique"),
     ("better","meilleur","grammaire"),("best","le meilleur","grammaire"),
     ("worse","pire","grammaire"),("worst","le pire","grammaire"),
     ("the fastest","le plus rapide","grammaire"),
     ("the most beautiful","le plus beau","grammaire")],
40: [("desert","désert","lexique"),("eagle","aigle","lexique"),("camel","chameau (révision)","lexique"),
     ("a big, brown, fast dog","un grand chien marron et rapide","structure"),
     ("The eagle is the fastest of all","l'aigle est le plus rapide de tous","structure")],
41: [("street","rue","lexique"),("shop","magasin","lexique"),("bank","banque","lexique"),
     ("hospital","hôpital","lexique"),
     ("there is","il y a (singulier)","grammaire"),("there isn't","il n'y a pas (singulier)","grammaire"),
     ("There is a bank on Main Street","il y a une banque rue principale","structure")],
42: [("there are","il y a (pluriel)","grammaire"),("there aren't","il n'y a pas (pluriel)","grammaire"),
     ("shops","magasins","lexique"),
     ("There are three shops near my house","il y a trois magasins près de chez moi","structure")],
43: [("next to","à côté de","fonction"),("between","entre","fonction"),("opposite","en face de","fonction"),
     ("in front of","devant","fonction"),("behind","derrière","fonction"),
     ("The bank is next to the school","la banque est à côté de l'école","structure")],
44: [("go straight","va tout droit","lexique"),("turn left","tourne à gauche","lexique"),
     ("turn right","tourne à droite","lexique"),("cross the street","traverse la rue","lexique"),
     ("map","carte / plan","lexique"),
     ("Turn left at the bank","tourne à gauche à la banque","structure")],
45: [("weekend","week-end","lexique"),("holiday","vacances","lexique"),("plan","projet","lexique"),
     ("going to","va (futur proche)","grammaire"),
     ("I'm going to visit my grandma","je vais rendre visite à ma grand-mère","structure")],
46: [("tomorrow","demain","lexique"),("next week","la semaine prochaine","lexique"),
     ("Are you going to…?","est-ce que tu vas… ?","structure"),
     ("I'm not going to…","je ne vais pas…","structure"),
     ("What are you going to do tomorrow?","qu'est-ce que tu vas faire demain ?","structure")],
47: [("this evening","ce soir","lexique"),("next year","l'année prochaine","lexique"),
     ("travel","voyager","lexique"),("summer","été","lexique"),
     ("We are going to travel in the summer","nous allons voyager en été","structure")],
48: [("next month","le mois prochain","lexique"),
     ("My plan for next year is…","mon projet pour l'année prochaine est…","structure")],
49: [("story","histoire","lexique"),("once upon a time","il était une fois","lexique"),
     ("after that","après ça","fonction"),
     ("Once upon a time, there was a fennec","il était une fois un fennec","structure")],
50: [("because","parce que","fonction"),("didn't","n'a pas (négation du passé)","grammaire"),
     ("He was hungry because he didn't eat","il avait faim parce qu'il n'avait pas mangé","structure")],
51: [("but","mais","fonction"),("so","donc / alors","fonction"),
     ("It was raining, so he stayed home","il pleuvait, donc il est resté à la maison","structure"),
     ("He was tired but happy","il était fatigué mais content","structure")],
52: [("the end","la fin","lexique")],
53: [("boring","ennuyeux","lexique"),("funny","drôle","lexique"),
     ("exciting","passionnant","lexique"),("scary","effrayant","lexique"),
     ("I think it's funny","je pense que c'est drôle","structure")],
54: [("love","adorer","lexique"),("hate","détester","lexique"),
     ("agree","être d'accord","lexique"),("disagree","ne pas être d'accord","lexique"),
     ("I love reading, but I hate maths","j'adore lire, mais je déteste les maths","structure")],
55: [("in my opinion","à mon avis","fonction"),("worried","inquiet","lexique"),
     ("proud","fier","lexique"),("surprised","surpris","lexique"),
     ("In my opinion, football is more exciting than tennis","à mon avis, le football est plus passionnant que le tennis","structure")],
56: [("debate","débat","lexique"),("What do you think?","qu'en penses-tu ?","structure")],
57: [("country","pays","lexique"),("capital","capitale","lexique"),
     ("language","langue","lexique"),("flag","drapeau","lexique"),
     ("Algeria is a country in Africa","l'Algérie est un pays en Afrique","structure")],
58: [("north","nord","lexique"),("south","sud","lexique"),("east","est","lexique"),
     ("west","ouest","lexique"),("mountain","montagne","lexique"),
     ("The Sahara is in the south of Algeria","le Sahara est dans le sud de l'Algérie","structure")],
59: [("continent","continent","lexique"),("population","population","lexique"),
     ("Algeria is bigger than France","l'Algérie est plus grande que la France","structure"),
     ("People speak Arabic and French in Algeria","les gens parlent arabe et français en Algérie","structure")],
60: [("world","monde","lexique"),("I am from Algeria","je viens d'Algérie","structure")],
61: [("finally","enfin / finalement","fonction"),
     ("Finally, he went home","enfin, il est rentré à la maison","structure")],
62: [("Let me tell you about my day","laisse-moi te raconter ma journée","structure")],
63: [("Thank you for listening","merci de m'avoir écouté","structure")],
64: [],  # consolidation pure, aucun mot nouveau — cf. S32 en Foundations
}

MONDES = {1: "B1 · Yesterday & Today", 2: "B2 · Comparing Things", 3: "B3 · Around Town",
          4: "B4 · Plans & Future", 5: "B5 · Story Time", 6: "B6 · Feelings & Opinions",
          7: "B7 · My Country, My World", 8: "B8 · Builder Show"}
def monde_of(week): return MONDES[(week - 33) // 4 + 1]

# ------------------------------------------------- calendrier (S33 -> S64,
# curriculum Builder complet ; labels génériques au-delà de S64 réservés
# aux échéances de révision qui débordent sur un futur contenu (piste
# bem_sprint ou intermédiaire), hors scope de ce document.
labels = [f"S{i}" for i in range(33, 65)] + [f"S{i}" for i in range(65, 73)]
def label_at(abs_day):
    idx = abs_day // 7
    return labels[idx] if idx < len(labels) else "post-Builder"
def next_school_day(abs_day):
    while abs_day % 7 > 4:  # jours 5,6 = vendredi, samedi
        abs_day += 1
    return abs_day
def abs_of(week_label, day):  # day: 1..4
    return labels.index(week_label) * 7 + (day - 1)

OFFSETS = [1, 3, 7, 16, 35]

rows, seen = [], set()
for week in sorted(W):
    items = W[week]
    for i, (en, fr, cat) in enumerate(items):
        key = en.lower()
        if key in seen:
            continue
        seen.add(key)
        day = (i % 4) + 1
        d0 = abs_of(f"S{week}", day)
        reviews = []
        for off in OFFSETS:
            reviews.append(label_at(next_school_day(d0 + off)))
        rows.append({
            "id": len(rows) + 1, "anglais": en, "francais": fr, "categorie": cat,
            "monde": monde_of(week), "semaine_intro": f"S{week}", "jour_intro": day,
            "r1": reviews[0], "r2": reviews[1], "r3": reviews[2],
            "r4": reviews[3], "r5": reviews[4], "maitrise": reviews[4],
        })

os.makedirs("data", exist_ok=True)
with open("data/builder-banque-mots.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
with open("data/builder-banque-mots.json", "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)

from collections import Counter
c = Counter(r["categorie"] for r in rows)
print(f"Total : {len(rows)} items — {dict(c)}")
