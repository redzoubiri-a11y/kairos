import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useMyOrders from '../src/hooks/useMyOrders';
import { ORDER_STATUS } from '../src/hooks/useProOrders';

function OrderCard({ order, onCancel, cancelling, onPressRestaurant }) {
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const restaurant = order.restaurants || {};
  const isCancelling = cancelling.has(order.id);
  const canCancel = order.status === 'pending';

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onPressRestaurant} disabled={!restaurant.id}>
          <Text style={s.restoName} numberOfLines={1}>{restaurant.name || 'Restaurant'}</Text>
          <Text style={s.orderDate}>
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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

      {canCancel && (
        <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel(order.id)} disabled={isCancelling}>
          <Text style={s.cancelTxt}>{isCancelling ? '···' : 'Annuler la commande'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MyOrdersScreen({ navigation }) {
  const { loading, refreshing, active, history, cancelling, onRefresh, cancel } = useMyOrders();

  const goRestaurant = useCallback((restaurant) => {
    if (restaurant?.id) navigation.navigate('Restaurant', { restaurant });
  }, [navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>MES COMMANDES</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
        ) : active.length === 0 && history.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 44 }}>🛍️</Text>
            <Text style={s.emptyTitle}>Aucune commande</Text>
            <Text style={s.emptySub}>Vos commandes à emporter{'\n'}apparaîtront ici</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={s.sectionLbl}>EN COURS · {active.length}</Text>
                {active.map(o => (
                  <OrderCard key={o.id} order={o} onCancel={cancel} cancelling={cancelling} onPressRestaurant={() => goRestaurant(o.restaurants)} />
                ))}
              </>
            )}
            {history.length > 0 && (
              <>
                <Text style={s.sectionLbl}>HISTORIQUE · {history.length}</Text>
                {history.map(o => (
                  <OrderCard key={o.id} order={o} onCancel={cancel} cancelling={cancelling} onPressRestaurant={() => goRestaurant(o.restaurants)} />
                ))}
              </>
            )}
          </>
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

  sectionLbl: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  card:      { margin: spacing.xl, marginBottom: 0, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  restoName: { color: colors.text, fontSize: typography.size.subheading, fontWeight: '600' },
  orderDate: { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },
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

  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.red },
  cancelTxt: { color: colors.red, fontSize: typography.size.body, fontWeight: '600' },
});
