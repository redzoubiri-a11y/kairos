#!/usr/bin/env python3
"""Génère fennec/app/catalog.json depuis data/foundations-banque-mots.json
et data/builder-banque-mots.json.

C'est la copie embarquée du référentiel que la PWA utilise pour son tout
premier lancement hors-ligne (avant toute connexion à Supabase) — voir
fennec/app/main.mjs `ensureCatalog()`. Le format est celui attendu par
FennecStore.saveCatalog() (fennec/src/db.mjs) : wordId, english, french,
category, worldId, introWeek, introDay, audioUrl, imageUrl (camelCase).

Foundations (S1-S32, mondes M1-M8) et Builder (S33-S64, mondes B1-B8)
partagent un seul catalogue continu : l'app n'a pas de notion de "piste"
(track) — un élève qui termine S32 enchaîne directement sur S33 grâce à
la même logique de pointeur (fennec/app/main.mjs), sans code spécifique.
Les identifiants Builder sont décalés de BUILDER_ID_OFFSET pour ne jamais
entrer en collision avec les wordId Foundations (actuellement 1-339) même
si Foundations grandit encore un peu ; les worldId Builder continuent la
numérotation Foundations (B1 -> 9, ..., B8 -> 16).

À relancer avec fennec/supabase/seed/generate_seed.py chaque fois que
scripts/generate-foundations-word-bank.py ou
scripts/generate-builder-word-bank.py change le curriculum.
"""

import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
FOUNDATIONS_JSON = os.path.join(ROOT, "data", "foundations-banque-mots.json")
BUILDER_JSON = os.path.join(ROOT, "data", "builder-banque-mots.json")
OUT = os.path.join(HERE, "catalog.json")

BUILDER_ID_OFFSET = 10000
BUILDER_WORLD_OFFSET = 8  # Foundations a 8 mondes (M1-M8, worldId 1-8)


def world_id_for(monde_label):
    # "M6 · Food" -> 6 ; "B1 · Yesterday & Today" -> 9 (8 + 1)
    prefix, number = monde_label.split(" ")[0][0], int(monde_label.split(" ")[0][1:])
    return number if prefix == "M" else number + BUILDER_WORLD_OFFSET


def entries(words, id_offset=0):
    return [
        {
            "wordId": w["id"] + id_offset,
            "english": w["anglais"],
            "french": w["francais"],
            "category": w["categorie"],
            "worldId": world_id_for(w["monde"]),
            "introWeek": int(w["semaine_intro"][1:]),
            "introDay": w["jour_intro"],
            "audioUrl": None,
            "imageUrl": None,
        }
        for w in words
    ]


def main():
    with open(FOUNDATIONS_JSON, encoding="utf-8") as f:
        foundations = json.load(f)
    with open(BUILDER_JSON, encoding="utf-8") as f:
        builder = json.load(f)

    catalog = entries(foundations) + entries(builder, id_offset=BUILDER_ID_OFFSET)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Écrit {OUT} ({len(catalog)} mots — {len(foundations)} Foundations + {len(builder)} Builder)")


if __name__ == "__main__":
    main()
