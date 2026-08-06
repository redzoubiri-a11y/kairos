# Banc d'essai des fonctions Edge

Exécute `send-sms-hook` et `dispatch-notifications` hors de Supabase, pour les
éprouver avant tout déploiement.

```bash
npm i -D esbuild standardwebhooks
node scripts/edge/run.mjs
```

`@supabase/supabase-js` est déjà une dépendance du projet.

## Comment ça marche

Les fonctions sont écrites pour Deno : elles utilisent `Deno.env` et
`Deno.serve`, et importent leurs dépendances par URL. Le banc les compile avec
esbuild en réécrivant ces imports vers leurs équivalents npm, puis fournit un
adaptateur pour les deux API Deno — `Deno.serve` retient le gestionnaire au
lieu d'ouvrir un port, ce qui permet de l'appeler directement.

Supabase, la passerelle SMS et le service push d'Expo sont remplacés par de
vrais serveurs HTTP locaux, pas par des doublures en mémoire : les requêtes
partent réellement du code des fonctions, ce qui vérifie aussi la construction
des URL, des en-têtes et des corps. L'URL d'Expo étant codée en dur dans la
fonction, `fetch` est détourné pour la seule origine `exp.host`.

## Portée

Ce que le banc établit : la logique s'exécute — vérification de signature du
hook (falsification, rejeu, secret étranger), normalisation du numéro,
troncature à 160 caractères, choix du fournisseur, remontée des pannes de
passerelle, boucle d'expédition, cache des jetons par destinataire, lecture
des tickets d'Expo (qui répond 200 même sur un jeton périmé), et marquage
livré/échoué.

Ce qu'il n'établit pas : la compatibilité avec le runtime Deno lui-même. Les
deux API utilisées sont standard et l'import distant est le seul écart, mais
un déploiement reste à faire une première fois de façon attentive.
