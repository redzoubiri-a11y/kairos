# Dharra — Landing « 7 leviers de la Tazkiya »

Page de capture mono-objectif (livrable H, PARTIE 2). RTL, mobile-first, charte D
(nuit `#0E1C1B` + or `#C9A24B`, Amiri + IBM Plex Sans Arabic). Une page = une décision :
laisser un **email ou un numéro WhatsApp** pour recevoir les 7 leviers (PDF + audio).

## Fichier
- `index.html` — page autonome (HTML + CSS + JS inline, aucune dépendance de build).

## Déploiement (Vercel, domaine `getdharra.com`)
1. Réserver `getdharra.com` (libre au dernier scan — livrable E) ou pointer un sous-domaine.
2. Déployer ce dossier (`dharra/landing/`) comme site statique.
3. Config DNS → Vercel, HTTPS auto.

Chargement visé < 2 s : page unique, polices en `display=swap`, motif en SVG inline.

## À brancher avant mise en ligne (3 TODO dans le code)
1. **Fournisseur email/broadcast** — dans `index.html`, remplacer le `console.info` du
   handler `submit` par un `POST` vers l'endpoint réel (Mailerlite, Brevo, Google Form, etc.).
   Le payload envoie déjà `{ contact, source }`.
2. **Liens de l'état « merci »** — `a-pdf` doit pointer vers le PDF hébergé (par défaut
   `../pdf/7-leviers-tazkiya.pdf`) et `a-wa` vers le vrai canal WhatsApp/Telegram.
3. **Lien « الخصوصية »** (`[data-privacy]`) → page de confidentialité (RGPD/consentement).

## Attribution par épisode (KPI F.7)
La page lit `?src=` dans l'URL et l'envoie avec le contact. Mettre en description YouTube
des liens taggés : `getdharra.com/?src=ep01`, `?src=ep02`… pour mesurer le CTR de capture
par vidéo.

## KPI cibles (livrable H)
| Métrique | Cible |
|---|---|
| Visiteurs → inscrits | > 25 % |
| Ouverture séquence de bienvenue | > 45 % |
| Inscrit → canal WhatsApp | > 40 % |
