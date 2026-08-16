import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { colors, typography, spacing } from '../src/theme';
import useProOrders from '../src/hooks/useProOrders';
import OrderCard from '../src/components/OrderCard';
import Tag from '../src/components/Tag';

// Vocabulaire aligné sur celui déjà littéral d'OrderCard.dc.html (NOUVELLE →
// EN PRÉPARATION → PRÊTE), pas le vocabulaire réservation En attente/Confirmées
// utilisé ici avant.
const FILTERS = ['Tout', 'Nouvelles', 'En cours', 'Prêtes'];
const FILTER_MAP = { 'Nouvelles': 'pending', 'En cours': 'confirmed', 'Prêtes': 'ready' };

export default function ProOrdersScreen({ navigation }) {
  const { orders, loading, refreshing, acting, onRefresh, advance, cancel, NEXT_LABEL } = useProOrders();
  const [filter, setFilter] = useState('Tout');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'Tout') return orders.filter(o => o.status !== 'collected' && o.status !== 'cancelled');
    return orders.filter(o => o.status === FILTER_MAP[filter]);
  }, [orders, filter]);

  const countFor = useMemo(() => {
    const active = orders.filter(o => o.status !== 'collected' && o.status !== 'cancelled');
    return {
      Tout: active.length,
      Nouvelles: orders.filter(o => o.status === 'pending').length,
      'En cours': orders.filter(o => o.status === 'confirmed').length,
      Prêtes: orders.filter(o => o.status === 'ready').length,
    };
  }, [orders]);

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
            <TouchableOpacity key={f} onPress={() => setFilter(f)}>
              <Tag variant={active ? 'filterActive' : 'filterInactive'} size="filter">{`${f} (${countFor[f]})`}</Tag>
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

  filtersWrap: { height: 56, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  filtersList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: 6, flexDirection: 'row', alignItems: 'center' },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium },

  cardWrap: { marginHorizontal: spacing.xl, marginBottom: spacing.sm },
});
