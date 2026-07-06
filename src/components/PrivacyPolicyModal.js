import {
  Modal, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    body: "MIDA, application de réservation de restaurants, exploitée depuis Alger, Algérie.\nContact : contact@mida-food.com — www.mida-food.com",
  },
  {
    title: '2. Données collectées',
    body: "Données d'inscription : nom, prénom, adresse email, numéro de téléphone (optionnel), mot de passe (chiffré).\n\nDonnées de réservation : date, heure, nombre de couverts, restaurant, notes, statut.\n\nDonnées de navigation : restaurants consultés, favoris, avis déposés.\n\nLocalisation GPS : uniquement lorsque vous activez « Près de moi », non conservée après la session.\n\nPhoto de profil : optionnelle, stockée de façon sécurisée.",
  },
  {
    title: '3. Finalités du traitement',
    body: "Vos données sont utilisées exclusivement pour :\n— créer et gérer votre compte\n— traiter et confirmer vos réservations\n— vous envoyer des notifications liées à vos réservations\n— permettre aux restaurants de vous identifier à votre arrivée\n— afficher les restaurants proches (si vous l'autorisez)\n— améliorer nos recommandations\n— garantir la sécurité de la plateforme",
  },
  {
    title: '4. Base légale du traitement',
    body: "Le traitement repose sur :\n— l'exécution du contrat (gestion de votre compte et réservations)\n— votre consentement explicite (localisation, notifications push, photo)\n— l'intérêt légitime de MIDA (sécurité, amélioration du service)",
  },
  {
    title: '5. Partage des données',
    body: "Vos données ne sont jamais vendues ni louées à des tiers.\n\nElles sont partagées uniquement avec le restaurant concerné (nom, téléphone, date, couverts, notes) et nos prestataires techniques : Supabase (hébergement, Irlande — conforme RGPD), Expo (notifications push), Apple / Google (distribution).",
  },
  {
    title: '6. Durée de conservation',
    body: "— Données de compte : conservées tant que votre compte est actif\n— Données de réservation : conservées 3 ans après la dernière réservation\n— Localisation : non conservée après la session\n— Photo de profil : jusqu'à suppression par l'utilisateur\n\nEn cas de suppression de compte, toutes vos données sont effacées sous 30 jours.",
  },
  {
    title: '7. Vos droits',
    body: "Conformément à la loi algérienne n° 18-07 du 10 juin 2018, vous disposez des droits d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données.\n\nPour exercer ces droits : contact@mida-food.com\nNous répondons sous 30 jours.",
  },
  {
    title: '8. Notifications push',
    body: "Les notifications push sont envoyées uniquement avec votre accord explicite. Vous pouvez les désactiver à tout moment dans les réglages de votre téléphone.",
  },
  {
    title: '9. Sécurité',
    body: "Vos données sont hébergées sur Supabase, avec chiffrement en transit (TLS) et au repos. Les mots de passe sont hachés et salés — jamais stockés en clair.",
  },
  {
    title: '10. Modifications',
    body: "MIDA peut modifier cette politique à tout moment. Toute modification substantielle vous sera notifiée via l'application.",
  },
  {
    title: '11. Contact',
    body: "Pour toute question relative à vos données :\ncontact@mida-food.com\nMIDA — Alger, Algérie\nwww.mida-food.com",
  },
];

export default function PrivacyPolicyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>Politique de confidentialité</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.closeTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.updated}>Dernière mise à jour : juillet 2026 · Version 1.0</Text>
          <Text style={s.law}>Conforme à la loi algérienne n° 18-07 du 10 juin 2018 relative à la protection des données personnelles.</Text>
          {SECTIONS.map((sec, i) => (
            <View key={i} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.closeFullBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.closeFullTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  title:    { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium, flex: 1 },
  closeBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  closeTxt: { color: colors.blue, fontSize: typography.size.bodyLg },

  scroll:  { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  updated: { color: colors.textDim, fontSize: typography.size.caption, marginBottom: spacing.md },
  law: {
    color: colors.textMuted, fontSize: typography.size.caption,
    borderLeftWidth: 2, borderLeftColor: colors.resa,
    paddingLeft: spacing.md, marginBottom: spacing.xxl,
    lineHeight: 18,
  },

  section:      { marginBottom: spacing.xxl },
  sectionTitle: { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold, marginBottom: spacing.md },
  sectionBody:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 22 },

  footer: {
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  closeFullBtn: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: spacing.xl - 2, alignItems: 'center',
  },
  closeFullTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },
});
