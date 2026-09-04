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
import Tag from '../src/components/Tag';

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
    reviews, loading, refreshing, erreur, reessayer, filter, setFilter, restaurant,
    handleSaveResponse, handleApprove, handleReject,
    onRefresh, noReply, filtered,
  } = useProAvis();

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
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
        {loading ? <Skeleton /> : erreur ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{erreur === 'network' ? '📡' : '⚠️'}</Text>
            <Text style={s.emptyTitle}>{erreur === 'network' ? 'Pas de connexion' : 'Erreur serveur'}</Text>
            <Text style={s.emptyDesc}>
              {erreur === 'network' ? 'Vérifie ta connexion internet.' : "Une erreur inattendue s'est produite."}
            </Text>
            <TouchableOpacity onPress={reessayer} style={s.retryBtn}>
              <Text style={s.retryBtnTxt}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <View style={{ marginTop: spacing.xl }}>
              <AvisStats reviews={reviews} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} delayContentTouches={false}>
              {FILTERS.map(f => {
                const isActive = filter === f;
                const label = f === 'Sans réponse' ? `Sans réponse (${noReply})` : f;
                return (
                  <TouchableOpacity key={f} delayPressIn={0} onPress={() => setFilter(f)}>
                    <Tag variant={isActive ? 'filterActive' : 'filterInactive'} size="filter">{label}</Tag>
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
      <View style={s.terminerBar}>
        <TouchableOpacity style={s.terminerBtn} onPress={() => navigation.navigate('Main', { screen: 'Manager' })}>
          <Text style={s.terminerTxt}>Terminer → Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  terminerBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  terminerBtn: { alignItems: 'center', paddingVertical: spacing.md },
  terminerTxt: { color: colors.primary, fontFamily: typography.bodyMedium, fontSize: typography.size.body },
  root:   { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:    { padding: spacing.xs },
  backBtnTxt: { color: colors.text, fontSize: 22 },
  title:      { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading2 },
  subtitle:   { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.caption, marginTop: 1 },
  badge:      { backgroundColor: colors.red, borderRadius: radius.full, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  badgeTxt:   { color: colors.card, fontFamily: typography.bodyBold, fontSize: typography.size.xs },

  filterRow:   { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: 6 },

  listHead:    { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  listHeadTxt: { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.sm, letterSpacing: 2 },

  empty:      { alignItems: 'center', paddingVertical: 64, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.subheading },
  emptyDesc:  { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.body, textAlign: 'center', maxWidth: 260 },
  retryBtn:   { marginTop: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  retryBtnTxt:{ color: colors.text, fontFamily: typography.bodyMedium, fontSize: typography.size.body },
});
