import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { ORDER_STATUS } from '../hooks/useProOrders';

function shortOrderNumber(id) {
  return '#' + (id || '').replace(/-/g, '').slice(-4).toUpperCase();
}

function formatPickupTime(pickupTime) {
  if (!pickupTime) return null;
  return new Date(pickupTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderCard({
  order, context = 'client', title, subtitle, onPressTitle,
  onAdvance, advanceLabel, onCancel, acting,
}) {
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const isPro = context === 'pro';
  const isTable = order.mode === 'table';
  const canAdvance = isPro && !!advanceLabel && ['pending', 'confirmed', 'ready'].includes(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const isReadyStep = order.status === 'ready';
  const pickupTime = formatPickupTime(order.pickup_time);

  return (
    <View style={s.card}>
      <View style={s.top}>
        <TouchableOpacity
          style={s.titleWrap}
          onPress={onPressTitle}
          disabled={!onPressTitle}
          activeOpacity={onPressTitle ? 0.7 : 1}
        >
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Text style={s.subtitle}>{subtitle || `Commande ${shortOrderNumber(order.id)}`}</Text>
        </TouchableOpacity>
        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* Numéro de table — bien visible, distinct des commandes à emporter (Lot 3) */}
      {isTable && (
        <View style={s.tableBadge}>
          <Text style={s.tableBadgeTxt}>🍽️ Table n°{order.table_number}</Text>
        </View>
      )}

      <View style={s.itemsBlock}>
        {(order.order_items || []).map(it => (
          <View key={it.id} style={s.itemRow}>
            <Text style={s.itemQty}>{it.quantity}×</Text>
            <Text style={s.itemName} numberOfLines={1}>{it.dish_name}</Text>
            <Text style={s.itemPrice}>{(it.quantity * it.price).toLocaleString('fr-FR')} DA</Text>
          </View>
        ))}
      </View>

      {!!order.notes && (
        <View style={s.noteWrap}>
          <Text style={s.noteTxt}>💬 {order.notes}</Text>
        </View>
      )}

      <View style={s.totalRow}>
        <Text style={s.totalLbl}>{pickupTime ? `Retrait ${pickupTime}` : 'Total'}</Text>
        <Text style={s.totalVal}>{Number(order.total_amount).toLocaleString('fr-FR')} DA</Text>
      </View>

      {(canAdvance || canCancel) && (
        <View style={s.actions}>
          {canCancel && (
            <TouchableOpacity
              style={[s.cancelBtn, !canAdvance && s.cancelBtnFull]}
              onPress={() => onCancel?.(order)}
              disabled={acting}
            >
              <Text style={s.cancelTxt}>{isPro ? 'Annuler' : 'Annuler la commande'}</Text>
            </TouchableOpacity>
          )}
          {canAdvance && (
            <TouchableOpacity
              style={[s.advanceBtn, isReadyStep && s.advanceBtnOutline]}
              onPress={() => onAdvance?.(order)}
              disabled={acting}
            >
              <Text style={[s.advanceTxt, isReadyStep && s.advanceTxtOutline]}>
                {acting ? '···' : advanceLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl - 2, padding: spacing.xl - 2 },
  top:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  titleWrap:  { flex: 1 },
  title:      { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text, letterSpacing: -0.2 },
  subtitle:   { fontFamily: typography.body, fontSize: typography.size.bodyLg - 1.5, color: 'rgba(10,10,10,0.45)', marginTop: 3 },
  statusBadge: { flexShrink: 0, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm + 2 },
  statusTxt:   { fontFamily: typography.bodyBold, fontSize: typography.size.xs + 0.5, letterSpacing: 0.2 },

  // colors.gold est réservé à l'univers Pro (cf. theme.js) — cette puce est visible
  // côté client aussi (MyOrdersScreen), donc palette neutre partagée à la place.
  tableBadge:    { alignSelf: 'flex-start', marginTop: spacing.sm + 1, backgroundColor: colors.tagGreenBg, borderRadius: radius.sm + 2, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  tableBadgeTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.caption, color: colors.primary },

  itemsBlock: { marginTop: spacing.lg - 2, gap: spacing.xs + 1 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemQty:    { fontFamily: typography.bodyMedium, fontSize: typography.size.body, color: colors.textMuted },
  itemName:   { flex: 1, fontFamily: typography.body, fontSize: typography.size.body, color: colors.text },
  itemPrice:  { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted },

  noteWrap:   { marginTop: spacing.sm, backgroundColor: colors.tagNeutralBg, borderRadius: radius.sm, padding: spacing.sm },
  noteTxt:    { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted },

  totalRow:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.lg - 2, paddingTop: spacing.lg - 2, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLbl:   { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted },
  totalVal:   { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text },

  actions:    { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn:  { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md + 1, paddingHorizontal: spacing.lg, borderRadius: radius.md + 1, borderWidth: 1.5, borderColor: colors.redSoft },
  cancelBtnFull: { flex: 1 },
  cancelTxt:  { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg - 0.5, color: colors.red },
  advanceBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg - 2, borderRadius: radius.md + 1, backgroundColor: colors.primary },
  advanceBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.16)' },
  advanceTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.bodyLg - 0.5, color: '#FFFFFF' },
  advanceTxtOutline: { fontFamily: typography.bodySemibold, color: colors.text },
});
