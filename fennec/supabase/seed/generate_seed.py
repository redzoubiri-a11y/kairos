#!/usr/bin/env python3
"""Génère fennec/supabase/seed/seed_words.sql depuis data/foundations-banque-mots.json
et data/builder-banque-mots.json.

À relancer chaque fois que scripts/generate-foundations-word-bank.py ou
scripts/generate-builder-word-bank.py change le curriculum. Produit les 16
mondes (M1..M8 Foundations, B1..B8 Builder) à partir des deux documents de
curriculum (titres codés en dur ci-dessous : ils bougent rarement et un
changement de titre ne doit pas être silencieux). Mêmes offsets
d'identifiants que fennec/app/build_catalog.py (Builder décalé de
BUILDER_ID_OFFSET / BUILDER_WORLD_OFFSET) pour que les deux exports du
même référentiel restent cohérents entre eux.
"""

import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FOUNDATIONS_JSON = os.path.join(ROOT, "data", "foundations-banque-mots.json")
BUILDER_JSON = os.path.join(ROOT, "data", "builder-banque-mots.json")
OUT = os.path.join(HERE, "seed_words.sql")

BUILDER_ID_OFFSET = 10000
BUILDER_WORLD_OFFSET = 8

WORLDS = [
    (1, "m1-hello",    "Hello!",              "Se présenter",        1, 4),
    (2, "m2-colours",  "Colours & Numbers",   "Couleurs et nombres", 5, 8),
    (3, "m3-family",   "My Family",           "Ma famille",          9, 12),
    (4, "m4-body",     "My Body",             "Mon corps",           13, 16),
    (5, "m5-animals",  "Animals",             "Les animaux",         17, 20),
    (6, "m6-food",     "Food",                "La nourriture",       21, 24),
    (7, "m7-school",   "My School & My Day",  "École et journée",    25, 28),
    (8, "m8-world",    "My World",            "Mon monde",           29, 32),
    (9,  "b1-yesterday-today",   "Yesterday & Today",     "Hier et aujourd'hui",   33, 36),
    (10, "b2-comparing",         "Comparing Things",      "Comparer",              37, 40),
    (11, "b3-around-town",       "Around Town",            "Se repérer en ville",  41, 44),
    (12, "b4-plans-future",      "Plans & Future",         "Projets et futur",     45, 48),
    (13, "b5-story-time",        "Story Time",             "Raconter une histoire",49, 52),
    (14, "b6-feelings-opinions", "Feelings & Opinions",    "Sentiments et avis",   53, 56),
    (15, "b7-my-country",        "My Country, My World",   "Mon pays, mon monde",  57, 60),
    (16, "b8-builder-show",      "Builder Show",           "Le grand spectacle",   61, 64),
]

def esc(s):
    return s.replace("'", "''")

def sql_str(s):
    return "'" + esc(s) + "'" if s is not None else "null"

def world_id_for(monde_label):
    # "M6 · Food" -> 6 ; "B1 · Yesterday & Today" -> 9 (8 + 1)
    prefix, number = monde_label.split(" ")[0][0], int(monde_label.split(" ")[0][1:])
    return number if prefix == "M" else number + BUILDER_WORLD_OFFSET

def rows_for(words, id_offset=0):
    rows = []
    for w in words:
        rows.append(
            "  (" + ", ".join([
                str(w["id"] + id_offset),
                sql_str(w["anglais"]),
                sql_str(w["francais"]),
                sql_str(w["categorie"]),
                str(world_id_for(w["monde"])),
                str(int(w["semaine_intro"][1:])),
                str(w["jour_intro"]),
                sql_str(w["r1"]), sql_str(w["r2"]), sql_str(w["r3"]),
                sql_str(w["r4"]), sql_str(w["r5"]),
            ]) + ")"
        )
    return rows

def main():
    with open(FOUNDATIONS_JSON, encoding="utf-8") as f:
        foundations = json.load(f)
    with open(BUILDER_JSON, encoding="utf-8") as f:
        builder = json.load(f)

    lines = [
        "-- Fennec — seed du référentiel pédagogique (généré, ne pas éditer à la main)",
        "-- Sources : data/foundations-banque-mots.json, data/builder-banque-mots.json",
        "-- Régénérer avec : python3 fennec/supabase/seed/generate_seed.py",
        "",
        "begin;",
        "",
        "insert into worlds (id, slug, title_en, title_fr, week_start, week_end) values",
    ]
    world_rows = [
        f"  ({wid}, {sql_str(slug)}, {sql_str(en)}, {sql_str(fr)}, {ws}, {we})"
        for wid, slug, en, fr, ws, we in WORLDS
    ]
    lines.append(",\n".join(world_rows) + "\non conflict (id) do update set")
    lines.append("  slug = excluded.slug, title_en = excluded.title_en,")
    lines.append("  title_fr = excluded.title_fr, week_start = excluded.week_start, week_end = excluded.week_end;")
    lines.append("")
    lines.append("insert into words")
    lines.append("  (external_id, english, french, category, world_id, intro_week, intro_day,")
    lines.append("   review_1, review_2, review_3, review_4, review_5)")
    lines.append("values")

    rows = rows_for(foundations) + rows_for(builder, id_offset=BUILDER_ID_OFFSET)
    lines.append(",\n".join(rows))
    lines.append("on conflict (external_id) do update set")
    lines.append("  english = excluded.english, french = excluded.french, category = excluded.category,")
    lines.append("  world_id = excluded.world_id, intro_week = excluded.intro_week, intro_day = excluded.intro_day,")
    lines.append("  review_1 = excluded.review_1, review_2 = excluded.review_2, review_3 = excluded.review_3,")
    lines.append("  review_4 = excluded.review_4, review_5 = excluded.review_5;")
    lines.append("")
    lines.append("commit;")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Écrit {OUT} ({len(foundations)} mots Foundations + {len(builder)} mots Builder, {len(WORLDS)} mondes)")

if __name__ == "__main__":
    main()
