import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProMenu, { DEFAULT_CATS, EMPTY_FORM } from '../src/hooks/useProMenu';
import DishCard from '../src/components/DishCard';
import DishForm from '../src/components/DishForm';
import MenuCategoriesView from '../src/components/MenuCategoriesView';
import BottomTabBar from '../src/components/BottomTabBar';

function SkeletonMenu() {
  return (
    <View style={{ padding: spacing.xxl }}>
      <MLoader width="60%" height={14} borderRadius={radius.sm} style={{ marginBottom: spacing.sm }} />
      <MLoader width="40%" height={10} borderRadius={radius.sm} style={{ marginBottom: spacing.xxl }} />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        {[1,2,3,4].map(i => <MLoader key={i} width={80} height={30} borderRadius={radius.pill} />)}
      </View>
      {[1,2,3].map(i => (
        <MLoader key={i} width="100%" height={110} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );
}

export default function ProMenuScreen({ navigation, route }) {
  const onSetupComplete = route?.params?.onSetupComplete;
  const {
    restaurant, dishes, categories, loading, refreshing,
    view, activeCat, editingDish, acting,
    setActiveCat, setEditingDish, setView,
    toggleAvailability, saveDish, deleteDish,
    filtered, activeCount,
    openAddForm, cancelForm, goCategories, goList, onRefresh, addCat, deleteCat,
  } = useProMenu();

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  if (view === 'add' || view === 'edit') {
    const initial = view === 'edit' && editingDish
      ? {
          name:         editingDish.name          || '',
          description:  editingDish.description   || '',
          price:        editingDish.price?.toString() || '',
          category:     editingDish.category      || (categories[0] ?? DEFAULT_CATS[1]),
          isAvailable:  editingDish.is_available  ?? true,
          isDishOfDay:  editingDish.is_dish_of_day ?? false,
          hasAllergens: editingDish.has_allergens ?? false,
          photo:        editingDish.photo         || '',
        }
      : { ...EMPTY_FORM, category: activeCat || categories[0] || DEFAULT_CATS[1] };

    return (
      <SafeAreaView style={s.root}>
        <DishForm
          initial={initial}
          categories={categories}
          isEdit={view === 'edit'}
          restaurantId={restaurant?.id}
          onSave={saveDish}
          onCancel={cancelForm}
          onDelete={deleteDish}
          onTerminer={() => navigation.navigate('Main', { screen: 'Manager' })}
        />
    </SafeAreaView>
    );
  }

  if (view === 'categories') {
    return (
      <SafeAreaView style={s.root}>
        <MenuCategoriesView
          categories={categories}
          dishes={dishes}
          onAdd={addCat}
          onDelete={deleteCat}
          onBack={goList}
        />
    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        {!onSetupComplete ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
        ) : <View style={s.backBtn} />}
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>GESTION DU MENU</Text>
          <Text style={s.headerTitle}>{restaurant?.name || 'Menu'}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAddForm} activeOpacity={0.75}>
          <Text style={s.addBtnTxt}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {!loading && (
        <View style={s.subBar}>
          <View style={s.subDot} />
          <Text style={s.subTxt}>
            {dishes.length} plat{dishes.length !== 1 ? 's' : ''} · {activeCount} actif{activeCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <SkeletonMenu />
      ) : (
        <>
          <View style={s.catsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsList}>
              {categories.map(cat => {
                const active = activeCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catChip, active && s.catChipOn]}
                    onPress={() => setActiveCat(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.catChipTxt, active && s.catChipTxtOn]}>{cat}</Text>
                    {active && <View style={s.catDot} />}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={s.catChip} onPress={goCategories} activeOpacity={0.7}>
                <Text style={s.catChipMuted}>⚙️ Catégories</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          >
            <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: 80 }}>
              {filtered.length === 0 ? (
                <View style={s.empty}>
                  <Text style={s.emptyEmoji}>🍽️</Text>
                  <Text style={s.emptyTitle}>Aucun plat ici</Text>
                  <Text style={s.emptySub}>
                    {activeCat
                      ? `Aucun plat dans "${activeCat}" pour l'instant`
                      : 'Ajoutez votre premier plat'}
                  </Text>
                </View>
              ) : (
                filtered.map(dish => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onEdit={() => { setEditingDish(dish); setView('edit'); }}
                    onToggle={() => toggleAvailability(dish)}
                    acting={acting.has(dish.id)}
                  />
                ))
              )}

              <TouchableOpacity style={s.addDashed} onPress={openAddForm} activeOpacity={0.7}>
                <Text style={s.addDashedPlus}>+</Text>
                <Text style={s.addDashedTxt}>
                  {activeCat ? `Ajouter un plat dans ${activeCat}` : 'Ajouter un plat'}
                </Text>
              </TouchableOpacity>

              {onSetupComplete && (
                <TouchableOpacity
                  style={s.nextBtn}
                  onPress={() => {
                    if (dishes.length === 0) {
                      Alert.alert(
                        'Menu vide',
                        'Vous pouvez ajouter des plats plus tard depuis votre tableau de bord.',
                        [
                          { text: 'Rester', style: 'cancel' },
                          { text: 'Continuer quand même', onPress: () => { onSetupComplete(); navigation.goBack(); } },
                        ]
                      );
                      return;
                    }
                    onSetupComplete();
                    navigation.goBack();
                  }}
                >
                  <Text style={s.nextBtnTxt}>Étape suivante →</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </>
      )}
      <View style={s.terminerBar}>
        <TouchableOpacity style={s.terminerBtn} onPress={() => navigation.navigate('Main', { screen: 'Manager' })}>
          <Text style={s.terminerTxt}>Terminer → Dashboard</Text>
        </TouchableOpacity>
      </View>
      <BottomTabBar navigation={navigation} isPro={true} activeTab="Manager" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  terminerBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  terminerBtn: { alignItems: 'center', paddingVertical: spacing.md },
  terminerTxt: { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 36, padding: spacing.xs },
  backBtnTxt:   { color: colors.text, fontSize: 22 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSub:    { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle:  { color: colors.text, fontSize: typography.size.title, fontWeight: '300', letterSpacing: 1 },
  addBtn:       { backgroundColor: '#c8975a', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  addBtnTxt:    { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },

  subBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  subDot:  { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
  subTxt:  { color: colors.textMuted, fontSize: typography.size.body },

  catsWrap:     { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  catsList:     { flexDirection: 'row', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.md },
  catChip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  catChipOn:    { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  catChipTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  catChipTxtOn: { color: colors.accent, fontWeight: typography.weight.semibold },
  catChipMuted: { color: colors.textDim, fontSize: typography.size.body },
  catDot:       { position: 'absolute', bottom: -1, left: '30%', right: '30%', height: 2, backgroundColor: colors.accent, borderRadius: 0 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.lg },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  addDashed:     { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(232,160,69,0.35)', borderRadius: radius.xl, paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addDashedPlus: { color: colors.accent, fontSize: 26 },
  addDashedTxt:  { color: colors.textMuted, fontSize: typography.size.body },

  nextBtn:    { backgroundColor: colors.text, borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xl },
  nextBtnTxt: { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
});
