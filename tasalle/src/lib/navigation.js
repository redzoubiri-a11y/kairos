import { useCallback } from 'react';

/**
 * Retour arrière sûr.
 *
 * `navigation.goBack` ne fait rien quand l'écran est le premier de sa pile —
 * ce qui arrive dès qu'on y arrive directement (lien profond, notification,
 * rechargement web) : la flèche reste alors affichée mais inerte. Dans ce cas
 * on réinitialise la pile sur son premier écran, qui est l'espace d'accueil du
 * rôle courant (`ClientTabs`, `ProTabs`, `AdminTabs` ou `ProPartner` selon la
 * branche déclarée dans `App.js`).
 */
export function useGoBack(navigation) {
  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const root = navigation.getState()?.routeNames?.[0];
    if (root) navigation.reset({ index: 0, routes: [{ name: root }] });
  }, [navigation]);
}
