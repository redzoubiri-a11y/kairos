/**
 * Work Sans dans Remotion.
 *
 * Même piège qu'au rendu statique, autre moteur : Chromium ne signale pas une
 * police absente, il retombe sur son serif par défaut et la vidéo sort dans la
 * mauvaise typographie sans que rien n'échoue. Vérifié en construisant ce
 * gabarit — le premier essai est sorti en Times.
 *
 * D'où `delayRender()` : le rendu est mis en attente tant que la police n'est
 * pas chargée, et `cancelRender()` le fait échouer si elle ne l'est pas. Un
 * rendu qui s'arrête vaut mieux qu'un rendu qui ment.
 *
 * Les fichiers viennent du paquet @expo-google-fonts/work-sans — les mêmes que
 * charge l'application — recopiés dans remotion/public/ par `prepare:fonts`,
 * jamais versionnés.
 */

import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

/** Les trois graisses, sous le nom exact qu'emploie src/theme.js de Mida. */
export const FACES = [
  { family: 'Work Sans Regular', weight: '400', file: 'WorkSans_400Regular.ttf' },
  { family: 'Work Sans SemiBold', weight: '600', file: 'WorkSans_600SemiBold.ttf' },
  { family: 'Work Sans ExtraBold', weight: '800', file: 'WorkSans_800ExtraBold.ttf' },
] as const;

let chargement: Promise<void> | null = null;

/**
 * Charge les trois graisses une seule fois par page.
 * Rend la promesse pour que l'appelant puisse l'attendre ; les erreurs
 * remontent, elles ne sont pas avalées.
 */
export function chargerWorkSans(): Promise<void> {
  if (chargement) return chargement;

  chargement = Promise.all(
    FACES.map(async ({ family, weight, file }) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {
        weight,
      });
      await face.load();
      // La lib.dom de TypeScript déclare FontFaceSet comme un EventTarget nu,
      // sans add/delete/has, alors que tout navigateur les expose. On restreint
      // l'élargissement à la seule méthode utilisée.
      (document.fonts as FontFaceSet & { add(f: FontFace): void }).add(face);
    }),
  ).then(() => undefined);

  return chargement;
}

/**
 * À appeler dans un composant : bloque le rendu jusqu'au chargement.
 * Le handle est rendu pour que React puisse le libérer au démontage.
 */
export function attendreWorkSans(): void {
  const handle = delayRender('Chargement de Work Sans');
  chargerWorkSans()
    .then(() => continueRender(handle))
    .catch((e) =>
      cancelRender(
        new Error(
          `Work Sans n'a pas pu être chargée : ${e instanceof Error ? e.message : String(e)}. ` +
            'Le rendu est interrompu plutôt que de sortir dans la police de repli ' +
            'de Chromium. Lancer `npm run prepare:fonts`.',
        ),
      ),
    );
}
