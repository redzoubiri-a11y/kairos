# PDF — « سبعة مفاتيح للتزكية » (7 leviers de la Tazkiya)

Lead magnet de l'audience (arabe MSA), mis en page selon la **charte D**.

## Fichiers
- **`7-leviers-tazkiya.html`** — source auto-suffisante (polices Amiri + IBM Plex Sans
  Arabic **embarquées en base64** → rendu identique partout, même hors-ligne ; sous-ensemble
  arabe uniquement). RTL, format A4.
- **`7-leviers-tazkiya.pdf`** — PDF prêt à diffuser (7 pages, polices intégrées).

## Contenu (8 blocs / 7 pages A4)
1. Couverture · 2. Intro « قبل أن تبدأ » · 3–7. Les 7 leviers (blocage → بصيرة → الليلة,
avec cartouche آية/حديث) · 8. Clôture + CTA (قناة / ذرة اليوم / تطبيق).
Contenu aligné sur le livrable **H** ; sources **vérifiées** dans **`../K_sources_verifiees.md`**.

## Régénérer le PDF depuis le HTML
Le HTML étant auto-suffisant, il suffit de l'ouvrir dans un navigateur puis **Imprimer → PDF**
(marges : Aucune ; graphismes d'arrière-plan : activés). Ou en ligne de commande Chromium :

```bash
chromium --headless=new --no-sandbox \
  --run-all-compositor-stages-before-draw \
  --no-pdf-header-footer --print-to-pdf-no-header \
  --virtual-time-budget=20000 \
  --print-to-pdf=7-leviers-tazkiya.pdf \
  "file://$PWD/7-leviers-tazkiya.html"
```
> Le flag `--run-all-compositor-stages-before-draw` est nécessaire : sans lui, le moteur
> capture la page avant la fin du chargement des polices (rendu en police système).

## À faire avant diffusion réelle
- Enregistrer la **version audio** (5–7 min, même voix/nappe que la chaîne — kit G).
- Relecture d'un locuteur natif (tachkîl / diction) et validation religieuse finale (réf. K).
- Remplacer les CTA par les **liens réels** (canal WhatsApp, page app) une fois créés (livrable H).
