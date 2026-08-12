import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProOrders from '../src/hooks/useProOrders';
import OrderCard from '../src/components/OrderCard';

const FILTERS = ['Tout', 'En attente', 'Confirmées', 'Prêtes'];
const FILTER_MAP = { 'En attente': 'pending', 'Confirmées': 'confirmed', 'Prêtes': 'ready' };

export default function ProOrdersScreen({ navigation }) {
  const { orders, loading, refreshing, acting, onRefresh, advance, cancel, NEXT_LABEL } = useProOrders();
  const [filter, setFilter] = useState('Tout');
  const insets = useSafeAreaInsets();

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
        <Text style={s.headerTitle}>Commandes</Text>
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
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
            const clientName = [order.users?.first_name, order.users?.last_name].filter(Boolean).join(' ') || 'Client';
            return (
              <View key={order.id} style={s.cardWrap}>
                <OrderCard
                  order={order}
                  context="pro"
                  title={clientName}
                  subtitle={order.users?.phone || undefined}
                  onAdvance={advance}
                  advanceLabel={NEXT_LABEL[order.status]}
                  onCancel={cancel}
                  acting={acting.has(order.id)}
                />
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
  headerTitle: { flex: 1, color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: -0.2, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  filtersWrap: { maxHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  filtersList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.tagNeutralBg },
  filterChipOn:    { backgroundColor: colors.noir },
  filterChipTxt:   { fontFamily: typography.body, color: colors.text, fontSize: typography.size.body },
  filterChipTxtOn: { fontFamily: typography.bodySemibold, color: '#FFFFFF' },
  filterBadge:     { backgroundColor: colors.resa, borderRadius: radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeTxt:  { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium },

  cardWrap: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
});
