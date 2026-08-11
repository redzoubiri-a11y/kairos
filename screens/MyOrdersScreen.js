import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useMyOrders from '../src/hooks/useMyOrders';
import OrderCard from '../src/components/OrderCard';

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
        <Text style={s.headerTitle}>Mes commandes</Text>
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
                  <View key={o.id} style={s.cardWrap}>
                    <OrderCard
                      order={o}
                      title={o.restaurants?.name || 'Restaurant'}
                      onPressTitle={() => goRestaurant(o.restaurants)}
                      onCancel={(order) => cancel(order.id)}
                      acting={cancelling.has(o.id)}
                    />
                  </View>
                ))}
              </>
            )}
            {history.length > 0 && (
              <>
                <Text style={s.sectionLbl}>HISTORIQUE · {history.length}</Text>
                {history.map(o => (
                  <View key={o.id} style={s.cardWrap}>
                    <OrderCard
                      order={o}
                      title={o.restaurants?.name || 'Restaurant'}
                      onPressTitle={() => goRestaurant(o.restaurants)}
                      onCancel={(order) => cancel(order.id)}
                      acting={cancelling.has(o.id)}
                    />
                  </View>
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
  headerTitle: { flex: 1, color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: -0.2, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  sectionLbl: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  cardWrap: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
});
