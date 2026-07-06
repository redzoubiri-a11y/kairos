import { useState, useCallback } from 'react';

export const GROUPS = [
  {
    section: '🔔 Notifications',
    items: [
      { label: 'Confirmations de réservation', sub: 'Push & SMS',      toggle: true,  defaultOn: true  },
      { label: 'Rappel 2h avant',              sub: 'Push',            toggle: true,  defaultOn: true  },
      { label: 'Nouvelles promos',             sub: 'Restaurants fav', toggle: true,  defaultOn: true  },
      { label: 'Rappel laisser un avis',       sub: 'Email',           toggle: true,  defaultOn: false },
    ],
  },
  {
    section: '🌐 Langue & région',
    items: [
      { label: 'Langue',  sub: 'Français',              arrow: true },
      { label: 'Devise',  sub: 'DZD · Dinar algérien',  arrow: true },
    ],
  },
  {
    section: '🔒 Compte & sécurité',
    items: [
      { label: 'Changer le mot de passe',        sub: null,          arrow: true },
      { label: 'Authentification 2 facteurs',     sub: 'Désactivée',  arrow: true },
      { label: 'Sessions actives',                sub: '1 appareil',  arrow: true },
    ],
  },
  {
    section: '📄 Légal',
    items: [
      { label: "Conditions d'utilisation",    arrow: true, cgu: true },
      { label: 'Politique de confidentialité', arrow: true, privacy: true },
    ],
  },
  {
    section: 'ℹ️ À propos',
    items: [
      { label: "Version de l'app", sub: 'Mida v1.0.0' },
      { label: 'Mentions légales', arrow: true, url: 'https://www.mida-food.com/mentions-legales' },
    ],
  },
];

export default function useSettings() {
  const [toggles, setToggles] = useState(() => {
    const map = {};
    GROUPS.forEach(g => g.items.forEach((item, i) => {
      if (item.toggle) map[g.section + i] = item.defaultOn;
    }));
    return map;
  });

  const toggle = useCallback((key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { toggles, toggle };
}
