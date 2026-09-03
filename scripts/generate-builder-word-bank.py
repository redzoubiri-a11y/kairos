#!/usr/bin/env python3
"""Génère la banque de mots Builder — MONDE B1 uniquement (S33-S36).

Suite de generate-foundations-word-bank.py : même modèle SRS (intervalles
J+1, J+3, J+7, J+16, J+35), même calendrier école dimanche->jeudi (5
sessions/semaine réelles, jeudi = jour Boss donc pas de nouvel item).
Numérotation de semaine continue depuis Foundations (S33, S34...) — voir
docs/curriculum-builder-semaine-par-semaine.md.

Seul le monde B1 est peuplé ici (cf. "Feuille de route" du curriculum) ;
les mondes B2-B8 ne sont pas encore écrits, ce script ne génère donc pas de
contenu pour S37+ tant que ce monde n'est pas détaillé.

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
}

MONDES = {1: "B1 · Yesterday & Today"}
def monde_of(week): return MONDES[(week - 33) // 4 + 1]

# ------------------------------------------------- calendrier (S33 -> S36,
# pas de vacances à l'intérieur de ce monde ; labels génériques au-delà de
# S36 réservés aux échéances de révision qui débordent sur B2, non encore
# écrit — purement des repères de planning, pas du contenu).
labels = [f"S{i}" for i in range(33, 37)] + [f"S{i}" for i in range(37, 45)]
def label_at(abs_day):
    idx = abs_day // 7
    return labels[idx] if idx < len(labels) else "B2+"
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
