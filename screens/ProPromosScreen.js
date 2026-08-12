import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, TouchableOpacity, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProPromos from '../src/hooks/useProPromos';
import PromoListView from '../src/components/PromoListView';
import PromoCreateView from '../src/components/PromoCreateView';
import PromoActiveView from '../src/components/PromoActiveView';

function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      <MLoader width="60%" height={14} borderRadius={radius.sm} />
      <MLoader width="100%" height={80} borderRadius={radius.xl} />
      <MLoader width="40%" height={12} borderRadius={radius.sm} style={{ marginTop: spacing.md }} />
      <MLoader width="100%" height={100} borderRadius={radius.xl} />
      <MLoader width="100%" height={70}  borderRadius={radius.xl} />
    </View>
  );
}

export default function ProPromosScreen({ navigation }) {
  const {
    view, restaurant, activePromo, otherPromos, loading, saving,
    goList, goCreate, goActive, createPromo, togglePause, incrementUse,
  } = useProPromos();
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const [lastCreated, setLastCreated] = useState(null);
  const handleActivate = async (fields) => {
    const created = await createPromo(fields);
    setLastCreated(created);
    goActive();
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.title}>
              {view === 'list'   ? 'Mes promotions'      :
               view === 'create' ? 'Créer une promotion' :
               'Promotion activée'}
            </Text>
            {restaurant && <Text style={s.subtitle}>{restaurant.name}</Text>}
          </View>
        </View>
        {view === 'list' && (
          <TouchableOpacity style={s.createBtn} onPress={goCreate}>
            <Text style={s.createBtnTxt}>+ Créer</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? <Skeleton /> : (
        view === 'list'   ? <PromoListView
                               activePromo={activePromo}
                               otherPromos={otherPromos}
                               onCreate={goCreate}
                               onTogglePause={togglePause}
                               onIncrementUse={incrementUse}
                             /> :
        view === 'create' ? <PromoCreateView onActivate={handleActivate} onBack={goList} saving={saving} /> :
                            <PromoActiveView promo={lastCreated} onViewAll={goList} onCreate={goCreate} />
      )}
      <View style={s.terminerBar}>
        <TouchableOpacity style={s.terminerBtn} onPress={() => navigation.navigate('Main', { screen: 'Manager' })}>
          <Text style={s.terminerTxt}>Terminer → Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  terminerBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  terminerBtn: { alignItems: 'center', paddingVertical: spacing.md },
  terminerTxt: { color: colors.gold, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  backBtn:      { padding: spacing.xs },
  backBtnTxt:   { color: colors.text, fontSize: 22 },
  title:        { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: -0.2 },
  subtitle:     { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  createBtn:    { backgroundColor: colors.gold, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  createBtnTxt: { color: colors.noir, fontSize: typography.size.caption, fontWeight: typography.weight.extrabold },
});
