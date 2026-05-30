import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const DEFAULT_CATS = ['🥗 Entrées', '🍖 Plats', '🍰 Desserts', '🥤 Boissons'];
const EMPTY_FORM   = { name: '', description: '', price: '', category: '🍖 Plats', isAvailable: true, isDishOfDay: false, hasAllergens: false };

/* ─── Skeleton ─── */
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

/* ─── Toggle row ─── */
function ToggleRow({ label, sub, value, onChange }) {
  return (
    <TouchableOpacity style={tr.row} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={tr.label}>{label}</Text>
        {!!sub && <Text style={tr.sub}>{sub}</Text>}
      </View>
      <View style={[tr.track, value && tr.trackOn]}>
        <View style={[tr.thumb, value && tr.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}
const tr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  label:   { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  sub:     { color: colors.textDim, fontSize: typography.size.caption, marginTop: spacing.xxs },
  track:   { width: 38, height: 22, borderRadius: 11, backgroundColor: colors.cardBorder, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', paddingHorizontal: 3 },
  trackOn: { backgroundColor: colors.accent, borderColor: colors.accentDim },
  thumb:   { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.textDim, alignSelf: 'flex-start' },
  thumbOn: { backgroundColor: colors.bg, alignSelf: 'flex-end' },
});

/* ─── Dish card ─── */
function DishCard({ dish, onEdit, onToggle, acting }) {
  const dimmed = !dish.is_available;
  return (
    <View style={dc.card}>
      <View style={dc.top}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Text style={[dc.name, dimmed && dc.nameDim]}>{dish.name}</Text>
            {!dish.is_available && (
              <View style={dc.indispoBadge}>
                <Text style={dc.indispoTxt}>Indispo</Text>
              </View>
            )}
            {dish.is_dish_of_day && (
              <View style={dc.dotdBadge}>
                <Text style={dc.dotdTxt}>⭐ Plat du jour</Text>
              </View>
            )}
          </View>
          {!!dish.description && (
            <Text style={dc.desc} numberOfLines={2}>{dish.description}</Text>
          )}
        </View>
        <Text style={dc.price}>
          {dish.price ? `${Number(dish.price).toLocaleString('fr-FR')} DA` : '—'}
        </Text>
      </View>
      <View style={dc.actions}>
        <TouchableOpacity style={dc.editBtn} onPress={onEdit} activeOpacity={0.7}>
          <Text style={dc.editTxt}>✏️  Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dc.toggleBtn, dish.is_available ? dc.toggleRed : dc.toggleGreen]}
          onPress={onToggle}
          disabled={acting}
          activeOpacity={0.7}
        >
          <Text style={[dc.toggleTxt, dish.is_available ? dc.toggleTxtRed : dc.toggleTxtGreen]}>
            {acting ? '···' : dish.is_available ? '⏸  Indisponible' : '▶  Disponible'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const dc = StyleSheet.create({
  card:         { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, marginBottom: spacing.lg, gap: spacing.lg },
  top:          { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  name:         { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  nameDim:      { color: colors.textDim },
  desc:         { color: colors.textDim, fontSize: typography.size.caption, lineHeight: 16 },
  price:        { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, flexShrink: 0 },
  indispoBadge: { backgroundColor: colors.redSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  indispoTxt:   { color: colors.red, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  dotdBadge:    { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  dotdTxt:      { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  actions:      { flexDirection: 'row', gap: spacing.md },
  editBtn:      { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.25)' },
  editTxt:      { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  toggleBtn:    { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg },
  toggleRed:    { backgroundColor: colors.redSoft, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)' },
  toggleGreen:  { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)' },
  toggleTxt:    { fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  toggleTxtRed: { color: colors.red },
  toggleTxtGreen:{ color: colors.green },
});

/* ─── Formulaire ajout/modification ─── */
function DishForm({ initial, categories, isEdit, onSave, onCancel, onDelete }) {
  const [form,     setForm]     = useState(initial);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set     = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const canSave = form.name.trim().length > 0 && form.price.trim().length > 0 && form.category;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }, [canSave, onSave, form]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer ce plat',
      `Supprimer "${form.name}" du menu ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await onDelete();
          } finally {
            setDeleting(false);
          }
        }},
      ]
    );
  }, [onDelete, form.name]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onCancel}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>{isEdit ? 'MODIFIER LE PLAT' : 'NOUVEAU PLAT'}</Text>
          <Text style={s.headerTitle}>{isEdit ? (form.name || 'Plat') : 'Ajouter un plat'}</Text>
        </View>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete} style={{ width: 64, alignItems: 'flex-end' }} disabled={deleting}>
            <Text style={[df.deleteBtn, deleting && { opacity: 0.4 }]}>{deleting ? '···' : 'Supprimer'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={df.body}>

          <View style={df.field}>
            <Text style={df.label}>Nom du plat *</Text>
            <View style={[df.inputWrap, form.name && df.inputWrapActive]}>
              <Text style={df.inputIcon}>🍽️</Text>
              <TextInput
                style={df.input}
                value={form.name}
                onChangeText={v => set('name', v)}
                placeholder="Ex : Brochettes mixtes"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          <View style={df.field}>
            <Text style={df.label}>Description</Text>
            <Text style={df.hint}>Aide les clients à faire leur choix</Text>
            <View style={[df.inputWrap, { alignItems: 'flex-start', paddingTop: spacing.md }, form.description && df.inputWrapActive]}>
              <Text style={[df.inputIcon, { marginTop: 2 }]}>📝</Text>
              <TextInput
                style={[df.input, { minHeight: 60 }]}
                value={form.description}
                onChangeText={v => set('description', v)}
                placeholder="Ingrédients, préparation…"
                placeholderTextColor={colors.textDim}
                multiline
              />
            </View>
          </View>

          <View style={df.field}>
            <Text style={df.label}>Prix (DA) *</Text>
            <View style={[df.inputWrap, form.price && df.inputWrapActive]}>
              <Text style={df.inputIcon}>💰</Text>
              <TextInput
                style={df.input}
                value={form.price}
                onChangeText={v => set('price', v.replace(/[^0-9]/g, ''))}
                placeholder="Ex : 1400"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={df.field}>
            <Text style={df.label}>Catégorie *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs }}>
                {categories.map(cat => {
                  const active = form.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[df.catChip, active && df.catChipOn]}
                      onPress={() => set('category', cat)}
                    >
                      <Text style={[df.catChipTxt, active && df.catChipTxtOn]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={df.togglesWrap}>
            <ToggleRow label="Disponible dès maintenant" sub="Visible par les clients"        value={form.isAvailable}  onChange={v => set('isAvailable', v)}  />
            <ToggleRow label="Plat du jour"              sub="Mis en avant sur ta fiche"      value={form.isDishOfDay}  onChange={v => set('isDishOfDay', v)}  />
            <ToggleRow label="Contient des allergènes"   sub="Gluten, lactose, noix…"          value={form.hasAllergens} onChange={v => set('hasAllergens', v)} />
          </View>

        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingBottom: 60 }}>
          <TouchableOpacity
            style={[s.saveBtn, (!canSave || saving) && { opacity: 0.45 }]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.8}
          >
            <Text style={s.saveBtnTxt}>{saving ? '···' : isEdit ? 'Enregistrer →' : 'Ajouter au menu →'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const df = StyleSheet.create({
  body:           { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xxs },
  field:          { marginBottom: spacing.xl },
  label:          { color: colors.textMuted, fontSize: typography.size.caption, fontWeight: typography.weight.semibold, marginBottom: spacing.sm, letterSpacing: 0.5 },
  hint:           { color: colors.textDim, fontSize: typography.size.xs, marginBottom: spacing.sm, marginTop: -spacing.xs },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  inputWrapActive:{ borderColor: 'rgba(232,160,69,0.5)' },
  inputIcon:      { fontSize: typography.size.subheading, flexShrink: 0 },
  input:          { flex: 1, color: colors.text, fontSize: typography.size.body, paddingVertical: spacing.xs },
  catChip:        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  catChipOn:      { backgroundColor: colors.accentSoft, borderColor: 'rgba(232,160,69,0.4)' },
  catChipTxt:     { color: colors.textMuted, fontSize: typography.size.body },
  catChipTxtOn:   { color: colors.accent, fontWeight: typography.weight.semibold },
  togglesWrap:    { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  deleteBtn:      { color: colors.red, fontSize: typography.size.body },
});

/* ─── Gestion des catégories ─── */
function CategoriesView({ categories, dishes, onAdd, onDelete, onBack }) {
  const [newCat, setNewCat] = useState('');

  const counts = categories.reduce((acc, cat) => {
    acc[cat] = dishes.filter(d => d.category === cat).length;
    return acc;
  }, {});

  const handleAdd = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAdd(trimmed);
    setNewCat('');
  };

  const handleDelete = (cat) => {
    if (counts[cat] > 0) {
      Alert.alert(
        'Catégorie non vide',
        `"${cat}" contient ${counts[cat]} plat${counts[cat] > 1 ? 's' : ''}. Déplacez ou supprimez ces plats d'abord.`
      );
      return;
    }
    Alert.alert('Supprimer la catégorie', `Supprimer "${cat}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(cat) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>ORGANISATION</Text>
          <Text style={s.headerTitle}>Catégories</Text>
        </View>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl }}>
          <Text style={cv.hint}>Appuie longuement pour supprimer une catégorie vide</Text>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={cv.row}
              onLongPress={() => handleDelete(cat)}
              activeOpacity={0.75}
            >
              <Text style={cv.drag}>⠿</Text>
              <Text style={cv.catName}>{cat}</Text>
              <Text style={cv.count}>{counts[cat] || 0} plat{(counts[cat] || 0) !== 1 ? 's' : ''}</Text>
              {counts[cat] === 0 && (
                <TouchableOpacity onPress={() => handleDelete(cat)}>
                  <Text style={cv.del}>🗑</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          <View style={cv.addRow}>
            <TextInput
              style={cv.addInput}
              value={newCat}
              onChangeText={setNewCat}
              placeholder="🥤 Nouvelle catégorie…"
              placeholderTextColor={colors.textDim}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={cv.addBtn} onPress={handleAdd} activeOpacity={0.7}>
              <Text style={cv.addBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}
const cv = StyleSheet.create({
  hint:    { color: colors.textDim, fontSize: typography.size.caption, marginBottom: spacing.xl, lineHeight: 18 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, marginBottom: spacing.md },
  drag:    { color: colors.textDim, fontSize: typography.size.heading2 },
  catName: { flex: 1, color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  count:   { color: colors.textDim, fontSize: typography.size.body },
  del:     { fontSize: typography.size.subheading, marginLeft: spacing.sm },
  addRow:  { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  addInput:{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, color: colors.text, fontSize: typography.size.body },
  addBtn:  { width: 46, height: 46, borderRadius: radius.xl, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:{ color: colors.accent, fontSize: typography.size.heading2, fontWeight: typography.weight.bold },
});

/* ─── Écran principal ─── */
export default function ProMenuScreen({ navigation }) {
  const [restaurant,  setRestaurant]  = useState(null);
  const [dishes,      setDishes]      = useState([]);
  const [categories,  setCategories]  = useState(DEFAULT_CATS);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [view,        setView]        = useState('list');
  const [activeCat,   setActiveCat]   = useState(null);
  const [editingDish, setEditingDish] = useState(null);
  const [acting,      setActing]      = useState(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id, restaurants(id, name)')
        .eq('auth_id', session.user.id)
        .single();

      if (!ownerRow?.restaurants) return;
      setRestaurant(ownerRow.restaurants);

      const { data: rows } = await supabase
        .from('dishes')
        .select('id, name, description, price, category, is_available, is_dish_of_day, has_allergens, created_at')
        .eq('restaurant_id', ownerRow.restaurants.id)
        .order('created_at', { ascending: true });

      const list = rows ?? [];
      setDishes(list);

      const dishCats = [...new Set(list.map(d => d.category).filter(Boolean))];
      setCategories(prev => [...new Set([...prev, ...dishCats])]);

      if (list.length > 0) {
        setActiveCat(ac => ac || list[0].category || DEFAULT_CATS[1]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleAvailability = useCallback(async (dish) => {
    setActing(p => new Set(p).add(dish.id));
    try {
      await supabase.from('dishes').update({ is_available: !dish.is_available }).eq('id', dish.id);
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: !d.is_available } : d));
    } finally {
      setActing(p => { const next = new Set(p); next.delete(dish.id); return next; });
    }
  }, []);

  const saveDish = useCallback(async (form) => {
    if (!restaurant) return;
    const payload = {
      name:          form.name.trim(),
      description:   form.description.trim(),
      price:         parseInt(form.price, 10) || 0,
      category:      form.category,
      is_available:  form.isAvailable,
      is_dish_of_day:form.isDishOfDay,
      has_allergens: form.hasAllergens,
    };
    if (editingDish) {
      await supabase.from('dishes').update(payload).eq('id', editingDish.id);
    } else {
      await supabase.from('dishes').insert({ ...payload, restaurant_id: restaurant.id });
    }
    setView('list');
    setEditingDish(null);
    await load();
  }, [restaurant, editingDish, load]);

  const deleteDish = useCallback(async () => {
    if (!editingDish) return;
    await supabase.from('dishes').delete().eq('id', editingDish.id);
    setDishes(prev => prev.filter(d => d.id !== editingDish.id));
    setView('list');
    setEditingDish(null);
  }, [editingDish]);

  const filtered    = useMemo(() => activeCat ? dishes.filter(d => d.category === activeCat) : dishes, [dishes, activeCat]);
  const activeCount = useMemo(() => dishes.filter(d => d.is_available).length, [dishes]);

  /* ── sub-view: add / edit ── */
  if (view === 'add' || view === 'edit') {
    const initial = view === 'edit' && editingDish
      ? {
          name:         editingDish.name         || '',
          description:  editingDish.description  || '',
          price:        editingDish.price?.toString() || '',
          category:     editingDish.category     || (categories[0] ?? DEFAULT_CATS[1]),
          isAvailable:  editingDish.is_available ?? true,
          isDishOfDay:  editingDish.is_dish_of_day ?? false,
          hasAllergens: editingDish.has_allergens ?? false,
        }
      : { ...EMPTY_FORM, category: activeCat || categories[0] || DEFAULT_CATS[1] };

    return (
      <SafeAreaView style={s.root}>
        <DishForm
          initial={initial}
          categories={categories}
          isEdit={view === 'edit'}
          onSave={saveDish}
          onCancel={() => { setView('list'); setEditingDish(null); }}
          onDelete={deleteDish}
        />
      </SafeAreaView>
    );
  }

  /* ── sub-view: categories ── */
  if (view === 'categories') {
    return (
      <SafeAreaView style={s.root}>
        <CategoriesView
          categories={categories}
          dishes={dishes}
          onAdd={cat  => setCategories(prev => [...prev, cat])}
          onDelete={cat => setCategories(prev => prev.filter(c => c !== cat))}
          onBack={() => setView('list')}
        />
      </SafeAreaView>
    );
  }

  /* ── main list ── */
  return (
    <SafeAreaView style={s.root}>

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>GESTION DU MENU</Text>
          <Text style={s.headerTitle}>{restaurant?.name || 'Menu'}</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => { setEditingDish(null); setView('add'); }}
          activeOpacity={0.75}
        >
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
              <TouchableOpacity style={s.catChip} onPress={() => setView('categories')} activeOpacity={0.7}>
                <Text style={s.catChipMuted}>⚙️ Catégories</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
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

              <TouchableOpacity
                style={s.addDashed}
                onPress={() => { setEditingDish(null); setView('add'); }}
                activeOpacity={0.7}
              >
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

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading2 },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: '300', letterSpacing: 1 },
  addBtn:      { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBtnTxt:   { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },

  subBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  subDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  subTxt:  { color: colors.textMuted, fontSize: typography.size.body },

  catsWrap: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  catsList: { flexDirection: 'row', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.md },
  catChip:  { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  catChipOn:{ backgroundColor: colors.accentSoft, borderColor: 'rgba(232,160,69,0.4)' },
  catChipTxt:{ color: colors.textMuted, fontSize: typography.size.body },
  catChipTxtOn:{ color: colors.accent, fontWeight: typography.weight.semibold },
  catChipMuted:{ color: colors.textDim, fontSize: typography.size.body },
  catDot:   { position: 'absolute', bottom: -1, left: '30%', right: '30%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.lg },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  addDashed:    { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(232,160,69,0.35)', borderRadius: radius.xl, paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addDashedPlus:{ color: colors.accent, fontSize: 26 },
  addDashedTxt: { color: colors.textMuted, fontSize: typography.size.body },

  saveBtn:    { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, letterSpacing: 0.3 },
});
