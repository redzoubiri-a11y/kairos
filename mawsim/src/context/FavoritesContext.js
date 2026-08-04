import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../data';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

/** Garde les favoris synchronisés entre l'accueil, la recherche et la fiche salle. */
export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds([]);
      return;
    }
    try {
      setIds(await api.listFavoriteIds());
    } catch {
      setIds([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ids,
      refresh,
      isFav: (salleId) => ids.includes(salleId),
      async toggle(salleId) {
        // Mise à jour optimiste : le cœur réagit immédiatement.
        setIds((prev) => (prev.includes(salleId) ? prev.filter((x) => x !== salleId) : [...prev, salleId]));
        try {
          await api.toggleFavorite(salleId);
        } catch {
          refresh();
        }
      },
    }),
    [ids, refresh]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé dans un FavoritesProvider');
  return ctx;
}
