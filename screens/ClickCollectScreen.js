import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useClickCollect from '../src/hooks/useClickCollect';
import useCart from '../src/hooks/useCart';

export default function ClickCollectScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {};
  const { dishes, loading, submitting, submitOrder } = useClickCollect(restaurant.id);
  const { items, addItem, removeItem, qtyFor, clear, totalCount, totalAmount } = useCart();
  const [notes, setNotes] = useState('');
  const [showCart, setShowCart] = useState(false);

  const categories = useMemo(() => [...new Set(dishes.map(d => d.category || 'Autre'))], [dishes]);
  const [activeCat, setActiveCat] = useState(null);
  const currentCat = activeCat || categories[0];
  const visibleDishes = useMemo(
    () => dishes.filter(d => (d.category || 'Autre') === currentCat),
    [dishes, currentCat],
  );

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSubmit = useCallback(async () => {
    const { orderId, error } = await submitOrder(items, notes);
    if (error) { Alert.alert('Erreur', error); return; }
    clear();
    setNotes('');
    setShowCart(false);
    Alert.alert(
      'Commande envoyée ✅',
      `Votre commande chez ${restaurant.name} a été envoyée. Vous serez notifié dès qu'elle sera confirmée.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  }, [items, notes, submitOrder, clear, restaurant, navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub} numberOfLines={1}>CLICK & COLLECT</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
      ) : dishes.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 44 }}>🍽️</Text>
          <Text style={s.emptyTitle}>Menu indisponible</Text>
          <Text style={s.emptySub}>Ce restaurant n'a pas encore de plats disponibles à la commande.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsWrap} contentContainerStyle={s.catsList}>
            {categories.map(cat => {
              const active = cat === currentCat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, active && s.catChipOn]}
                  onPress={() => setActiveCat(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.catChipTxt, active && s.catChipTxtOn]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
            {visibleDishes.map(d => {
              const qty = qtyFor(d.id);
              return (
                <View key={d.id} style={s.dishRow}>
                  {d.photo ? (
                    <Image source={{ uri: d.photo }} style={s.dishPhoto} resizeMode="cover" />
                  ) : (
                    <View style={[s.dishPhoto, s.dishPhotoPlaceholder]}><Text style={{ fontSize: 20 }}>🍽️</Text></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.dishName} numberOfLines={1}>{d.name}</Text>
                    {!!d.description && <Text style={s.dishDesc} numberOfLines={2}>{d.description}</Text>}
                    <Text style={s.dishPrice}>{d.price ? `${Number(d.price).toLocaleString('fr-FR')} DA` : '—'}</Text>
                  </View>
                  <View style={s.stepper}>
                    {qty > 0 && (
                      <TouchableOpacity style={s.stepBtn} onPress={() => removeItem(d.id)}>
                        <Text style={s.stepBtnTxt}>−</Text>
                      </TouchableOpacity>
                    )}
                    {qty > 0 && <Text style={s.stepQty}>{qty}</Text>}
                    <TouchableOpacity style={s.stepBtn} onPress={() => addItem(d)} disabled={!d.price}>
                      <Text style={s.stepBtnTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {totalCount > 0 && !showCart && (
            <View style={s.cartBar}>
              <View>
                <Text style={s.cartBarCount}>{totalCount} article{totalCount > 1 ? 's' : ''}</Text>
                <Text style={s.cartBarTotal}>{totalAmount.toLocaleString('fr-FR')} DA</Text>
              </View>
              <TouchableOpacity style={s.cartBarBtn} onPress={() => setShowCart(true)} activeOpacity={0.85}>
                <Text style={s.cartBarBtnTxt}>Voir le panier</Text>
              </TouchableOpacity>
            </View>
          )}

          {showCart && (
            <View style={s.cartPanel}>
              <View style={s.cartPanelHeader}>
                <Text style={s.cartPanelTitle}>Votre panier</Text>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Text style={s.cartPanelClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 220 }}>
                {items.map(i => (
                  <View key={i.dish_id} style={s.cartItemRow}>
                    <Text style={s.cartItemQty}>{i.quantity}×</Text>
                    <Text style={s.cartItemName} numberOfLines={1}>{i.name}</Text>
                    <Text style={s.cartItemPrice}>{(i.quantity * i.price).toLocaleString('fr-FR')} DA</Text>
                  </View>
                ))}
              </ScrollView>
              <TextInput
                style={s.notesInput}
                placeholder="Note pour le restaurant (optionnel)"
                placeholderTextColor={colors.textDim}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
              <View style={s.cartTotalRow}>
                <Text style={s.cartTotalLbl}>Total</Text>
                <Text style={s.cartTotalVal}>{totalAmount.toLocaleString('fr-FR')} DA</Text>
              </View>
              <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={s.submitBtnTxt}>{submitting ? '···' : 'Envoyer la commande'}</Text>
              </TouchableOpacity>
              <Text style={s.paymentNote}>Paiement sur place au retrait</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },
  headerSub:   { color: colors.gold, fontSize: typography.size.xs, letterSpacing: 2, textAlign: 'center' },
  headerTitle: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading3, fontWeight: typography.weight.bold, textAlign: 'center' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.section },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  catsWrap: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  catsList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm, flexDirection: 'row' },
  catChip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.tagNeutralBg },
  catChipOn:    { backgroundColor: colors.noir },
  catChipTxt:   { color: colors.text, fontSize: typography.size.body },
  catChipTxtOn: { color: '#FFFFFF', fontWeight: typography.weight.semibold },

  dishRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dishPhoto:   { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.cardHover, flexShrink: 0 },
  dishPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dishName:    { color: colors.text, fontSize: typography.size.body, fontWeight: '500' },
  dishDesc:    { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  dishPrice:   { color: colors.text, fontSize: typography.size.caption, marginTop: 4, fontWeight: '600' },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn:     { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt:  { color: colors.green, fontSize: 16, fontWeight: '700' },
  stepQty:     { color: colors.text, fontSize: typography.size.body, fontWeight: '600', minWidth: 16, textAlign: 'center' },

  cartBar:      { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.noir, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartBarCount: { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  cartBarTotal: { color: '#FFFFFF', fontFamily: typography.display, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, marginTop: 2 },
  cartBarBtn:   { backgroundColor: colors.gold, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  cartBarBtnTxt:{ color: colors.noir, fontSize: typography.size.body, fontWeight: typography.weight.bold },

  cartPanel:       { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  cartPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartPanelTitle:  { color: colors.text, fontSize: typography.size.subheading, fontWeight: '600' },
  cartPanelClose:  { color: colors.textMuted, fontSize: 18 },
  cartItemRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  cartItemQty:     { color: colors.blue, fontWeight: '700', width: 28 },
  cartItemName:    { flex: 1, color: colors.text },
  cartItemPrice:   { color: colors.textMuted, fontSize: typography.size.caption },
  notesInput:      { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: typography.size.body, minHeight: 44, textAlignVertical: 'top' },
  cartTotalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  cartTotalLbl:    { color: colors.textMuted, fontSize: typography.size.body },
  cartTotalVal:    { color: colors.text, fontSize: typography.size.subheading, fontWeight: '700' },
  submitBtn:       { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  submitBtnTxt:    { color: '#FFFFFF', fontSize: typography.size.body, fontWeight: '700' },
  paymentNote:     { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center' },
});
