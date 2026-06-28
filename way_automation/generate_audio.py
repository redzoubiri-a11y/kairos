#!/usr/bin/env python3
"""Génère une voix-off MP3 à partir d'un script vidéo WA'Y.

Étapes :
  1. Lecture du fichier texte d'entrée (dossier ``scripts/`` par défaut).
  2. Nettoyage : retrait des indications entre crochets et conversion des
     pourcentages en toutes lettres.
  3. Envoi à l'API ElevenLabs et écriture du MP3 (dossier ``audio/``).

Exemples :
  python generate_audio.py scripts/episode01.txt
  python generate_audio.py scripts/episode01.txt -o audio/intro.mp3
  python generate_audio.py scripts/episode01.txt --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys

from dotenv import load_dotenv

from elevenlabs_client import ElevenLabsError, text_to_speech
from text_cleaner import clean_script_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")


def _default_output_path(input_path: str) -> str:
    """audio/<nom-du-script>.mp3"""
    stem = os.path.splitext(os.path.basename(input_path))[0]
    return os.path.join(AUDIO_DIR, f"{stem}.mp3")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Nettoie un script vidéo et génère un MP3 via ElevenLabs.",
    )
    parser.add_argument(
        "input",
        help="Fichier texte d'entrée (.txt), relatif au dossier scripts/ "
             "ou chemin complet.",
    )
    parser.add_argument(
        "-o", "--output",
        help="Chemin du MP3 de sortie (défaut : audio/<nom-du-script>.mp3).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche le texte nettoyé sans appeler l'API (aucune clé requise).",
    )
    return parser.parse_args(argv)


def _resolve_input_path(raw: str) -> str:
    """Accepte un chemin complet ou un nom relatif au dossier scripts/."""
    if os.path.isfile(raw):
        return raw
    candidate = os.path.join(SCRIPTS_DIR, raw)
    if os.path.isfile(candidate):
        return candidate
    raise FileNotFoundError(
        f"Fichier introuvable : '{raw}'. Place tes scripts dans {SCRIPTS_DIR}/."
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    try:
        input_path = _resolve_input_path(args.input)
    except FileNotFoundError as exc:
        print(f"❌ {exc}", file=sys.stderr)
        return 1

    with open(input_path, "r", encoding="utf-8") as handle:
        raw_text = handle.read()

    cleaned = clean_script_text(raw_text)

    if args.dry_run:
        print("--- Texte nettoyé ---")
        print(cleaned)
        print("--- Fin (--dry-run : aucun audio généré) ---")
        return 0

    # Chargement de la clé API depuis .env (jamais en dur dans le code).
    load_dotenv(os.path.join(BASE_DIR, ".env"))
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    model_id = os.getenv("ELEVENLABS_MODEL_ID")

    output_path = args.output or _default_output_path(input_path)

    print(f"🎙️  Génération de l'audio depuis : {input_path}")
    try:
        written = text_to_speech(
            cleaned,
            output_path,
            api_key=api_key,
            voice_id=voice_id,
            model_id=model_id,
        )
    except ElevenLabsError as exc:
        print(f"❌ {exc}", file=sys.stderr)
        return 1

    size_kb = os.path.getsize(written) / 1024
    print(f"✅ Audio généré : {written} ({size_kb:.0f} Ko)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
