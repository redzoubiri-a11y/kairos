# FZ Consulting — site web

Implémentation de la V1 décrite dans [`docs/fz-consulting/plan-site-web.md`](../../docs/fz-consulting/plan-site-web.md).
La maquette de référence est [`docs/fz-consulting/maquette-v1.html`](../../docs/fz-consulting/maquette-v1.html).

Next.js 15 (App Router), TypeScript, CSS simple. Aucune dépendance d'interface :
la feuille de style tient dans un fichier et se modifie à la main.

## Démarrer

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000 → redirige vers /fr
```

Autres commandes : `npm run build`, `npm start`, `npm run typecheck`.

## Où se trouve quoi

```
content/fr/*.json     TOUS les textes et chiffres du site
src/lib/content.ts    types + chargement des contenus
src/lib/whatsapp.ts   liens WhatsApp et messages pré-remplis
src/app/[locale]/     les pages (accueil, offres, résultats, contact, pages légales)
src/components/       en-tête, pied, formulaire, blocs réutilisables
src/styles/globals.css  la totalité du style, jetons de design en tête de fichier
src/app/api/contact/  réception du formulaire
src/middleware.ts     préfixe de langue (/ → /fr)
```

**Règle de travail :** aucun texte dans les composants. Tout passe par `content/`.
C'est ce qui rendra le branchement d'un CMS indolore — seule la fonction
`getContent()` changera.

## Modifier le contenu

| Ce qu'on veut changer | Fichier |
|---|---|
| Numéro WhatsApp, e-mail, LinkedIn, ville | `content/fr/site.json` |
| Textes et chiffres de l'accueil | `content/fr/home.json` |
| Les 4 phases de la Méthode FZ | `content/fr/method.json` |
| Offres de conseil, parcours, tarifs | `content/fr/offers.json` |
| Cas clients | `content/fr/cases.json` |

### Les tarifs

Chaque prix vaut `null` par défaut. Une ligne dont le prix est `null` ne
s'affiche pas, et le bloc « Tarifs » disparaît entièrement tant qu'aucun
montant n'est renseigné. **Les prix ne bloquent donc jamais la mise en ligne**
(plan, partie 4).

### Les cas clients

`"draft": true` affiche le badge « À valider » et masque l'appel à l'action du
cas. Passer à `false` une fois le cas confirmé par le client.

## Avant la mise en ligne

1. `NEXT_PUBLIC_DRAFT=0` — retire le bandeau « maquette » et autorise l'indexation.
2. Renseigner `whatsapp`, `email`, `linkedin`, `baseUrl` dans `site.json`.
3. Configurer `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, sans
   quoi les demandes du formulaire sont seulement journalisées.
4. Créer un widget Cloudflare Turnstile et renseigner les deux clés.
5. Compléter les pages `mentions-legales` et `confidentialite`, puis les faire
   valider par un conseil local (loi 18-07, et RGPD si hébergement dans l'UE).
6. Remplacer les valeurs `XX` et `[X]` restantes dans `content/`.
7. Fournir le portrait de Fatima et renseigner `about.portrait`.

## Ajouter l'arabe

L'architecture est déjà en place, aucune URL existante ne bougera.

1. Ajouter `'ar'` à `locales` dans `src/lib/content.ts` et à `LOCALES` dans
   `src/middleware.ts`.
2. Dupliquer `content/fr/` en `content/ar/` et traduire.
3. Enregistrer les imports dans `byLocale`.

`dir="rtl"` est déjà appliqué automatiquement, et la feuille de style utilise
des propriétés logiques (`padding-inline`, `inset-inline`) : le passage en RTL
ne demande pas de reprise du CSS.

## Brancher un CMS

Le jour où Fatima doit éditer seule, remplacer le corps de `getContent()` par
un appel au CMS. Les types de `src/lib/content.ts` définissent le schéma à
reproduire côté CMS — ils sont la source de vérité. Aucun composant ne change.

## Anti-spam du formulaire

Trois protections cumulées dans `src/app/api/contact/route.ts` :

1. **champ piège** — invisible, rempli seulement par les robots ;
2. **Turnstile** — vérifié uniquement si `TURNSTILE_SECRET_KEY` est configuré ;
3. **limitation par IP** — 5 envois par tranche de 10 minutes. En mémoire, donc
   remise à zéro à chaque redéploiement : c'est un garde-fou, pas une défense.
   Si le spam devient un problème, passer sur un stockage partagé.

## Déploiement

Vercel, dépôt connecté, racine du projet `sites/fz-consulting`. Les variables
d'environnement se déclarent dans les réglages du projet.

## L'auto-diagnostic

`/fr/diagnostic` — 20 questions réparties sur les quatre phases de la méthode.
Score global, score par phase, et les chantiers prioritaires (phases sous 60 %),
chacun renvoyant vers l'offre correspondante.

- Les questions, l'échelle, les paliers de verdict et les conseils sont dans
  `content/fr/diagnostic.json` — modifiables sans toucher au code.
- Le seuil de faiblesse est `WEAK_BELOW` dans `src/lib/diagnostic.ts`.
- `POST /api/diagnostic` reçoit le détail des réponses : la personne obtient son
  diagnostic, le cabinet obtient un contact qualifié accompagné du problème
  déjà posé. Ces réponses alimenteront le Baromètre annuel.

Ajouter ou retirer une question ne demande qu'une ligne de JSON : le score se
recalcule sur le maximum réellement atteignable.
