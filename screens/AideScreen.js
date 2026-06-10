import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useAide, { FAQS } from '../src/hooks/useAide';
import BottomTabBar from '../src/components/BottomTabBar';

const CONDITIONS = `CONDITIONS GÉNÉRALES D'UTILISATION — MIDA
Dernière mise à jour : juin 2026

1. OBJET ET CHAMP D'APPLICATION
MIDA est une plateforme numérique de réservation de tables dans les restaurants partenaires en Algérie, éditée et exploitée depuis Alger. En téléchargeant ou en utilisant l'application MIDA, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.

2. CRÉATION DE COMPTE
L'accès aux fonctionnalités de réservation nécessite la création d'un compte personnel. Vous vous engagez à fournir des informations exactes, complètes et à jour. Vous êtes seul responsable de la confidentialité de vos identifiants (email et mot de passe) et de toute activité réalisée depuis votre compte. En cas de suspicion d'utilisation frauduleuse, vous devez nous contacter immédiatement à contact@mida-food.com.

3. DESCRIPTION DU SERVICE
MIDA met en relation des clients et des restaurants partenaires. L'application permet de :
• Rechercher des restaurants par ville, quartier ou type de cuisine
• Consulter les menus, photos, avis et disponibilités
• Effectuer et gérer des réservations en ligne
• Laisser des avis vérifiés après une visite
• Pour les restaurateurs : gérer les réservations, le menu et les informations de l'établissement

4. RÉSERVATIONS
4.1 Toute réservation est soumise à la confirmation du restaurant. Une réservation non confirmée ne constitue pas un engagement de la part de l'établissement.
4.2 En cas d'annulation par le client, celui-ci s'engage à en informer le restaurant au moins 2 heures avant l'heure prévue, directement via l'application.
4.3 MIDA ne peut être tenu responsable de l'indisponibilité d'une table, de la fermeture imprévue d'un restaurant ou de tout autre manquement de la part de l'établissement.
4.4 La réservation est nominative et non cessible.

5. AVIS ET NOTATIONS
Les avis ne peuvent être déposés que par des utilisateurs ayant effectué et honoré une réservation via MIDA. MIDA se réserve le droit de modérer, modifier ou supprimer tout avis contenant des propos diffamatoires, injurieux, racistes ou portant atteinte à l'ordre public. Les avis publiés sont la seule responsabilité de leurs auteurs.

6. ESPACE RESTAURATEUR
L'accès à l'espace restaurateur est conditionné à la validation de la demande d'inscription par l'équipe MIDA. Le restaurateur s'engage à :
• Fournir des informations exactes sur son établissement
• Maintenir ses horaires et disponibilités à jour
• Répondre aux demandes de réservation dans les meilleurs délais
• Respecter les réservations confirmées sauf cas de force majeure
Le non-respect de ces engagements peut entraîner la suspension ou la suppression du compte restaurateur.

7. PROPRIÉTÉ INTELLECTUELLE
L'ensemble des contenus de l'application MIDA (logo, design, textes, code source) est la propriété exclusive de MIDA et est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, sans autorisation écrite préalable est interdite.

8. LIMITATION DE RESPONSABILITÉ
MIDA agit en qualité d'intermédiaire technique entre les clients et les restaurants partenaires. En conséquence, MIDA ne peut être tenu responsable de la qualité des prestations des restaurants, de tout dommage direct ou indirect lié à l'utilisation de l'application, ni des interruptions de service dues à des raisons techniques indépendantes de sa volonté.

9. MODIFICATIONS DES CGU
MIDA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle via l'application. La poursuite de l'utilisation de l'application après modification vaut acceptation des nouvelles conditions.

10. DROIT APPLICABLE
Les présentes CGU sont soumises au droit algérien. Tout litige relatif à leur interprétation ou leur exécution sera soumis aux tribunaux compétents d'Alger.

11. CONTACT
MIDA — contact@mida-food.com
www.mida-food.com`;

