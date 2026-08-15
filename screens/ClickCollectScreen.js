import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useClickCollect from '../src/hooks/useClickCollect';
import useCart from '../src/hooks/useCart';
import { estimateWaitMinutes } from '../src/utils/waitTime';
import Button from '../src/components/Button';
import Tag from '../src/components/Tag';
import EmptyState from '../src/components/EmptyState';

const MODES = [
  { id: 'pickup', label: 'À emporter' },
  { id: 'table',  label: 'Je suis à table' },
];

export default function ClickCollectScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {};
  const { dishes, waitTimeEstimates, loading, submitting, submitOrder } = useClickCollect(restaurant.id);
  const { items, addItem, removeItem, qtyFor, clear, totalCount, totalAmount } = useCart();
  const [notes, setNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [mode, setMode] = useState(route?.params?.initialMode === 'table' ? 'table' : 'pickup');
  const [tableNumber, setTableNumber] = useState(route?.params?.initialTable ? String(route.params.initialTable) : '');
  const insets = useSafeAreaInsets();
  const waitMinutes = useMemo(() => estimateWaitMinutes(waitTimeEstimates), [waitTimeEstimates]);

  const categories = useMemo(() => [...new Set(dishes.map(d => d.category || 'Autre'))], [dishes]);
  const [activeCat, setActiveCat] = useState(null);
  const currentCat = activeCat || categories[0];
  const visibleDishes = useMemo(
    () => dishes.filter(d => (d.category || 'Autre') === currentCat),
    [dishes, currentCat],
  );

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSubmit = useCallback(async () => {
    if (mode === 'table' && !tableNumber.trim()) {
      Alert.alert('Numéro de table', 'Indiquez votre numéro de table.');
      return;
    }
    const { orderId, error } = await submitOrder(items, notes, {
      mode, tableNumber: mode === 'table' ? parseInt(tableNumber, 10) : null,
    });
    if (error) { Alert.alert('Erreur', error); return; }
    clear();
    setNotes('');
    setShowCart(false);
    setConfirmed(true);
  }, [items, notes, mode, tableNumber, submitOrder, clear]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={s.headerSub} numberOfLines={1}>Commander</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
      ) : dishes.length === 0 ? (
        <EmptyState
          style={s.emptyWrap}
          icon={<Text style={{ fontSize: 20 }}>🍽️</Text>}
          title="Menu indisponible"
          subtitle="Ce restaurant n'a pas encore de plats disponibles à la commande."
        />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsWrap} contentContainerStyle={s.catsList}>
            {categories.map(cat => {
              const active = cat === currentCat;
              return (
                <TouchableOpacity key={cat} onPress={() => setActiveCat(cat)} activeOpacity={0.7}>
                  <Tag variant={active ? 'filterActive' : 'filterInactive'} size="filter">{cat}</Tag>
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
                    <View style={s.dishPriceRow}>
                      <Text style={s.dishPrice}>{d.price ? `${Number(d.price).toLocaleString('fr-FR')} DA` : '—'}</Text>
                      {qty > 0 ? (
                        <View style={s.stepPill}>
                          <TouchableOpacity onPress={() => removeItem(d.id)}>
                            <Text style={s.stepBtnTxt}>−</Text>
                          </TouchableOpacity>
                          <Text style={s.stepQty}>{qty}</Text>
                          <TouchableOpacity onPress={() => addItem(d)} disabled={!d.price}>
                            <Text style={s.stepBtnTxt}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={s.addBtn} onPress={() => addItem(d)} disabled={!d.price}>
                          <Text style={s.addBtnTxt}>+</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {confirmed && (
            <View style={[s.confirmPanel, { bottom: insets.bottom }]}>
              <View style={s.confirmCheck}>
                <Text style={s.confirmCheckTxt}>✓</Text>
              </View>
              <Text style={s.confirmTitle}>Commande envoyée</Text>
              <Text style={s.confirmSub}>
                Votre commande chez {restaurant.name}{mode === 'table' ? ` (table n°${tableNumber})` : ''} a été envoyée. Vous serez notifié dès qu'elle sera confirmée.
              </Text>
              <Button variant="primary" onPress={goBack} style={{ marginTop: spacing.sm }}>Retour</Button>
            </View>
          )}

          {totalCount > 0 && !showCart && !confirmed && (
            <View style={[s.cartBar, { bottom: insets.bottom + 12 }]}>
              <View>
                <Text style={s.cartBarCount}>{totalCount} article{totalCount > 1 ? 's' : ''}</Text>
                <Text style={s.cartBarTotal}>{totalAmount.toLocaleString('fr-FR')} DA</Text>
              </View>
              <Button variant="pro" small fullWidth={false} onPress={() => setShowCart(true)}>Voir le panier</Button>
            </View>
          )}

          {showCart && (
            <View style={[s.cartPanel, { bottom: insets.bottom }]}>
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

              {/* Choix du mode — Lot 3 : à emporter (créneau non géré) ou à table (numéro requis) */}
              <View style={s.modeRow}>
                {MODES.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.modeBtn, mode === m.id && s.modeBtnActive]}
                    onPress={() => setMode(m.id)}
                  >
                    <Text style={[s.modeTxt, mode === m.id && s.modeTxtActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === 'table' && (
                <TextInput
                  style={s.notesInput}
                  placeholder="Numéro de table"
                  placeholderTextColor={colors.textDim}
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  keyboardType="number-pad"
                />
              )}

              {waitMinutes != null && (
                <Text style={s.waitTxt}>⏱ Temps d'attente estimé : ~{waitMinutes} min</Text>
              )}

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
              <Button variant="confirm" onPress={handleSubmit} loading={submitting}>Envoyer la commande</Button>
              <Text style={s.paymentNote}>
                {mode === 'table' ? 'Paiement sur place, à table' : 'Paiement sur place au retrait'}
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.lg - 2, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  backBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 18 },
  headerTitle: { fontFamily: typography.display, color: colors.text, fontSize: typography.size.subheading + 2, letterSpacing: -0.2 },
  headerSub:   { fontFamily: typography.body, color: 'rgba(10,10,10,0.5)', fontSize: typography.size.caption + 0.5, marginTop: 2 },

  emptyWrap:  { flex: 1, marginHorizontal: spacing.xl, marginTop: spacing.section },

  catsWrap: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  catsList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm, flexDirection: 'row' },

  dishRow:     { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl - 2, padding: spacing.lg },
  dishPhoto:   { width: 72, height: 72, borderRadius: radius.lg - 2, backgroundColor: colors.cardHover, flexShrink: 0 },
  dishPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dishName:    { fontFamily: typography.display, color: colors.text, fontSize: typography.size.subheading + 0.5 },
  dishDesc:    { fontFamily: typography.body, color: 'rgba(10,10,10,0.5)', fontSize: typography.size.body, marginTop: spacing.xs },
  dishPriceRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  dishPrice:   { fontFamily: typography.display, color: colors.text, fontSize: typography.size.subheading },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addBtn:      { width: 26, height: 26, borderRadius: radius.sm + 3, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:   { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: 15, lineHeight: 18 },
  stepPill:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.tagGreenBg, borderRadius: radius.sm + 3, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  stepBtnTxt:  { fontFamily: typography.bodyBold, color: colors.primary, fontSize: 14 },
  stepQty:     { fontFamily: typography.bodyBold, color: colors.primary, fontSize: 14, minWidth: 14, textAlign: 'center' },

  cartBar:      { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.noir, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartBarCount: { fontFamily: typography.bodyMedium, color: 'rgba(255,255,255,0.55)', fontSize: typography.size.caption },
  cartBarTotal: { fontFamily: typography.display, color: '#FFFFFF', fontSize: typography.size.subheading + 3, marginTop: 2 },

  cartPanel:       { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  cartPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartPanelTitle:  { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.subheading },
  cartPanelClose:  { color: colors.textMuted, fontSize: 18 },
  cartItemRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  cartItemQty:     { fontFamily: typography.bodyBold, color: colors.blue, width: 28 },
  cartItemName:    { flex: 1, fontFamily: typography.body, color: colors.text },
  cartItemPrice:   { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption },
  notesInput:      { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: typography.size.body, minHeight: 44, textAlignVertical: 'top' },

  modeRow:      { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  modeBtn:      { flex: 1, alignItems: 'center', paddingVertical: spacing.md - 2, borderRadius: radius.md, backgroundColor: colors.tagNeutralBg },
  modeBtnActive:{ backgroundColor: colors.primary },
  modeTxt:      { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.text },
  modeTxtActive:{ color: '#FFFFFF' },

  waitTxt: { fontFamily: typography.bodyMedium, fontSize: typography.size.caption + 0.5, color: colors.textMuted, marginBottom: spacing.xs },
  cartTotalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  cartTotalLbl:    { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body },
  cartTotalVal:    { fontFamily: typography.display, color: colors.text, fontSize: typography.size.subheading },
  paymentNote:     { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center' },

  confirmPanel:    { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxl, alignItems: 'center', gap: spacing.sm, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  confirmCheck:    { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  confirmCheckTxt: { fontFamily: typography.bodyBold, color: colors.primary, fontSize: 26 },
  confirmTitle:    { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading2 },
  confirmSub:      { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', lineHeight: 18 },
});
