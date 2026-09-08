# Dharra — Brancher la capture (MailerLite, gratuit)

Objectif : rendre la landing **vivante** — le formulaire enregistre l'email, envoie
automatiquement le PDF « 7 leviers », puis déroule la séquence de bienvenue (J+0 / J+2 / J+5).
MailerLite gratuit = jusqu'à **1 000 contacts** et l'**automatisation** incluse.

---

## Étape 1 — Créer le compte (≈ 5 min, à faire par toi)
1. Va sur **mailerlite.com** → *Sign up free*. Renseigne ton email, confirme.
2. Remplis le profil minimal (nom d'expéditeur : **Dharra** ; email d'envoi : le tien).
   > MailerLite demande une brève description du contenu pour activer l'envoi — écris
   > par ex. : « Rappels spirituels et outils de développement personnel (sunna + psychologie). »

## Étape 2 — Créer le groupe et le champ « source »
1. **Subscribers → Groups → Create group** → nomme-le **`7-leviers`**.
2. **Subscribers → Fields → Add field** → type *Text* → nom **`source`**
   (c'est lui qui recevra le tag `ep01`, `ep02`… pour mesurer quelle vidéo convertit).

## Étape 3 — Créer le formulaire et récupérer l'endpoint
1. **Forms → Create form → Embedded form** → assigne-le au groupe **`7-leviers`**.
2. Dans l'éditeur, ouvre **Embed** → onglet **« Use your own HTML »**.
3. Copie l'URL du `<form action="…">`. Elle ressemble à :
   `https://assets.mailerlite.com/jsonp/XXXXXX/forms/YYYYYY/subscribe`
4. Ouvre `dharra/landing/index.html` et colle-la dans la ligne :
   ```js
   var EMAIL_ENDPOINT = "";   // ← ici
   ```
   (Colle aussi le lien de ton canal WhatsApp dans `WHATSAPP_URL` juste en dessous.)
   > Tu peux me l'envoyer et je fais le collage + le commit à ta place.

## Étape 4 — Livraison du PDF (le fichier « aimant »)
Deux options, au choix :
- **Simple** : héberge le PDF `dharra/pdf/7-leviers-tazkiya.pdf` (il sera en ligne avec la
  landing sur Vercel) — le bouton de l'écran « merci » le télécharge déjà.
- **Recommandé (automatisation)** : l'envoyer par email en J+0 (étape 5), pour capter
  l'adresse *avant* de donner le fichier et démarrer la relation.

## Étape 5 — Séquence de bienvenue (Automations)
1. **Automations → Create workflow → Trigger : “When subscriber joins a group” → `7-leviers`.**
2. Ajoute 3 emails avec les délais et contenus du fichier
   **`WELCOME_sequence.md`** (copier-coller prêt à l'emploi).

## Étape 6 — Vérifier
- Ouvre la landing, saisis un email test → il doit apparaître dans le groupe `7-leviers`
  avec le bon `source`, et l'email J+0 doit partir.
- Teste un lien taggé : `.../?src=ep01` → le champ `source` doit valoir `ep01`.

---

## Alternatives (si tu ne veux pas MailerLite)
- **Brevo** : gratuit, automatisation aussi, très utilisé au Maghreb. Même principe :
  récupérer l'URL d'action du formulaire et la coller dans `EMAIL_ENDPOINT`.
- **Google Form** : le plus rapide, mais pas d'automatisation d'envoi (tu enverrais le PDF
  manuellement) — à réserver à un test rapide.

## Note WhatsApp
Le formulaire est **email-first** (c'est l'email qui permet l'envoi automatique du PDF et
la séquence). Le chemin **WhatsApp** reste offert par le bouton « rejoins le canal » de
l'écran « merci » : renseigne `WHATSAPP_URL` pour l'activer. Si tu veux à terme capturer
aussi les numéros dans une base, on ajoutera un champ `phone` — dis-le moi.
