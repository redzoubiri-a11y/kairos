import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProAvis, { FILTERS } from '../src/hooks/useProAvis';
import AvisStats from '../src/components/AvisStats';
import ReviewCard from '../src/components/ReviewCard';
import BottomTabBar from '../src/components/BottomTabBar';

function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      <MLoader width="100%" height={100} borderRadius={radius.xl} />
      <MLoader width="60%" height={12}  borderRadius={radius.sm} />
      {[1, 2, 3].map(i => (
        <MLoader key={i} width="100%" height={110} borderRadius={radius.xl} />
      ))}
    </View>
  );
}

export default function ProAvisScreen({ navigation }) {
  const {
    reviews, loading, refreshing, filter, setFilter, restaurant,
    handleSaveResponse, handleApprove, handleReject,
    onRefresh, noReply, ratingCounts, filtered, pendingCount,
  } = useProAvis();

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Avis clients</Text>
          {restaurant && <Text style={s.subtitle}>{restaurant.name}</Text>}
        </View>
        {noReply > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{noReply}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? <Skeleton /> : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          >
            <View style={{ marginTop: spacing.xl }}>
              <AvisStats reviews={reviews} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              {FILTERS.map(f => {
                const isActive = filter === f;
                const count = f === 'Sans réponse' ? noReply
                            : f === 'Tous'          ? reviews.length
                            : f === 'En attente'    ? pendingCount
                            : f === '5 ⭐'          ? ratingCounts[5]
                            : f === '4 ⭐'          ? ratingCounts[4]
                            : f === '3 ⭐'          ? ratingCounts[3]
                            : ratingCounts.low;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[s.chip, isActive && s.chipOn, f === 'Sans réponse' && noReply > 0 && !isActive && s.chipAlert, f === 'En attente' && pendingCount > 0 && !isActive && s.chipPending]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[s.chipTxt, isActive && s.chipTxtOn]}>{f}</Text>
                    {count > 0 && <Text style={[s.chipCount, isActive && s.chipCountOn]}>{count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.listHead}>
              <Text style={s.listHeadTxt}>{filtered.length} avis</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>⭐</Text>
                <Text style={s.emptyTitle}>Aucun avis</Text>
                <Text style={s.emptyDesc}>
                  {reviews.length === 0
                    ? 'Les avis apparaîtront ici après les premières réservations.'
                    : 'Aucun avis ne correspond à ce filtre.'}
                </Text>
              </View>
            ) : (
              filtered.map(r => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onSaveResponse={handleSaveResponse}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}

            <View style={{ height: 48 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <BottomTabBar navigation={navigation} isPro={true} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  title:      { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  badge:      { backgroundColor: colors.red, borderRadius: radius.full, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  badgeTxt:   { color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  filterRow:   { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:      { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  chipAlert:   { borderColor: 'rgba(224,90,90,0.4)' },
  chipPending: { borderColor: 'rgba(232,160,69,0.5)' },
  chipTxt:     { color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn:   { color: colors.accent, fontWeight: typography.weight.semibold },
  chipCount:   { color: colors.textDim, fontSize: typography.size.xs },
  chipCountOn: { color: colors.accent },

  listHead:    { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  listHeadTxt: { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },

  empty:      { alignItems: 'center', paddingVertical: 64, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.textMuted, fontSize: typography.size.subheading, fontWeight: '300' },
  emptyDesc:  { color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', maxWidth: 260 },
});
