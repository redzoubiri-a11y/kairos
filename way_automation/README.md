# WA'Y — Automatisation audio YouTube

Outil Python qui automatise la production des voix-off de la chaîne YouTube
**WA'Y**.

**Étape 1** (ce dépôt) : prendre un script vidéo en texte brut, le nettoyer,
puis générer un fichier audio MP3 via l'API [ElevenLabs](https://elevenlabs.io/).

## Ce que fait le nettoyage

- **Retire les indications de mise en scène** entre crochets, par ex.
  `[Image : ...]`, `[Musique douce]`, `[Transition]` — elles ne doivent pas
  être lues par la voix.
- **Convertit les pourcentages en toutes lettres** pour une bonne prononciation :
  - `35%` → `trente-cinq pour cent`
  - `12,5%` → `douze virgule cinq pour cent`
- Normalise les espaces et la ponctuation.

## Structure du projet

```
way_automation/
├── generate_audio.py      ← script principal (CLI)
├── text_cleaner.py        ← nettoyage du texte + nombres en lettres
├── elevenlabs_client.py   ← appel à l'API ElevenLabs
├── requirements.txt
├── .env.example           ← modèle de configuration (à copier en .env)
├── scripts/               ← textes de scripts en entrée (.txt)
│   └── exemple.txt
└── audio/                 ← fichiers MP3 générés en sortie
```

## Installation

```bash
cd way_automation
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

La clé API n'est **jamais** écrite en dur dans le code : elle est lue depuis
un fichier `.env` (ignoré par git).

```bash
cp .env.example .env
# puis éditez .env et collez votre clé ELEVENLABS_API_KEY
```

| Variable               | Obligatoire | Description                                  |
| ---------------------- | ----------- | -------------------------------------------- |
| `ELEVENLABS_API_KEY`   | oui         | Votre clé API ElevenLabs.                    |
| `ELEVENLABS_VOICE_ID`  | non         | Voix utilisée (défaut : « Rachel »).         |
| `ELEVENLABS_MODEL_ID`  | non         | Modèle TTS (défaut : `eleven_multilingual_v2`). |

## Utilisation

```bash
# Génère audio/exemple.mp3 à partir de scripts/exemple.txt
python generate_audio.py exemple.txt

# Chemin de sortie personnalisé
python generate_audio.py exemple.txt -o audio/intro.mp3

# Aperçu du texte nettoyé sans appeler l'API (aucune clé requise)
python generate_audio.py exemple.txt --dry-run
```

L'argument d'entrée peut être un simple nom de fichier (cherché dans
`scripts/`) ou un chemin complet.

## Prochaines étapes envisagées

- Découpage automatique des scripts trop longs.
- Choix de la voix par épisode.
- Génération des sous-titres synchronisés.
