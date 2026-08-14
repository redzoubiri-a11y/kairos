import {
  Modal, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const SECTIONS = [
  {
    title: '1. Objet',
    body: "Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de l'application mobile MIDA, éditée par MIDA SAS, permettant la découverte et la réservation de tables dans des restaurants en Algérie.",
  },
  {
    title: '2. Accès au service',
    body: "L'application est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. La création d'un compte est nécessaire pour effectuer une réservation. MIDA se réserve le droit de suspendre tout compte en cas de violation des présentes CGU.",
  },
  {
    title: '3. Réservations',
    body: "Les réservations effectuées via MIDA sont soumises à confirmation par l'établissement. Toute annulation doit être effectuée au plus tard 2 heures avant l'heure prévue. En cas de non-présentation sans annulation, l'utilisateur pourra être pénalisé selon la politique de l'établissement.",
  },
  {
    title: '4. Responsabilité',
    body: "MIDA agit en qualité d'intermédiaire entre les utilisateurs et les restaurateurs. La qualité des prestations fournies par les établissements relève de la responsabilité exclusive de ces derniers. MIDA ne saurait être tenu responsable en cas d'annulation ou de modification de réservation par l'établissement.",
  },
  {
    title: '5. Données personnelles',
    body: "Les données collectées (nom, email, historique de réservations) sont utilisées uniquement pour le fonctionnement du service. Elles ne sont pas revendues à des tiers. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant contact@mida-food.com.",
  },
  {
    title: '6. Propriété intellectuelle',
    body: "L'ensemble des contenus présents sur MIDA (logo, textes, interfaces) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.",
  },
  {
    title: '7. Modification des CGU',
    body: "MIDA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.",
  },
  {
    title: '8. Contact',
    body: "Pour toute question relative aux présentes CGU, vous pouvez contacter MIDA à l'adresse suivante : contact@mida-food.com",
  },
];

export default function CGUModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>Conditions d'utilisation</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.closeTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.updated}>Dernière mise à jour : juin 2025</Text>
          {SECTIONS.map((sec, i) => (
            <View key={i} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.acceptBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.acceptTxt}>J'ai lu et j'accepte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  title:    { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium },
  closeBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  closeTxt: { color: colors.blue, fontSize: typography.size.bodyLg },

  scroll:  { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  updated: { color: colors.textDim, fontSize: typography.size.caption, marginBottom: spacing.xxl },

  section:      { marginBottom: spacing.xxl },
  sectionTitle: { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold, marginBottom: spacing.md },
  sectionBody:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 22 },

  footer: {
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  acceptBtn: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: spacing.xl - 2, alignItems: 'center',
  },
  acceptTxt: { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },
});
