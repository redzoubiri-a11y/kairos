# Dharra — Brancher la capture avec un Google Form (rapide, sans nouveau compte)

Objectif : le formulaire de la landing enregistre chaque email dans un **Google Sheet**
(via ton compte Gmail). Le PDF « 7 leviers » est livré **immédiatement** par le bouton de
téléchargement de l'écran « merci ». Zéro nouveau compte, ~3 minutes.

> ⚠️ Ce que Google Form **ne fait pas** : la séquence de bienvenue automatique (J+0/J+2/J+5).
> Pour l'instant le PDF est donné par le bouton de téléchargement. Quand tu voudras
> l'automatisation, on branchera un outil d'emailing (voir `SETUP_mailerlite.md`) — la
> séquence est déjà écrite dans `WELCOME_sequence.md`.

---

## Étape 1 — Créer le formulaire
1. Va sur **forms.google.com** (connecté avec red.zoubiri@gmail.com) → **Vierge / Blank**.
2. Titre : **Dharra — 7 leviers**.

## Étape 2 — Ajouter 2 questions (exactement ces noms)
1. Question 1 → type **Réponse courte** → intitulé **`Email`**. Marque-la **obligatoire**.
2. Clique **＋** pour ajouter la Question 2 → type **Réponse courte** → intitulé **`Source`**.
   (Elle recevra le tag `ep01`, `ep02`… pour savoir quelle vidéo convertit. Non obligatoire.)

## Étape 3 — Lier une feuille de réponses
En haut → onglet **Réponses** → icône **Sheets** (vert) → **Créer une feuille de calcul**.
C'est là que tomberont les emails.

## Étape 4 — Récupérer le « lien pré-rempli » (ça me donne tout)
1. En haut à droite → menu **⋮ (trois points)** → **Obtenir le lien de préremplissage**.
2. Dans le champ **Email**, tape n'importe quoi (ex. `test@test.com`).
   Dans **Source**, tape `test`.
3. En bas → **Obtenir le lien** → **Copier le lien**.

## Étape 5 — Me l'envoyer
Colle-moi **ce lien pré-rempli** dans le chat (il ressemble à
`https://docs.google.com/forms/d/e/XXXX/viewform?usp=pp_url&entry.111=test%40test.com&entry.222=test`).
J'en extrais automatiquement les 3 valeurs (`FORM_ACTION`, `ENTRY_EMAIL`, `ENTRY_SOURCE`),
je les colle dans `index.html`, je commit et je pousse. La landing devient **fonctionnelle**.

> Si tu as déjà un **lien de canal WhatsApp**, colle-le aussi → j'active le bouton
> « rejoins le canal » de l'écran « merci ».

## Étape 6 — Vérifier (après mon branchement)
- Ouvre la landing, saisis un email test → il doit apparaître dans le Google Sheet.
- Ouvre un lien taggé `…/?src=ep01` → la colonne **Source** doit afficher `ep01`.

---

### Rappel : ce que je fais, moi
- Le collage des 3 valeurs dans le code + commit + push.
- (Option) déployer ensuite la landing gratuitement sur Vercel (`…vercel.app`).
### Ce que toi seul peux faire
- Créer le Google Form (il est lié à *ton* Google Drive) et me donner le lien pré-rempli.
