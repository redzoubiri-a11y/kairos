import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';

const STEPS = [
  { key: 'received',  label: 'Reçue' },
  { key: 'preparing', label: 'En préparation' },
  { key: 'ready',     label: 'Prête' },
];

// La vraie donnée a 4 statuts actifs (pending/confirmed/ready/collected) pour
// un stepper à 3 étapes côté client — "Reçue" couvre pending+confirmed
// (la commande existe, que le resto l'ait déjà acceptée ou non).
function stepIndexFor(status) {
  if (status === 'pending' || status === 'confirmed') return 0;
  if (status === 'ready' || status === 'collected') return 2;
  return 0;
}

const STATUS_MESSAGE = {
  pending:   'Commande envoyée, en attente de confirmation du restaurant.',
  confirmed: 'Votre commande est en cuisine.',
  ready:     'Votre commande est prête — vous pouvez venir la récupérer !',
  collected: 'Commande récupérée. Bon appétit !',
};

// Mode table (Lot 3) — le client est déjà sur place, pas de "venir récupérer".
const STATUS_MESSAGE_TABLE = {
  pending:   'Commande envoyée, en attente de confirmation du restaurant.',
  confirmed: 'Votre commande est en cuisine.',
  ready:     'Votre commande arrive à votre table !',
  collected: 'Commande servie. Bon appétit !',
};

function shortOrderNumber(id) {
  return '#' + (id || '').replace(/-/g, '').slice(-4).toUpperCase();
}

export default function OrderTrackingScreen({ route, navigation }) {
  const order = route?.params?.order || {};
  const restaurant = order.restaurants || {};
  const isCancelled = order.status === 'cancelled';
  const isTable = order.mode === 'table';
  const activeStep = useMemo(() => stepIndexFor(order.status), [order.status]);
  const statusMessages = isTable ? STATUS_MESSAGE_TABLE : STATUS_MESSAGE;

  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const goDirections = useCallback(() => {
    const query = restaurant.latitude && restaurant.longitude
      ? `${restaurant.latitude},${restaurant.longitude}`
      : restaurant.address || restaurant.quartier || restaurant.name;
    if (!query) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }, [restaurant]);

  const orderedAt = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm }}>
        <Text style={s.orderNumber}>Commande {shortOrderNumber(order.id)}</Text>
        <Text style={s.orderSub}>
          {restaurant.name || 'Restaurant'}{orderedAt ? ` · Commandée à ${orderedAt}` : ''}
        </Text>
        {isTable && (
          <View style={s.tableBadge}>
            <Text style={s.tableBadgeTxt}>🍽️ Table n°{order.table_number}</Text>
          </View>
        )}

        {isCancelled ? (
          <View style={s.cancelledCard}>
            <Text style={s.cancelledTxt}>Cette commande a été annulée.</Text>
          </View>
        ) : (
          <View style={s.stepperCard}>
            <View style={s.stepperRow}>
              {STEPS.map((step, i) => {
                const done = i <= activeStep;
                const isLast = i === STEPS.length - 1;
                return (
                  <View key={step.key} style={s.stepGroup}>
                    <View style={s.stepItem}>
                      <View style={[s.stepDot, done && s.stepDotOn]}>
                        <Text style={[s.stepDotTxt, done && s.stepDotTxtOn]}>{done ? '✓' : ''}</Text>
                      </View>
                      <Text style={[s.stepLabel, done && s.stepLabelOn]}>{step.label}</Text>
                    </View>
                    {!isLast && <View style={[s.stepLine, i < activeStep && s.stepLineOn]} />}
                  </View>
                );
              })}
            </View>
            <Text style={s.statusMsg}>{statusMessages[order.status] || ''}</Text>
          </View>
        )}

        <View style={s.divider} />
        <Text style={s.sectionLbl}>Détail</Text>
        {(order.order_items || []).map(it => (
          <View key={it.id} style={s.itemRow}>
            <Text style={s.itemTxt}>{it.quantity}× {it.dish_name}</Text>
            <Text style={s.itemPrice}>{(it.quantity * it.price).toLocaleString('fr-FR')} DA</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLbl}>Total</Text>
          <Text style={s.totalVal}>{Number(order.total_amount || 0).toLocaleString('fr-FR')} DA</Text>
        </View>

        {!isTable && (
        <TouchableOpacity style={s.addressCard} onPress={goDirections} activeOpacity={0.75}>
          <View style={s.addressIcon}>
            <Text style={{ fontSize: 16 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.addressName} numberOfLines={1}>{restaurant.name || 'Restaurant'}</Text>
            <Text style={s.addressTxt} numberOfLines={1}>{restaurant.address || restaurant.quartier || ''}</Text>
          </View>
          <Text style={s.addressLink}>Itinéraire</Text>
        </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:     { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: 22 },

  orderNumber: { fontFamily: typography.display, fontSize: typography.size.title - 3, color: colors.text, letterSpacing: -0.3 },
  orderSub:    { fontFamily: typography.body, fontSize: typography.size.bodyLg - 0.5, color: 'rgba(10,10,10,0.5)', marginTop: 5 },
  tableBadge:    { alignSelf: 'center', marginTop: spacing.lg, backgroundColor: colors.statusPendingBg, borderRadius: radius.control, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg + 2 },
  tableBadgeTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.statusPendingText, textAlign: 'center' },

  stepperCard: { marginTop: spacing.xxl - 2, backgroundColor: colors.bg, borderRadius: radius.floating, padding: 20 },
  stepperRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  stepGroup:   { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stepItem:    { alignItems: 'center', gap: spacing.sm, width: 60 },
  stepDot:     { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepDotOn:   { backgroundColor: colors.primary },
  stepDotTxt:  { fontFamily: typography.bodyBold, color: colors.textMuted, fontSize: 13 },
  stepDotTxtOn:{ color: '#FFFFFF' },
  stepLabel:   { fontFamily: typography.bodySemibold, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  stepLabelOn: { color: colors.text },
  stepLine:    { flex: 1, height: 2, backgroundColor: colors.cardBorder, marginTop: 14 },
  stepLineOn:  { backgroundColor: colors.primary },

  statusMsg: { fontFamily: typography.bodySemibold, marginTop: spacing.lg, fontSize: typography.size.bodyLg, color: colors.primary, textAlign: 'center' },

  cancelledCard: { marginTop: spacing.xxl, backgroundColor: colors.statusCancelledBg, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  cancelledTxt:  { fontFamily: typography.bodySemibold, color: colors.statusCancelledText, fontSize: typography.size.bodyLg },

  divider: { height: 1, backgroundColor: colors.cardBorder, marginTop: spacing.xxl, marginBottom: spacing.lg },
  sectionLbl: { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text, marginBottom: spacing.md },

  itemRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  itemTxt:   { fontFamily: typography.body, flex: 1, fontSize: typography.size.bodyLg + 0.5, color: 'rgba(10,10,10,0.65)', marginRight: spacing.md },
  itemPrice: { fontFamily: typography.body, fontSize: typography.size.bodyLg + 0.5, color: 'rgba(10,10,10,0.65)' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg, marginTop: spacing.sm - 2, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLbl: { fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text },
  totalVal: { fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text },

  addressCard: { marginTop: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, padding: spacing.lg },
  addressIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  addressName: { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg, color: colors.text },
  addressTxt:  { fontFamily: typography.body, fontSize: typography.size.bodyLg - 1.5, color: 'rgba(10,10,10,0.5)', marginTop: 3 },
  addressLink: { fontFamily: typography.bodySemibold, fontSize: typography.size.caption, color: colors.primary },
});
