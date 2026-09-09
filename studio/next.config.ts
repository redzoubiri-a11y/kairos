/**
 * Le studio web vit dans le même paquet que le moteur : `app/` importe
 * directement `src/`, sans passage par un paquet publié ni duplication de
 * types. C'est aussi pourquoi la racine Next est `studio/` et pas un
 * sous-dossier — un import `../src/campaign.ts` depuis `studio/web/` sortirait
 * de la racine du projet, et le compilateur de Next ne le suivrait pas.
 */
import type { NextConfig } from 'next';

const config: NextConfig = {
  // sharp et les binaires de Remotion ne se bundlent pas : ils restent des
  // require() côté serveur. Sans ça, le build échoue sur les .node natifs.
  serverExternalPackages: ['sharp', '@remotion/renderer', '@remotion/bundler'],
  typescript: {
    // Le type-check est joué par `npm run typecheck` sur tout le paquet, y
    // compris ce qui n'entre pas dans le bundle Next. Le refaire ici doublerait
    // le temps de build sans rien couvrir de plus.
    ignoreBuildErrors: true,
  },
};

export default config;
