import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function MenuCategoriesView({ categories, dishes, onAdd, onDelete, onBack }) {
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
          <Text style={c.hint}>Appuie longuement pour supprimer une catégorie vide</Text>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={c.row}
              onLongPress={() => handleDelete(cat)}
              activeOpacity={0.75}
            >
              <Text style={c.drag}>⠿</Text>
              <Text style={c.catName}>{cat}</Text>
              <Text style={c.count}>{counts[cat] || 0} plat{(counts[cat] || 0) !== 1 ? 's' : ''}</Text>
              {counts[cat] === 0 && (
                <TouchableOpacity onPress={() => handleDelete(cat)}>
                  <Text style={c.del}>🗑</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          <View style={c.addRow}>
            <TextInput
              style={c.addInput}
              value={newCat}
              onChangeText={setNewCat}
              placeholder="🥤 Nouvelle catégorie…"
              placeholderTextColor={colors.textDim}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={c.addBtn} onPress={handleAdd} activeOpacity={0.7}>
              <Text style={c.addBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 36, height: 36, borderRadius: 0, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading2 },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: '300', letterSpacing: 1 },
});

const c = StyleSheet.create({
  hint:      { color: colors.textDim, fontSize: typography.size.caption, marginBottom: spacing.xl, lineHeight: 18 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, marginBottom: spacing.md },
  drag:      { color: colors.textDim, fontSize: typography.size.heading2 },
  catName:   { flex: 1, color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  count:     { color: colors.textDim, fontSize: typography.size.body },
  del:       { fontSize: typography.size.subheading, marginLeft: spacing.sm },
  addRow:    { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  addInput:  { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, color: colors.text, fontSize: typography.size.body },
  addBtn:    { width: 46, height: 46, borderRadius: radius.xl, backgroundColor: 'rgba(200,151,90,0.14)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  addBtnTxt: { color: colors.accent, fontSize: typography.size.heading2, fontWeight: typography.weight.bold },
});
