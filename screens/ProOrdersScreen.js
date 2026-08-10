import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProOrders, { ORDER_STATUS } from '../src/hooks/useProOrders';

const FILTERS = ['Tout', 'En attente', 'Confirmées', 'Prêtes'];
const FILTER_MAP = { 'En attente': 'pending', 'Confirmées': 'confirmed', 'Prêtes': 'ready' };

export default function ProOrdersScreen({ navigation }) {
  const { orders, loading, refreshing, acting, onRefresh, advance, cancel, NEXT_LABEL } = useProOrders();
  const [filter, setFilter] = useState('Tout');

  const filtered = useMemo(() => {
    if (filter === 'Tout') return orders.filter(o => o.status !== 'collected' && o.status !== 'cancelled');
    return orders.filter(o => o.status === FILTER_MAP[filter]);
  }, [orders, filter]);

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>COMMANDES</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersWrap} contentContainerStyle={s.filtersList}>
        {FILTERS.map(f => {
          const active = f === filter;
          return (
            <TouchableOpacity key={f} style={[s.filterChip, active && s.filterChipOn]} onPress={() => setFilter(f)}>
              <Text style={[s.filterChipTxt, active && s.filterChipTxtOn]}>{f}</Text>
              {f === 'En attente' && pendingCount > 0 && (
                <View style={s.filterBadge}><Text style={s.filterBadgeTxt}>{pendingCount}</Text></View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 44 }}>🛍️</Text>
            <Text style={s.emptyTitle}>Aucune commande</Text>
          </View>
        ) : (
          filtered.map(order => {
            const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            const isActing = acting.has(order.id);
            const clientName = [order.users?.first_name, order.users?.last_name].filter(Boolean).join(' ') || 'Client';
            const canAdvance = ['pending', 'confirmed', 'ready'].includes(order.status);
            const canCancel  = ['pending', 'confirmed'].includes(order.status);
            return (
              <View key={order.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.clientName}>{clientName}</Text>
                    {!!order.users?.phone && <Text style={s.clientPhone}>{order.users.phone}</Text>}
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

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
                  <Text style={s.totalLbl}>Total</Text>
                  <Text style={s.totalVal}>{Number(order.total_amount).toLocaleString('fr-FR')} DA</Text>
                </View>

                {(canAdvance || canCancel) && (
                  <View style={s.actions}>
                    {canCancel && (
                      <TouchableOpacity style={s.cancelBtn} onPress={() => cancel(order)} disabled={isActing}>
                        <Text style={s.cancelTxt}>Annuler</Text>
                      </TouchableOpacity>
                    )}
                    {canAdvance && (
                      <TouchableOpacity style={s.advanceBtn} onPress={() => advance(order)} disabled={isActing}>
                        <Text style={s.advanceTxt}>{isActing ? '···' : NEXT_LABEL[order.status]}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerTitle: { flex: 1, color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: 2, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  filtersWrap: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  filtersList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm, flexDirection: 'row' },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.text },
  filterChipOn:    { borderColor: colors.blue },
  filterChipTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  filterChipTxtOn: { color: colors.blue, fontWeight: typography.weight.semibold },
  filterBadge:     { backgroundColor: colors.accent, borderRadius: radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeTxt:  { color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: '700' },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: '300' },

  card:      { margin: spacing.xl, marginBottom: 0, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  clientName:{ color: colors.text, fontSize: typography.size.subheading, fontWeight: '600' },
  clientPhone:{ color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1 },
  statusTxt:   { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 0.5 },

  itemsBlock: { gap: spacing.xs },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemQty:    { color: colors.blue, fontWeight: '700', width: 26 },
  itemName:   { flex: 1, color: colors.text, fontSize: typography.size.body },
  itemPrice:  { color: colors.textMuted, fontSize: typography.size.caption },

  noteWrap: { backgroundColor: colors.cardHover, padding: spacing.md, borderRadius: radius.md },
  noteTxt:  { color: colors.textMuted, fontSize: typography.size.caption },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLbl: { color: colors.textMuted, fontSize: typography.size.body },
  totalVal: { color: colors.text, fontSize: typography.size.subheading, fontWeight: '700' },

  actions:    { flexDirection: 'row', gap: spacing.md },
  cancelBtn:  { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.red },
  cancelTxt:  { color: colors.red, fontSize: typography.size.body, fontWeight: '600' },
  advanceBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.green },
  advanceTxt: { color: colors.green, fontSize: typography.size.body, fontWeight: '600' },
});
