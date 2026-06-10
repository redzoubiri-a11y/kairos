import { useEffect } from 'react';
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
import BottomTabBar from '../src/components/BottomTabBar';

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
  const { view, restaurant, loading, goList, goCreate, goActive } = useProPromos();
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
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
        view === 'list'   ? <PromoListView   restaurant={restaurant} onCreate={goCreate} /> :
        view === 'create' ? <PromoCreateView onActivate={goActive} onBack={goList} /> :
                            <PromoActiveView onViewAll={goList} onCreate={goCreate} />
      )}
      <BottomTabBar navigation={navigation} isPro={true} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  title:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:     { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  createBtn:    { backgroundColor: '#c8975a', borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  createBtnTxt: { color: colors.bg, fontSize: typography.size.caption, fontWeight: typography.weight.extrabold },
});
