import { createContext, useContext, useMemo } from 'react';
import fr from './fr';

/**
 * Textes de l'application — français uniquement.
 *
 * L'arabe et le sens de lecture inversé ont été retirés : l'application
 * s'adresse à un public francophone, et une seconde langue à maintenir sans
 * personne pour la lire ne rendait service à personne.
 *
 * Le passage par `t()` est conservé malgré la langue unique : il garde tous
 * les textes visibles dans un seul fichier, ce qu'un test vérifie — chaque clé
 * appelée doit exister, et aucun libellé ne doit être écrit en dur dans le
 * JSX. C'est aussi ce qui rendrait une seconde langue possible plus tard sans
 * rouvrir chaque écran.
 */

const I18nContext = createContext(null);

/** Résout « a.b.c » dans le dictionnaire. */
function resolve(path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), fr);
}

/** Remplace les jetons {{x}} par les valeurs fournies. */
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

export function I18nProvider({ children }) {
  const value = useMemo(
    () => ({
      t: (path, vars) => {
        const found = resolve(path);
        // Clé absente : on renvoie le chemin plutôt qu'un vide, ce qui rend la
        // panne visible à l'écran. Un test l'empêche d'arriver jusque-là.
        if (typeof found !== 'string') return path;
        return interpolate(found, vars);
      },
      /** Tableaux (mois, jours, réponses rapides) exposés directement. */
      list: (path) => resolve(path) ?? [],
    }),
    []
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans un I18nProvider');
  return ctx;
}
