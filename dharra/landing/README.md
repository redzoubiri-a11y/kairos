# Dharra — Landing « 7 leviers de la Tazkiya »

Page de capture mono-objectif (livrable H, PARTIE 2). RTL, mobile-first, charte D
(nuit `#0E1C1B` + or `#C9A24B`, Amiri + IBM Plex Sans Arabic). Une page = une décision :
laisser un **email** pour recevoir les 7 leviers (PDF + audio).

## 🟢 En ligne (déploiement de test)
**https://transcendent-kulfi-bd5d74.netlify.app** — hébergé sur Netlify (compte
red.zoubiri@gmail.com), capture branchée sur MailerLite (compte "Dharra", voir
`SETUP_mailerlite.md`). Formulaire "Dharra - 7 leviers" créé, groupe `7-leviers`,
champ personnalisé `video_source` (nommé ainsi car "source" est réservé côté
MailerLite). Double opt-in activé.

> ⚠️ URL provisoire (sous-domaine Netlify aléatoire). À terme : brancher le domaine
> `getdharra.com` sur ce même site Netlify (Domain management → Add custom domain),
> ou redéployer sur Vercel une fois le connecteur autorisé à créer des projets.

## Fichier
- `index.html` — page autonome (HTML + CSS + JS inline, aucune dépendance de build).

## Déploiement — état actuel et suite possible
- **Fait** : déployé via Netlify Drop, site rendu public (Project → *Make public*,
  les nouveaux sites Netlify sont *privés par défaut*).
- **Mise à jour du contenu** : glisser-déposer un nouveau `index.html` sur la page
  *Production deploys* du projet Netlify (`app.netlify.com/projects/transcendent-kulfi-bd5d74`)
  redéploie instantanément sur la même URL.
- **Domaine définitif** : réserver `getdharra.com` (libre au dernier scan — livrable E)
  et le pointer sur ce site Netlify (ou re-déployer sur Vercel/`getdharra.com` directement).

Chargement visé < 2 s : page unique, polices en `display=swap`, motif en SVG inline.

## Capture — état actuel
- **Fait** : formulaire branché sur MailerLite (`FORM_ACTION` / `FIELD_EMAIL` /
  `FIELD_SOURCE` renseignés dans `index.html`) → les inscrits arrivent dans le groupe
  `7-leviers`, avec `video_source` renseigné depuis le tag `?src=` de l'URL.
- **Fait** : canal WhatsApp branché (`WHATSAPP_URL`) → bouton actif sur l'écran « merci ».
- **Reste à faire** :
  1. **Lien « الخصوصية »** (`[data-privacy]`) → page de confidentialité (RGPD/consentement).
  2. **Automation de bienvenue** — créer le workflow dans MailerLite (Automations → trigger
     "quand l'abonné rejoint le groupe 7-leviers") et y coller les 3 emails déjà rédigés dans
     `WELCOME_sequence.md` (J+0 le PDF, J+2 relance, J+5 pont YouTube/WhatsApp/app).
  3. **Double opt-in** est activé côté MailerLite : chaque inscrit reçoit d'abord un email
     de confirmation avant d'entrer dans le groupe — c'est voulu (qualité de liste), mais à
     garder en tête pour le KPI "ouverture séquence de bienvenue" (F.7).

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
