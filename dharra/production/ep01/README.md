# Dharra — Épisode 1 : pack visuel de production

Généré selon la charte D + le kit G (fond nuit `#0E1C1B`, halo or, Amiri pour le sacré,
IBM Plex pour la marque). Prêt à assembler dans CapCut ou tout autre monteur.

## Fichiers

| Fichier | Rôle | Format |
|---|---|---|
| `dharra-ep1-fond-1920x1080.png` | Fond de base (avec logo coin haut-gauche) — piste du dessous, présente **tout du long** de la vidéo | Opaque |
| `dharra-ep1-key-hook-1920x1080.png` | Mot-clé « لماذا لا تفعله » | **Transparent** (superposer sur B-roll/fond) |
| `dharra-ep1-key-ghafla-1920x1080.png` | Mot-clé « الغفلة » | **Transparent** |
| `dharra-ep1-key-outil-1920x1080.png` | Mot-clé « سمِّها الليلة » | **Transparent** |
| `dharra-ep1-key-marque-1920x1080.png` | Mot-clé « ذرة » (CTA final) | **Transparent** |
| `dharra-ep1-verset-cartouche-1920x1080.png` | Cartouche plein écran du verset (Coran 21:1) | Opaque |

> ⚠️ Les fichiers "transparent" ont bien un canal alpha réel (vérifié) — s'ils s'affichent sur
> fond blanc dans un aperçu, c'est juste l'aperçu ; ils se superposeront correctement en montage.

## Où les placer, avec les minutages du script (`A_script_episode_1_pilote.md`)

| Minutage | Fichier à afficher |
|---|---|
| 0:00–2:30 | `dharra-ep1-fond-1920x1080.png` (piste de fond continue) |
| 0:00 (quelques secondes) | `+ dharra-ep1-key-hook-1920x1080.png` en superposition |
| 2:30–4:30 | `dharra-ep1-verset-cartouche-1920x1080.png` (remplace le fond, plein écran) |
| après le verset | `+ dharra-ep1-key-ghafla-1920x1080.png` en superposition sur le fond |
| 7:00 (quelques secondes) | `+ dharra-ep1-key-outil-1920x1080.png` |
| 10:00 (CTA final) | `+ dharra-ep1-key-marque-1920x1080.png` — logo qui s'illumine, fondu de fin |

## Assemblage rapide dans CapCut (gratuit)
1. Importe `dharra-ep1-fond-1920x1080.png` sur la **piste vidéo du bas** — étire-le sur toute la
   durée de l'épisode (~10-12 min).
2. Importe les audios (voix IA + verset en voix humaine) sur la **piste audio**, dans l'ordre du script.
3. Pour chaque carte mot-clé (`key-*.png`) : glisse-la sur une **piste vidéo au-dessus** du fond,
   position/durée selon le tableau ci-dessus (2-3 secondes chacune suffit).
4. Pour le cartouche du verset : remplace temporairement le fond par
   `dharra-ep1-verset-cartouche-1920x1080.png` pendant les ~10 secondes de la lecture du verset.
5. Ajoute les **sous-titres arabes** (CapCut peut générer automatiquement une base à partir de
   l'audio — à corriger ensuite pour la précision, notamment sur le verset).
6. Ajoute la **nappe sonore** (musique de fond libre de droits, cf. kit G.3) en piste audio basse,
   volume nettement sous la voix (-22 à -26 dB).
7. Exporte en 1920×1080, puis découpe les 3 shorts (hook / outil / verset) du même master.

## Miniature (à faire séparément)
Le gabarit D.3 (1280×720) n'est pas encore généré pour cet épisode — dis-le si tu veux que je
le prépare aussi, sur le même principe (titre `لماذا لا تفعله`, mot en or `تفعله`).
