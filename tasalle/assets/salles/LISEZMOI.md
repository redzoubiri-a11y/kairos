# Photos de salles embarquées

Un dossier par salle, nommé avec son identifiant (`salle-001`, `salle-002`…),
tel qu'il apparaît dans `src/data/seed.js`. Les fichiers déposés ici sont
compilés dans l'app : ils s'affichent hors ligne et sans latence, contrairement
aux URL de `src/data/photos.json`.

## Ajouter des photos à une salle

1. Déposer les fichiers dans `assets/salles/<id>/`, nommés `photo-1.jpg`,
   `photo-2.jpg`, … (l'ordre des noms est l'ordre de la galerie).
2. Déclarer chaque fichier dans `src/data/photosLocales.js` :

   ```js
   'salle-002': [
     require('../../assets/salles/salle-002/photo-1.jpg'),
     require('../../assets/salles/salle-002/photo-2.jpg'),
   ],
   ```

   Metro résout les `require` d'images à la compilation : un chemin construit
   dynamiquement (`require(\`.../\${id}.jpg\`)`) ne fonctionne pas, chaque
   fichier doit être écrit en toutes lettres.

3. Relancer le bundler (`npx expo start --port 8085`) — le hot reload ne prend
   pas en compte les nouveaux assets.

## Format attendu

- **1200 px de large**, ratio 4:3 (Annexe A du design system), JPEG.
- Viser moins de 400 Ko par fichier : tout ce dossier part dans le binaire de
  l'app. Redimensionner au besoin :

  ```sh
  sips -Z 1200 --setProperty formatOptions 72 source.jpg --out photo-1.jpg
  ```

- En dessous de ~800 px de large, l'image sera visiblement floue sur la
  galerie plein écran de la fiche salle (260 px de haut en pleine largeur) et
  sur les cartes de l'accueil.

## Provenance

Uniquement des photos fournies par le propriétaire de la salle, ou libres pour
un usage commercial (Pexels, Unsplash). Les images récupérées sur Google
Images, Instagram, Facebook ou le site d'une salle appartiennent à leurs
auteurs — voir le `_lisezmoi` de `src/data/photos.json`.