const CONFIDENTIALITE = `POLITIQUE DE CONFIDENTIALITÉ — MIDA
Dernière mise à jour : juin 2026

1. RESPONSABLE DU TRAITEMENT
MIDA, application de réservation de restaurants, exploitée depuis Alger, Algérie.
Contact : contact@mida-food.com — www.mida-food.com
La présente politique est conforme à la loi algérienne n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.

2. DONNÉES COLLECTÉES
Lors de l'utilisation de l'application, nous collectons les données suivantes :

Données d'inscription :
• Nom et prénom
• Adresse email
• Numéro de téléphone (optionnel)
• Mot de passe (chiffré, jamais accessible en clair)

Données de réservation :
• Date, heure, nombre de couverts
• Restaurant concerné
• Notes et demandes particulières
• Statut de la réservation

Données de navigation :
• Restaurants consultés et mis en favoris
• Avis et notes déposés

Données de localisation :
• Position GPS, uniquement lorsque vous activez la fonction "Près de moi"
• Collectée en temps réel, non conservée après la session

Photo de profil :
• Optionnelle, stockée de façon sécurisée si vous la téléchargez

3. FINALITÉS DU TRAITEMENT
Vos données sont utilisées exclusivement pour :
• Créer et gérer votre compte utilisateur
• Traiter et confirmer vos réservations
• Vous envoyer des notifications de confirmation, rappels et alertes liées à vos réservations
• Permettre aux restaurants de vous identifier à votre arrivée
• Afficher les restaurants proches de votre position (si vous l'autorisez)
• Améliorer la qualité et la pertinence de nos recommandations
• Garantir la sécurité de la plateforme et prévenir les abus

4. BASE LÉGALE DU TRAITEMENT
Le traitement de vos données repose sur :
• L'exécution du contrat (gestion de votre compte et de vos réservations)
• Votre consentement explicite (localisation, notifications push, photo de profil)
• L'intérêt légitime de MIDA (sécurité, amélioration du service)

5. PARTAGE DES DONNÉES
Vos données ne sont jamais vendues ni louées à des tiers.
Elles sont partagées uniquement dans les cas suivants :
• Avec le restaurant concerné : nom, prénom, téléphone, date et heure de réservation, nombre de couverts et notes — uniquement pour les besoins de votre réservation
• Avec nos prestataires techniques : Supabase (hébergement des données, Irlande — conforme RGPD), Expo (notifications push), Apple / Google (distribution de l'application)
Ces prestataires sont contractuellement tenus de protéger vos données et de ne les utiliser qu'aux fins prévues.

6. DURÉE DE CONSERVATION
• Données de compte : conservées tant que votre compte est actif
• Données de réservation : conservées 3 ans après la dernière réservation
• Données de localisation : non conservées après la session
• Photo de profil : conservée jusqu'à suppression ou modification par l'utilisateur
En cas de suppression de compte, toutes vos données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale contraire.

7. VOS DROITS
Conformément à la loi 18-07, vous disposez des droits suivants :
• Droit d'accès : obtenir une copie de vos données
• Droit de rectification : corriger des données inexactes
• Droit à l'effacement : demander la suppression de votre compte et de vos données
• Droit d'opposition : vous opposer à certains traitements
• Droit à la portabilité : recevoir vos données dans un format lisible
Pour exercer ces droits, contactez-nous à : contact@mida-food.com
Nous répondons à toute demande dans un délai de 30 jours.

8. NOTIFICATIONS PUSH
Les notifications push sont envoyées uniquement si vous avez donné votre accord explicite lors de l'installation. Vous pouvez les désactiver à tout moment dans les réglages de votre téléphone.

9. SÉCURITÉ
Vos données sont hébergées sur l'infrastructure Supabase, conforme aux standards internationaux de sécurité (chiffrement en transit via TLS, chiffrement au repos). Les mots de passe sont hachés et salés — ils ne sont jamais stockés ni accessibles en clair. L'accès aux données est strictement limité aux personnes habilitées.

10. MODIFICATIONS
MIDA se réserve le droit de modifier la présente politique à tout moment. Toute modification substantielle vous sera notifiée via l'application. La date de dernière mise à jour est indiquée en haut du document.

11. CONTACT
Pour toute question relative à vos données personnelles :
contact@mida-food.com
MIDA — Alger, Algérie
www.mida-food.com`;

