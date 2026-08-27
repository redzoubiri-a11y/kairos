import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body, StickyBar } from '../../components/Screen';
import Calendar, { CalendarLegend } from '../../components/Calendar';
import Stepper from '../../components/Stepper';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import PromoField from '../../components/PromoField';
import { MChip, Loader, ErrorState, KeyValue } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { formatDA, formatLongDate, isValidPhone, displayPhone } from '../../lib/format';
import { EVENT_TYPES } from '../../lib/constants';
import * as api from '../../data';
import { useGoBack } from '../../lib/navigation';

export default function BookingScreen({ route, navigation }) {
  const goBack = useGoBack(navigation);
  const { salleId } = route.params;
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();
  const { user } = useAuth();

  const today = new Date();
  const [step, setStep] = useState(0);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const [salle, setSalle] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const [date, setDate] = useState(null);
  const [formulaId, setFormulaId] = useState(null);
  const [form, setForm] = useState({
    client_name: user?.full_name || '',
    client_phone: user?.phone ? displayPhone(user.phone) : '',
    event_type: 'mariage',
    guest_count: '',
    client_message: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  // Code promo vérifié par le serveur : { code, discount, total }
  const [promo, setPromo] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const s = await api.getSalle(salleId);
      setSalle(s);
      if (s.tarifs?.length) setFormulaId((prev) => prev || s.tarifs[0].id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [salleId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .getAvailability(salleId, cursor.year, cursor.month)
      .then(setAvailability)
      .catch(() => {});
  }, [salleId, cursor]);

  const changeMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const selectedFormula = salle?.tarifs?.find((x) => x.id === formulaId);

  const validateInfos = () => {
    const errs = {};
    if (form.client_name.trim().length < 3) errs.client_name = t('booking.errorName');
    if (!isValidPhone(form.client_phone)) errs.client_phone = t('booking.errorPhone');
    if (!Number(form.guest_count)) errs.guest_count = t('booking.errorGuests');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Changer de formule change le montant, donc la remise : un code appliqué
   * sur une formule à 35 000 DA n'est plus le même sur une à 74 900. On le
   * retire pour forcer une nouvelle vérification plutôt que d'afficher une
   * remise périmée.
   */
  const choisirFormule = (id) => {
    if (id !== formulaId) setPromo(null);
    setFormulaId(id);
  };

  const submit = async () => {
    if (!validateInfos()) return;
    setSubmitting(true);
    setError(null);
    try {
      const reservation = await api.createReservation({
        salle_id: salleId,
        event_date: date,
        event_type: form.event_type,
        guest_count: Number(form.guest_count),
        formula_id: formulaId,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone,
        client_message: form.client_message.trim(),
        promo_code: promo?.code || null,
      });
      setCreated(reservation);
      setStep(3);
    } catch (e) {
      if (e.code === 'PROMO_REFUSED') {
        // Le quota a pu s'épuiser entre la vérification et l'envoi.
        setPromo(null);
        setError(t(`booking.promoErrors.${e.reason || 'unknown'}`));
      } else {
        setError(e.code === 'DAY_TAKEN' ? t('booking.dayTaken') : e.message || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }
  if (!salle) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const steps = [
    t('booking.steps.date'),
    t('booking.steps.formula'),
    t('booking.steps.infos'),
    t('booking.steps.send'),
  ];

  // Étape 4 — confirmation
  if (step === 3 && created) {
    return (
      <Screen>
        <Body>
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: radii.pill,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={40} color={colors.primaryInk} />
            </View>

            <Text style={[typography.h2, { color: colors.dark, textAlign: 'center' }]}>
              {t('booking.successTitle')}
            </Text>
            <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>
              {t('booking.successBody')}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.xl,
              padding: spacing.lg,
            }}
          >
            <Text style={[typography.caption, { color: colors.warmGray, marginBottom: spacing.sm, textAlign: 'left' }]}>
              {t('booking.recap')}
            </Text>
            <KeyValue label={t('booking.hall')} value={salle.name} />
            <KeyValue label={t('booking.date')} value={formatLongDate(created.event_date, list('months'))} />
            <KeyValue label={t('booking.formula')} value={selectedFormula?.name || '—'} />
            <KeyValue
              label={t('booking.amount')}
              value={formatDA(created.total_amount, t('common.currency'))}
              strong
              tone="primary"
            />
            <KeyValue label={t('booking.reference')} value={created.reference} />
          </View>

          <View style={{ gap: spacing.md }}>
            <MButton
              label={t('booking.seeRequest')}
              size="lg"
              full
              onPress={() =>
                navigation.replace('ReservationDetail', { id: created.id })
              }
            />
            <MButton
              label={t('booking.backHome')}
              variant="ghost"
              size="lg"
              full
              onPress={() => navigation.popToTop()}
            />
          </View>
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={salle.name}
        subtitle={steps[step]}
        onBack={step === 0 ? goBack : () => setStep((s) => s - 1)}
      />

      <View style={{ paddingVertical: spacing.lg }}>
        <Stepper steps={steps} current={step} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body bottomInset={80}>
          {/* Étape 1 — date */}
          {step === 0 ? (
            <View style={{ gap: spacing.lg }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={[typography.h3, { color: colors.dark, textAlign: 'left' }]}>
                  {t('booking.pickDate')}
                </Text>
                <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                  {t('booking.pickDateHint')}
                </Text>
              </View>

              <Calendar
                year={cursor.year}
                month={cursor.month}
                availability={availability}
                selected={date}
                onSelect={(iso) => setDate(iso)}
                onChangeMonth={changeMonth}
              />

              <CalendarLegend
                items={[
                  { state: 'available', label: t('booking.legendAvailable') },
                  { state: 'booked', label: t('booking.legendBooked') },
                  { state: 'blocked', label: t('booking.legendUnavailable') },
                ]}
              />
            </View>
          ) : null}

          {/* Étape 2 — formule */}
          {step === 1 ? (
            <View style={{ gap: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.dark, textAlign: 'left' }]}>
                {t('booking.pickFormula')}
              </Text>

              {salle.tarifs.map((tarif, i) => {
                const selected = tarif.id === formulaId;
                return (
                  <Pressable
                    key={tarif.id}
                    onPress={() => choisirFormule(tarif.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? colors.primaryInk : colors.border,
                      borderRadius: radii.xl,
                      padding: spacing.lg,
                    }}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.primaryInk : colors.border}
                    />

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={[typography.secondary, { color: colors.dark, fontWeight: '500' }]}>
                          {tarif.name}
                        </Text>
                        {i === salle.tarifs.length - 1 ? <Text>⭐</Text> : null}
                      </View>
                      {tarif.description ? (
                        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                          {tarif.description}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={[typography.title, { fontSize: 15, color: colors.primaryInk }]}>
                      {formatDA(tarif.price, t('common.currency'))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Étape 3 — informations */}
          {step === 2 ? (
            <View style={{ gap: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.dark, textAlign: 'left' }]}>
                {t('booking.yourInfos')}
              </Text>

              <MInput
                label={t('booking.fullName')}
                value={form.client_name}
                onChangeText={(v) => setForm((f) => ({ ...f, client_name: v }))}
                autoCapitalize="words"
                icon="person-outline"
                error={fieldErrors.client_name}
              />

              <MInput
                label={t('booking.phone')}
                value={form.client_phone}
                onChangeText={(v) => setForm((f) => ({ ...f, client_phone: v }))}
                keyboardType="number-pad"
                // Voir PhoneScreen.js : la barre de suggestion QuickType iOS
                // fait perdre le focus à chaque frappe sur ce type de champ.
                textContentType="none"
                direction="ltr"
                icon="call-outline"
                error={fieldErrors.client_phone}
              />

              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                  {t('booking.eventType')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {EVENT_TYPES.map((type) => (
                    <MChip
                      key={type}
                      label={t(`events.${type}`)}
                      active={form.event_type === type}
                      onPress={() => setForm((f) => ({ ...f, event_type: type }))}
                    />
                  ))}
                </View>
              </View>

              <MInput
                label={t('booking.guestCount')}
                value={form.guest_count}
                onChangeText={(v) => setForm((f) => ({ ...f, guest_count: v.replace(/\D/g, '') }))}
                keyboardType="number-pad"
                direction="ltr"
                suffix={t('common.guests')}
                error={fieldErrors.guest_count}
                hint={`${t('salle.capacity')} : ${salle.capacity_max}`}
              />

              <PromoField
                salleId={salleId}
                amount={selectedFormula?.price || 0}
                applied={promo}
                onApplied={setPromo}
              />

              <MInput
                label={t('booking.messageToOwner')}
                value={form.client_message}
                onChangeText={(v) => setForm((f) => ({ ...f, client_message: v }))}
                placeholder={t('booking.messagePlaceholder')}
                multiline
              />

              {error ? <Text style={[typography.caption, { color: colors.accentInk }]}>{error}</Text> : null}
            </View>
          ) : null}
        </Body>
      </KeyboardAvoidingView>

      <StickyBar>
        {step === 0 && date ? (
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>{t('booking.date')}</Text>
            <Text style={[typography.secondary, { color: colors.dark, fontWeight: '500' }]} numberOfLines={1}>
              {formatLongDate(date, list('months'))}
            </Text>
          </View>
        ) : null}

        {step === 1 && selectedFormula ? (
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>{t('booking.amount')}</Text>
            <Text style={[typography.title, { color: colors.primaryInk }]}>
              {formatDA(selectedFormula.price, t('common.currency'))}
            </Text>
          </View>
        ) : null}

        {step === 2 && promo ? (
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>
              {t('booking.amount')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
              <Text
                style={[
                  typography.caption,
                  { color: colors.warmGray, textDecorationLine: 'line-through' },
                ]}
              >
                {formatDA(selectedFormula?.price, t('common.currency'))}
              </Text>
              <Text style={[typography.title, { color: colors.primaryInk }]}>
                {formatDA(promo.total, t('common.currency'))}
              </Text>
            </View>
          </View>
        ) : null}

        <MButton
          label={step === 2 ? t('booking.sendRequest') : t('common.next')}
          size="lg"
          full={step !== 0 && step !== 1 && !(step === 2 && promo)}
          loading={submitting}
          disabled={(step === 0 && !date) || (step === 1 && !formulaId)}
          onPress={() => (step === 2 ? submit() : setStep((s) => s + 1))}
          style={{ flex: step === 0 || step === 1 || (step === 2 && promo) ? 1 : undefined }}
        />
      </StickyBar>
    </Screen>
  );
}
