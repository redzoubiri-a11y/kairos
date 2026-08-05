# Dharra — Landing « 7 leviers de la Tazkiya »

Page de capture mono-objectif (livrable H, PARTIE 2). RTL, mobile-first, charte D
(nuit `#0E1C1B` + or `#C9A24B`, Amiri + IBM Plex Sans Arabic). Une page = une décision :
laisser un **email** pour recevoir les 7 leviers (PDF + audio).

## 🟢 En ligne (déploiement de test)
**https://transcendent-kulfi-bd5d74.netlify.app** — hébergé sur Netlify (compte
red.zoubiri@gmail.com), capture branchée sur un Google Form réel (voir
`SETUP_googleform.md`), testé et confirmé fonctionnel (email → Google Sheet).

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
- **Fait** : formulaire branché sur un Google Form réel (`FORM_ACTION` / `ENTRY_EMAIL` /
  `ENTRY_SOURCE` renseignés dans `index.html`) → les emails arrivent dans un Google Sheet.
  Le formulaire doit être **publié** côté Google (Réponses → accepter les réponses),
  sinon les envois sont silencieusement ignorés.
- **Reste à faire (2 TODO)** :
  1. **Lien WhatsApp** — `WHATSAPP_URL` est vide ; renseigne le lien du canal pour activer
     le bouton « rejoins le canal » de l'écran « merci ».
  2. **Lien « الخصوصية »** (`[data-privacy]`) → page de confidentialité (RGPD/consentement).
- **Automatisation de bienvenue (J+0/J+2/J+5)** : Google Form ne l'envoie pas automatiquement ;
  le PDF est livré par le bouton de téléchargement de l'écran « merci ». Pour l'automatiser,
  voir `SETUP_mailerlite.md` + `WELCOME_sequence.md` (déjà rédigés, à brancher plus tard).

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
