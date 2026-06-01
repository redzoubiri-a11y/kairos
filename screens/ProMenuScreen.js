import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import MidaLogo from '../src/components/MidaLogo';
import useProMenu, { DEFAULT_CATS, EMPTY_FORM } from '../src/hooks/useProMenu';
import DishCard from '../src/components/DishCard';
import DishForm from '../src/components/DishForm';
import MenuCategoriesView from '../src/components/MenuCategoriesView';

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

export default function ProMenuScreen({ navigation }) {
  const {
    restaurant, dishes, categories, loading, refreshing,
    view, activeCat, editingDish, acting,
    setActiveCat, setEditingDish, setView,
    toggleAvailability, saveDish, deleteDish,
    filtered, activeCount,
    openAddForm, cancelForm, goCategories, goList, onRefresh, addCat, deleteCat,
  } = useProMenu();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

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
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <MidaLogo showTagline={false} style={{ alignItems: 'center', marginBottom: 2 }} />
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
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:   { color: colors.text, fontSize: typography.size.heading2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSub:    { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle:  { color: colors.text, fontSize: typography.size.title, fontWeight: '300', letterSpacing: 1 },
  addBtn:       { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBtnTxt:    { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },

  subBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  subDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  subTxt:  { color: colors.textMuted, fontSize: typography.size.body },

  catsWrap:     { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  catsList:     { flexDirection: 'row', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.md },
  catChip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  catChipOn:    { backgroundColor: colors.accentSoft, borderColor: 'rgba(232,160,69,0.4)' },
  catChipTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  catChipTxtOn: { color: colors.accent, fontWeight: typography.weight.semibold },
  catChipMuted: { color: colors.textDim, fontSize: typography.size.body },
  catDot:       { position: 'absolute', bottom: -1, left: '30%', right: '30%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.lg },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  addDashed:     { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(232,160,69,0.35)', borderRadius: radius.xl, paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addDashedPlus: { color: colors.accent, fontSize: 26 },
  addDashedTxt:  { color: colors.textMuted, fontSize: typography.size.body },
});
