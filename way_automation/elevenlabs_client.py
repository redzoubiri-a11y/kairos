"""Client minimal pour l'API Text-to-Speech d'ElevenLabs.

La clé API n'est jamais écrite en dur : elle est lue depuis l'environnement
(chargé depuis un fichier ``.env`` par ``python-dotenv``).
"""

from __future__ import annotations

import os

import requests

API_BASE_URL = "https://api.elevenlabs.io/v1"

# Voix par défaut "Rachel" fournie par ElevenLabs ; surchargée via .env.
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"


class ElevenLabsError(RuntimeError):
    """Erreur renvoyée lorsque l'appel à l'API échoue."""


def text_to_speech(
    text: str,
    output_path: str,
    *,
    api_key: str,
    voice_id: str | None = None,
    model_id: str | None = None,
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    timeout: int = 120,
) -> str:
    """Génère un MP3 à partir du ``text`` et l'écrit dans ``output_path``.

    Retourne le chemin du fichier écrit. Lève ``ElevenLabsError`` en cas
    de réponse non valide de l'API.
    """
    if not api_key:
        raise ElevenLabsError(
            "Clé API ElevenLabs manquante. Renseigne ELEVENLABS_API_KEY "
            "dans ton fichier .env."
        )
    if not text.strip():
        raise ElevenLabsError("Le texte à synthétiser est vide après nettoyage.")

    voice_id = voice_id or DEFAULT_VOICE_ID
    model_id = model_id or DEFAULT_MODEL_ID

    url = f"{API_BASE_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
        },
    }

    try:
        response = requests.post(
            url, headers=headers, json=payload, timeout=timeout
        )
    except requests.RequestException as exc:  # erreurs réseau
        raise ElevenLabsError(f"Échec de la requête vers ElevenLabs : {exc}") from exc

    if response.status_code != 200:
        # ElevenLabs renvoie un JSON d'erreur explicite la plupart du temps.
        detail = response.text
        try:
            detail = response.json()
        except ValueError:
            pass
        raise ElevenLabsError(
            f"ElevenLabs a répondu {response.status_code} : {detail}"
        )

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as audio_file:
        audio_file.write(response.content)

    return output_path
