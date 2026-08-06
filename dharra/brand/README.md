# Dharra — Identité visuelle YouTube

Générés à partir de la charte D (nuit `#0E1C1B` + or `#C9A24B`, Amiri + IBM Plex Sans Arabic),
rendus via Chromium headless (HTML/CSS → PNG, polices Google Fonts embarquées en base64).

## Fichiers
- **`dharra-logo-800x800.png`** — photo de profil (carrée, sera recadrée en cercle par YouTube).
  Marque : point or + « ذرة » en Amiri, halo doré, fond dégradé nuit.
- **`dharra-banner-2048x1152.png`** — bannière de chaîne (format YouTube standard).
  Contenu centré dans la zone de sécurité (1546×423 px) pour rester lisible sur tous les
  appareils (mobile/TV/desktop) selon les specs officielles YouTube.

## Où les importer
YouTube Studio → **Personnalisation de la chaîne** → onglet **Profil** :
- Section **« Photo »** → Importer → `dharra-logo-800x800.png`
- Section **« Image de la bannière »** → Importer → `dharra-banner-2048x1152.png`

## Régénérer / ajuster
Les sources HTML (`logo.html`, `banner.html`, tokens de charte D) ont servi de gabarit —
si un ajustement est nécessaire (texte, halo, contraste), le même pipeline (HTML → capture
Chromium headless avec polices inlinées en base64) peut être relancé.
