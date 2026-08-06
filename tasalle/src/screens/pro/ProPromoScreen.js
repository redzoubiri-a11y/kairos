import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import MButton from '../../components/MButton';
import MSheet from '../../components/MSheet';
import MInput from '../../components/MInput';
import SalleSwitcher from '../../components/SalleSwitcher';
import { MCard, MChip, MBadge, Divider, Loader, ErrorState, EmptyState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useProSalle } from '../../context/ProSalleContext';
import { formatDA, formatLongDate, todayISO } from '../../lib/format';
import { PROMO_KINDS } from '../../lib/constants';
import * as api from '../../data';

const VIDE = { code: '', kind: PROMO_KINDS.PERCENT, value: '', starts_on: '', ends_on: '', max_uses: '' };

/** État d'un code, du point de vue du propriétaire. */
function etat(promo, aujourdhui) {
  if (!promo.active) return 'inactive';
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) return 'exhausted';
  if (promo.ends_on && promo.ends_on < aujourdhui) return 'expired';
  return 'active';
}

export default function ProPromoScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();
  const { currentId } = useProSalle();

  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCodes(await api.proListPromoCodes(currentId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const creer = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await api.proCreatePromoCode(currentId, form);
      setCreating(false);
      setForm(VIDE);
      await load();
    } catch (e) {
      const cle = e.code === 'PROMO_DUPLICATE' ? 'duplicate' : e.reason;
      setFormError(cle ? t(`pro.promoErrors.${cle}`) : e.message);
    } finally {
      setSaving(false);
    }
  };

  const basculer = async (promo) => {
    await api.proUpdatePromoCode(promo.id, { active: !promo.active });
    await load();
  };

  const supprimer = async (promo) => {
    const r = await api.proDeletePromoCode(promo.id);
    // Un code déjà utilisé n'est pas supprimé mais désactivé : on le dit,
    // sinon le propriétaire croit à un échec.
    setNotice(r.deactivated ? t('pro.promoDeactivatedNotice') : null);
    await load();
  };

  if (loading) {
    return (
      <Screen>
        <Header title={t('pro.promoTitle')} bordered={false} onBack={navigation.goBack} />
        <Loader />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen>
        <Header title={t('pro.promoTitle')} bordered={false} onBack={navigation.goBack} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const aujourdhui = todayISO();

  return (
    <Screen>
      <Header
        title={t('pro.promoTitle')}
        subtitle={t('pro.promoSubtitle')}
        bordered={false}
        onBack={navigation.goBack}
        right={
          <MButton
            label={t('pro.promoNew')}
            variant="ghost"
            size="sm"
            icon="add"
            onPress={() => {
              setForm(VIDE);
              setFormError(null);
              setCreating(true);
            }}
          />
        }
      />

      <SalleSwitcher />

      <Body>
        {notice ? (
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              backgroundColor: colors.goldLight,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={colors.goldText} />
            <Text style={[typography.caption, { color: colors.goldText, flex: 1, textAlign: 'left' }]}>
              {notice}
            </Text>
          </View>
        ) : null}

        {codes.length === 0 ? (
          <EmptyState icon="pricetag-outline" title={t('pro.promoEmpty')} />
        ) : (
          codes.map((promo) => {
            const e = etat(promo, aujourdhui);
            const utilisable = e === 'active';

            return (
              <MCard key={promo.id} style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons
                    name="pricetag"
                    size={16}
                    color={utilisable ? colors.primaryInk : colors.warmGray}
                  />
                  <Text
                    style={[
                      typography.title,
                      { fontSize: 16, letterSpacing: 1, flex: 1, textAlign: 'left',
                        color: utilisable ? colors.dark : colors.warmGray },
                    ]}
                  >
                    {promo.code}
                  </Text>
                  {utilisable ? null : (
                    <MBadge label={t(`pro.promo${e.charAt(0).toUpperCase()}${e.slice(1)}`)} size="sm" />
                  )}
                </View>

                <Divider />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                  <View>
                    <Text style={[typography.caption, { color: colors.warmGray }]}>
                      {t('pro.promoValue')}
                    </Text>
                    <Text style={[typography.title, { color: colors.primaryInk }]}>
                      {promo.kind === PROMO_KINDS.PERCENT
                        ? `−${promo.value} %`
                        : `−${formatDA(promo.value, t('common.currency'))}`}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.warmGray }]}>
                      {promo.max_uses == null
                        ? t('pro.promoUsesUnlimited', {
                            used: promo.used_count,
                            s: promo.used_count > 1 ? 's' : '',
                          })
                        : t('pro.promoUses', {
                            used: promo.used_count,
                            max: promo.max_uses,
                            s: promo.used_count > 1 ? 's' : '',
                          })}
                    </Text>
                    {promo.ends_on ? (
                      <Text style={[typography.caption, { color: colors.warmGray }]}>
                        {t('pro.promoUntil', { date: formatLongDate(promo.ends_on, list('months')) })}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <MButton
                    label={promo.active ? t('pro.promoDeactivate') : t('pro.promoActivate')}
                    variant="ghost"
                    size="sm"
                    onPress={() => basculer(promo)}
                    style={{ flex: 1 }}
                  />
                  <Pressable
                    onPress={() => supprimer(promo)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('pro.promoDelete')}
                    style={{ padding: spacing.sm }}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.accent} />
                  </Pressable>
                </View>
              </MCard>
            );
          })
        )}
      </Body>

      <MSheet visible={creating} onClose={() => setCreating(false)} title={t('pro.promoNew')}>
        <View style={{ gap: spacing.lg }}>
          <MInput
            label={t('pro.promoCode')}
            value={form.code}
            onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
            autoCapitalize="characters"
            autoCorrect={false}
            direction="ltr"
            placeholder="RENTREE10"
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
              {t('pro.promoKind')}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <MChip
                label={t('pro.promoPercent')}
                active={form.kind === PROMO_KINDS.PERCENT}
                onPress={() => setForm((f) => ({ ...f, kind: PROMO_KINDS.PERCENT }))}
              />
              <MChip
                label={t('pro.promoAmount')}
                active={form.kind === PROMO_KINDS.AMOUNT}
                onPress={() => setForm((f) => ({ ...f, kind: PROMO_KINDS.AMOUNT }))}
              />
            </View>
          </View>

          <MInput
            label={t('pro.promoValue')}
            value={form.value}
            onChangeText={(v) => setForm((f) => ({ ...f, value: v.replace(/\D/g, '') }))}
            keyboardType="number-pad"
            direction="ltr"
            suffix={form.kind === PROMO_KINDS.PERCENT ? '%' : t('common.currency')}
          />

          <MInput
            label={t('pro.promoEnds')}
            value={form.ends_on}
            onChangeText={(v) => setForm((f) => ({ ...f, ends_on: v }))}
            placeholder="2026-12-31"
            direction="ltr"
          />

          <MInput
            label={t('pro.promoMaxUses')}
            value={form.max_uses}
            onChangeText={(v) => setForm((f) => ({ ...f, max_uses: v.replace(/\D/g, '') }))}
            keyboardType="number-pad"
            direction="ltr"
          />

          {formError ? (
            <Text style={[typography.caption, { color: colors.accent, textAlign: 'left' }]}>
              {formError}
            </Text>
          ) : null}

          <MButton label={t('common.save')} size="lg" onPress={creer} loading={saving} full />
        </View>
      </MSheet>
    </Screen>
  );
}
