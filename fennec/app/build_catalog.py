#!/usr/bin/env python3
"""Génère fennec/app/catalog.json depuis data/foundations-banque-mots.json.

C'est la copie embarquée du référentiel que la PWA utilise pour son tout
premier lancement hors-ligne (avant toute connexion à Supabase) — voir
fennec/app/main.mjs `ensureCatalog()`. Le format est celui attendu par
FennecStore.saveCatalog() (fennec/src/db.mjs) : wordId, english, french,
category, worldId, introWeek, introDay, audioUrl, imageUrl (camelCase).

À relancer avec fennec/supabase/seed/generate_seed.py chaque fois que
scripts/generate-foundations-word-bank.py change le curriculum.
"""

import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
WORDS_JSON = os.path.join(ROOT, "data", "foundations-banque-mots.json")
OUT = os.path.join(HERE, "catalog.json")


def world_id_for(monde_label):
    # "M6 · Food" -> 6
    return int(monde_label.split(" ")[0][1:])


def main():
    with open(WORDS_JSON, encoding="utf-8") as f:
        words = json.load(f)

    catalog = [
        {
            "wordId": w["id"],
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

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Écrit {OUT} ({len(catalog)} mots)")


if __name__ == "__main__":
    main()
