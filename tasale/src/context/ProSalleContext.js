import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../data';
import { useAuth } from './AuthContext';
import { ROLES, STORAGE_PREFIX } from '../lib/constants';

const STORAGE_KEY = `${STORAGE_PREFIX}salleCourante`;

const ProSalleContext = createContext(null);

/**
 * Salle sur laquelle porte l'espace pro (§12 Phase 4).
 *
 * Un propriétaire peut en gérer plusieurs ; tous les écrans pro — tableau de
 * bord, planning, réservations, statistiques — travaillent sur celle-ci. Le
 * choix est mémorisé d'une session à l'autre.
 */
export function ProSalleProvider({ children }) {
  const { user } = useAuth();
  const [salles, setSalles] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (user?.role !== ROLES.PRO) {
      setSalles([]);
      setLoading(false);
      return;
    }

    try {
      const miennes = await api.proListSalles();
      setSalles(miennes);

      const memorisee = await AsyncStorage.getItem(STORAGE_KEY);
      // La salle mémorisée peut avoir été retirée depuis : on retombe alors
      // sur la première plutôt que de laisser les écrans sans salle.
      const valide = miennes.some((s) => s.id === memorisee);
      setCurrentId(valide ? memorisee : miennes[0]?.id ?? null);
    } catch {
      setSalles([]);
      setCurrentId(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const select = useCallback((salleId) => {
    setCurrentId(salleId);
    AsyncStorage.setItem(STORAGE_KEY, salleId).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      salles,
      loading,
      refresh,
      select,
      currentId,
      current: salles.find((s) => s.id === currentId) ?? null,
      isMulti: salles.length > 1,
    }),
    [salles, loading, refresh, select, currentId]
  );

  return <ProSalleContext.Provider value={value}>{children}</ProSalleContext.Provider>;
}

export function useProSalle() {
  const ctx = useContext(ProSalleContext);
  if (!ctx) throw new Error('useProSalle doit être utilisé dans un ProSalleProvider');
  return ctx;
}
