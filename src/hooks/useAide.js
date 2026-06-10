import { useState, useCallback } from 'react';
import { Linking } from 'react-native';

export const FAQS = [
  // ── Démarrage ──
  { q: 'Comment créer un compte MIDA ?',             section: 'Démarrage', answer: "Ouvre l'app et appuie sur \"Créer un compte\". Saisis un email valide et un mot de passe d'au moins 6 caractères, puis appuie sur \"Créer mon compte\". Un email de confirmation te sera envoyé." },
  { q: 'Comment me connecter ?',                     section: 'Démarrage', answer: "Sur l'écran d'accueil, saisis ton email et ton mot de passe puis appuie sur \"Se connecter\". Si tu as oublié ton mot de passe, appuie sur \"Mot de passe oublié\" pour le réinitialiser par email." },

  // ── Recherche & Explorer ──
  { q: 'Comment trouver un restaurant ?',            section: 'Recherche', answer: "Tu peux rechercher un restaurant de 3 façons : via l'onglet Recherche (par nom ou cuisine), via l'onglet Explorer (carte interactive ou liste), ou depuis l'accueil avec les suggestions et catégories. Filtre par ville, type de cuisine ou distance." },
  { q: 'Comment voir les restaurants près de moi ?', section: 'Recherche', answer: "Dans l'onglet Explorer, active le mode \"Près de moi\" en haut de l'écran. L'app utilise ta géolocalisation pour afficher les restaurants proches avec leur distance en km." },

  // ── Réservations ──
  { q: 'Comment faire une réservation ?',            section: 'Réservations', answer: "Ouvre la fiche d'un restaurant et appuie sur \"Réserver une table\". Choisis la date, l'heure et le nombre de personnes, ajoute une note si besoin, puis confirme. Tu recevras un email de confirmation et une notification." },
  { q: 'Comment voir mes réservations ?',            section: 'Réservations', answer: "Va dans l'onglet Profil → \"Mes réservations\". Tu y trouveras tes réservations à venir et ton historique passé." },
  { q: 'Comment modifier une réservation ?',         section: 'Réservations', answer: "Dans Profil → Mes réservations, appuie sur la réservation et sélectionne \"Modifier\". Tu peux changer la date, l'heure ou le nombre de couverts selon les disponibilités du restaurant." },
  { q: 'Comment annuler une réservation ?',          section: 'Réservations', answer: "Dans Profil → Mes réservations, appuie sur la réservation et sélectionne \"Annuler\". L'annulation doit être faite au moins 2h avant l'heure prévue." },

  // ── Avis & Favoris ──
  { q: 'Comment noter un restaurant ?',              section: 'Avis & Favoris', answer: "Va dans Profil → Mes réservations → Historique. Appuie sur une réservation passée et sélectionne \"Donner mon avis\". Tu peux attribuer une note (1 à 5 étoiles) et laisser un commentaire. L'avis est soumis à validation avant publication." },
  { q: 'Comment ajouter un restaurant en favori ?',  section: 'Avis & Favoris', answer: "Sur la fiche d'un restaurant, appuie sur le bouton cœur ♡. Le restaurant apparaîtra dans l'onglet Favoris. Pour le retirer, appuie à nouveau sur le cœur." },

  // ── Compte & Profil ──
  { q: 'Comment modifier mes informations personnelles ?', section: 'Compte', answer: "Va dans l'onglet Profil et appuie sur ta photo ou ton nom. Tu peux modifier ton nom, ton numéro de téléphone et ta photo de profil." },
  { q: 'Comment changer mon mot de passe ?',         section: 'Compte', answer: "Sur l'écran de connexion, appuie sur \"Mot de passe oublié\" et saisis ton email. Tu recevras un lien de réinitialisation par email." },
  { q: "Le restaurant n'a pas honoré ma réservation", section: 'Compte', answer: "Contacte le support via le chat ci-dessus ou par email à contact@mida-food.com. Nous traiterons ta réclamation sous 24h." },

  // ── Restaurateurs — Inscription ──
  { q: 'Comment inscrire mon restaurant sur MIDA ?', section: 'Restaurateurs', answer: "Va dans l'onglet Profil → \"Devenir restaurateur\". Remplis le formulaire avec tes informations personnelles (nom, prénom, téléphone, email) et celles de ton restaurant (nom, adresse, ville). Appuie sur \"Envoyer ma candidature\".\n\nTu recevras immédiatement un email de confirmation. L'équipe MIDA examine ta demande et te notifie par email dès la décision.\n\nSi l'app est ouverte au moment de l'approbation, tu seras redirigé automatiquement vers ton tableau de bord. Sinon, déconnecte-toi et reconnecte-toi pour accéder à l'espace restaurateur." },
  { q: 'Comment configurer mon restaurant après approbation ?', section: 'Restaurateurs', answer: "À ta première connexion en tant que restaurateur, une carte \"Configurez votre restaurant\" apparaît sur le tableau de bord avec 4 étapes à compléter :\n\n1. ✏️ Informations — cuisine, adresse complète, description\n2. 📷 Photos — ajoutez des photos attrayantes de votre restaurant\n3. 🍽️ Menu — créez vos plats avec prix et descriptions\n4. 🕐 Horaires — définissez vos heures d'ouverture\n\nAppuie sur chaque étape pour y accéder. Si tu appuies sur \"Passer\", la carte réapparaîtra au prochain lancement tant que tout n'est pas complété." },

  // ── Restaurateurs — Gestion ──
  { q: 'Comment modifier les informations de mon restaurant ?', section: 'Restaurateurs', answer: "Depuis le tableau de bord, utilise les boutons rapides en haut : ✏️ Infos, 📷 Photos, 🍽️ Menu, 🕐 Horaires. Ces sections sont toujours accessibles même après le premier setup." },
  { q: 'Comment gérer les réservations de mon restaurant ?',   section: 'Restaurateurs', answer: "Va dans l'onglet Comptoir pour voir toutes les réservations en temps réel. Pour chaque réservation tu peux :\n• Confirmer — valider la réservation du client\n• Refuser — annuler avec notification au client\n• Arrivée — marquer que le client est bien présent\n\nLe tableau de bord affiche les statistiques du jour : nombre de réservations, couverts et revenus." },
  { q: 'Comment gérer les avis clients ?',                     section: 'Restaurateurs', answer: "Va dans l'onglet Avis depuis le tableau de bord. Tu peux voir tous les avis, les filtrer (Sans réponse, En attente, par note) et répondre à chaque avis directement. Les avis \"En attente\" nécessitent une approbation de ta part avant publication." },
  { q: 'Comment créer une promotion ?',                        section: 'Restaurateurs', answer: "Depuis le tableau de bord, appuie sur le bouton 🏷️ Promos. Tu peux créer des offres spéciales (pourcentage de réduction, menu spécial) avec une date de début et de fin. Les promotions apparaissent sur la fiche de ton restaurant." },
];

export default function useAide() {
  const [expanded, setExpanded] = useState(null);
  const openSupport = useCallback(() => Linking.openURL('mailto:contact@mida-food.com'), []);
  const toggleFaq   = useCallback((i) => setExpanded(prev => prev === i ? null : i), []);
  return { expanded, openSupport, toggleFaq };
}
