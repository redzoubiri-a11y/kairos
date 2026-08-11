import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import { colors } from '../theme';

export const TOTAL = 4;

export const SLIDES = [
  {
    emoji: '🔍',
    tag: 'DÉCOUVERTE',
    title: 'Trouve ton resto\nen 10 secondes',
    sub: "Parcours les meilleurs restaurants d'Alger, filtre par quartier, cuisine et budget.",
    chips: ['347 restaurants', '100% avis vérifiés', 'Résa en 30s'],
    accentColor: colors.gold,
    ringBg: colors.goldSoft,
    ringBorder: 'rgba(200,151,90,0.3)',
  },
  {
    emoji: '📅',
    tag: 'RÉSERVATION',
    title: 'Réserve\nsans appeler',
    sub: "Choisis ton créneau, ton nombre de couverts, et c'est confirmé instantanément.",
    chips: ['Zéro appel', 'Confirmation rapide', 'Annulation libre'],
    accentColor: colors.green,
    ringBg: colors.greenSoft,
    ringBorder: 'rgba(76,175,130,0.25)',
  },
  {
    emoji: '⭐',
    tag: 'CONFIANCE',
    title: 'Des avis\n100% vérifiés',
    sub: "Chaque note vient d'un client ayant vraiment réservé. Pas de faux avis.",
    chips: ['Avis certifiés', 'Notes fiables', 'Expériences réelles'],
    accentColor: colors.blue,
    ringBg: colors.blueSoft,
    ringBorder: 'rgba(90,155,224,0.25)',
  },
];

export const CITIES = [
  { id: 'alger',       label: 'Alger',       emoji: '🏛️', sub: 'Capitale',       count: '20+' },
  { id: 'oran',        label: 'Oran',         emoji: '🌊', sub: 'Ville du Ponant', count: '10+' },
  { id: 'constantine', label: 'Constantine',  emoji: '🌉', sub: 'Cité des Ponts',  count: '5+'  },
];

export default function useOnboarding({ onSelect, onGuest }) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    scaleAnim.setValue(0.78);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const goTo = useCallback((next) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(24);
      scaleAnim.setValue(0.78);
      setTimeout(() => {
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();
      }, 0);
    });
  }, []);

  const goToFinal  = useCallback(() => goTo(3), [goTo]);
  const goToNext   = useCallback(() => goTo(step + 1), [goTo, step]);
  const goContinue = useCallback(() => city && goTo(4), [city, goTo]);
  const goClient   = useCallback(() => onSelect('client'), [onSelect]);
  const goPro      = useCallback(() => onSelect('pro'), [onSelect]);
  const goGuest    = useCallback(() => onGuest?.(), [onGuest]);

  return {
    step, city, setCity,
    fadeAnim, slideAnim, scaleAnim,
    goToFinal, goToNext, goContinue, goClient, goPro, goGuest,
  };
}