export default function AideScreen({ navigation }) {
  const { expanded, openSupport, toggleFaq } = useAide();
  const [legalPage, setLegalPage] = useState(null);

  if (legalPage) {
    return (
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => setLegalPage(null)} activeOpacity={0.7}>
            <Text style={[s.backBtnTxt, { color: '#C87860' }]}>←</Text>
          </TouchableOpacity>
          <Text style={s.legalPageTitle} numberOfLines={1}>{legalPage.label}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={s.legalBody}>{legalPage.content}</Text>
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Aide & Support</Text>
          <Text style={s.subtitle}>On est là pour t'aider</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: spacing.xl, gap: spacing.xl }}>

          <TouchableOpacity style={s.contactCard} onPress={openSupport} activeOpacity={0.8}>
            <Text style={s.contactIcon}>📧</Text>
            <Text style={s.contactTitle}>Contacter le support</Text>
            <Text style={s.contactSub}>contact@mida-food.com</Text>
            <Text style={[s.contactSub, { marginTop: 2 }]}>Réponse sous 24h</Text>
          </TouchableOpacity>

<View>
            <Text style={s.sectionLabel}>❓ Questions fréquentes</Text>
            <View style={s.faqCard}>
              {FAQS.map((faq, i) => {
                const isOpen = expanded === i;
                const isLast = i === FAQS.length - 1;
                return (
                  <View key={i} style={[s.faqItem, !isLast && s.faqBorder]}>
                    <TouchableOpacity style={s.faqQ} onPress={() => toggleFaq(i)} activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.faqQTxt}>{faq.q}</Text>
                        <Text style={s.faqSection}>{faq.section}</Text>
                      </View>
                      <Text style={[s.faqChevron, isOpen && s.faqChevronOpen]}>›</Text>
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={s.faqA}>
                        <Text style={s.faqATxt}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={s.sectionLabel}>📄 Légal</Text>
            <View style={s.legalCard}>
              {[
                { label: "Conditions d'utilisation",     content: CONDITIONS },
                { label: "Politique de confidentialité", content: CONFIDENTIALITE },
              ].map(({ label, content }, i) => (
                <TouchableOpacity key={i} style={[s.legalRow, i === 0 && s.legalBorder]} activeOpacity={0.7} onPress={() => setLegalPage({ label, content })}>
                  <Text style={s.legalTxt}>{label}</Text>
                  <Text style={s.legalArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={s.version}>Mida v1.0.0 · Alger, Algérie</Text>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
      <BottomTabBar navigation={navigation} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:    { width: 36, height: 36, borderRadius: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: '#1A1A1A', fontSize: typography.size.subheading },
  title:      { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },

  contactCard:    { backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: radius.xxl, borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)', padding: spacing.xl, alignItems: 'center', gap: spacing.xs, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  contactIcon:    { fontSize: 28 },
  contactTitle:   { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.bold, textAlign: 'center' },
  contactSub:     { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center' },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.greenSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)', marginTop: spacing.xs },
  onlineDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  onlineTxt:      { color: colors.green, fontSize: typography.size.xs },

sectionLabel: { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold, marginBottom: spacing.md },

  faqCard:        { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  faqItem:        {},
  faqBorder:      { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  faqQ:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  faqQTxt:        { color: colors.text, fontSize: typography.size.body },
  faqSection:     { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  faqChevron:     { color: colors.textDim, fontSize: typography.size.subheading },
  faqChevronOpen: { transform: [{ rotate: '90deg' }] },
  faqA:           { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: 0 },
  faqATxt:        { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 20 },

  legalCard:   { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  legalRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  legalBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  legalTxt:    { color: colors.text, fontSize: typography.size.body },
  legalArrow:  { color: colors.textDim, fontSize: typography.size.subheading },

  version:       { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center', letterSpacing: 1 },
  legalBody:     { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 22 },
  legalPageTitle:{ color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.semibold, flex: 1 },
});
