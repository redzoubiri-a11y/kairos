import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import MButton from '../../components/MButton';
import MSheet from '../../components/MSheet';
import MInput from '../../components/MInput';
import { MCard, MBadge, ProgressBar, SectionTitle, Divider, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA } from '../../lib/format';
import { PAYMENT_METHODS, SUBSCRIPTION_PRICE, TRIAL_DAYS } from '../../lib/constants';
import { buildInvoiceHtml, exportToPdf, pdfLabels } from '../../services/pdf';
import { useAuth } from '../../context/AuthContext';
import { useProSalle } from '../../context/ProSalleContext';
import * as api from '../../data';

const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];

export default function ProSubscriptionScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, dir, align } = useI18n();
  const { user } = useAuth();
  const { salles } = useProSalle();

  const [sub, setSub] = useState(null);
  // Identifiant de la facture en cours d'export, pour n'animer que sa ligne.
  const [exporting, setExporting] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [configuring, setConfiguring] = useState(false);
  const [method, setMethod] = useState('ccp');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, inv] = await Promise.all([api.getSubscription(), api.listInvoices()]);
      setSub(s);
      setInvoices(inv);
      if (s?.payment_method) setMethod(s.payment_method);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const exportInvoice = async (invoice) => {
    setExporting(invoice.id);
    try {
      await exportToPdf({
        html: buildInvoiceHtml({
          invoice,
          pro: user,
          // L'abonnement étant facturé par propriétaire, la facture énumère
          // les salles couvertes.
          salles,
          labels: pdfLabels(t),
        }),
      });
    } catch {
      // Impression annulée ou indisponible : rien à signaler.
    } finally {
      setExporting(null);
    }
  };

  const savePayment = async () => {
    setSaving(true);
    try {
      await api.setPaymentMethod(method, { reference: reference.trim() });
      setConfiguring(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title={t('pro.subscriptionTitle')} bordered={false} onBack={navigation.goBack} />
        <Loader />
      </Screen>
    );
  }
  if (error || !sub) {
    return (
      <Screen>
        <Header title={t('pro.subscriptionTitle')} bordered={false} onBack={navigation.goBack} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const percent = Math.round((sub.daysUsed / (sub.trialTotal || TRIAL_DAYS)) * 100);

  return (
    <Screen>
      <Header title={t('pro.subscriptionTitle')} bordered={false} onBack={navigation.goBack} />

      <Body>
        {/* Panneau essai gratuit (§5.7) */}
        <MCard style={{ gap: spacing.md }}>
          <View style={{ flexDirection: dir, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.title, { color: colors.dark }]}>{t('pro.trialPanel')}</Text>
            <MBadge label={t('pro.trialProgress', { used: sub.daysUsed, total: sub.trialTotal })} tone="gold" />
          </View>

          {/* Le libellé de progression est visible : la barre or reste lisible */}
          <ProgressBar percent={percent} tone="gold" height={10} showLabel />

          <Divider />

          <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
            {t('pro.trialIncluded')}
          </Text>

          <View style={{ gap: spacing.sm }}>
            {FEATURES.map((f) => (
              <View key={f} style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={15} color={colors.primaryInk} />
                <Text style={[typography.secondary, { color: colors.dark, flex: 1, textAlign: align }]}>
                  {t(`pro.features.${f}`)}
                </Text>
              </View>
            ))}
          </View>
        </MCard>

        {/* Passage Pro (§5.7) */}
        <MCard style={{ gap: spacing.md }}>
          <View style={{ flexDirection: dir, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, { color: colors.dark, textAlign: align }]}>{t('pro.goPro')}</Text>
              <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
                {t('pro.proNoCommitment')}
              </Text>
            </View>
            <Text style={[typography.h3, { color: colors.primaryInk }]}>
              {formatDA(SUBSCRIPTION_PRICE, t('common.currency'))}
            </Text>
          </View>

          <Divider />

          <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
            {t('pro.paymentMethods')}
          </Text>

          <View style={{ flexDirection: dir, gap: spacing.sm, flexWrap: 'wrap' }}>
            {PAYMENT_METHODS.map((m) => {
              const disabled = m === 'edahabia';
              const active = sub.payment_method === m;
              return (
                <View
                  key={m}
                  style={{
                    flexDirection: dir,
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radii.pill,
                    borderWidth: 1,
                    borderColor: active ? colors.primaryInk : colors.border,
                    backgroundColor: active ? colors.primaryLight : colors.surface,
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <Text style={[typography.caption, { color: active ? colors.primaryInk : colors.dark }]}>
                    {t(`pro.${m}`)}
                  </Text>
                  {disabled ? (
                    <Text style={[typography.caption, { color: colors.warmGray, fontSize: 10 }]}>
                      ({t('pro.edahabiaSoon')})
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          <MButton
            label={sub.payment_method ? t('pro.paymentConfigured') : t('pro.configurePayment')}
            variant={sub.payment_method ? 'ghost' : 'primary'}
            icon={sub.payment_method ? 'checkmark' : 'card-outline'}
            onPress={() => setConfiguring(true)}
            full
          />
        </MCard>

        {/* Historique de facturation (§5.7) */}
        <View>
          <SectionTitle title={t('pro.invoices')} />
          <MCard padded={false}>
            {invoices.map((inv, i) => (
              <View key={inv.id}>
                {i > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: dir,
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.lg,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.secondary, { color: colors.dark, textAlign: align }]}>
                      {inv.period}
                    </Text>
                    <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
                      {inv.description}
                    </Text>
                  </View>

                  <Text style={[typography.secondary, { color: colors.dark }]}>
                    {formatDA(inv.amount, t('common.currency'))}
                  </Text>

                  <MBadge
                    label={inv.status === 'paid' ? t('pro.invoiceStatusPaid') : t('pro.invoiceStatusPending')}
                    tone={inv.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  />

                  <Pressable
                    hitSlop={6}
                    onPress={() => exportInvoice(inv)}
                    disabled={exporting != null}
                    accessibilityRole="button"
                    accessibilityLabel={t('pro.downloadInvoice', { period: inv.period })}
                    accessibilityState={{ busy: exporting === inv.id }}
                  >
                    <Ionicons
                      name={exporting === inv.id ? 'hourglass-outline' : 'download-outline'}
                      size={16}
                      color={colors.warmGray}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </MCard>
        </View>
      </Body>

      <MSheet visible={configuring} onClose={() => setConfiguring(false)} title={t('pro.configurePayment')}>
        <View style={{ gap: spacing.sm }}>
          {PAYMENT_METHODS.filter((m) => m !== 'edahabia').map((m) => {
            const active = method === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={{
                  flexDirection: dir,
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: active ? colors.primaryInk : colors.border,
                  backgroundColor: active ? colors.primaryLight : colors.surface,
                }}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={19}
                  color={active ? colors.primaryInk : colors.border}
                />
                <Text style={[typography.secondary, { color: colors.dark, flex: 1, textAlign: align }]}>
                  {t(`pro.${m}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <MInput
          label={method === 'ccp' ? t('pro.ccpNumber') : t('booking.phone')}
          value={reference}
          onChangeText={setReference}
          direction="ltr"
        />

        <MButton label={t('common.save')} size="lg" full onPress={savePayment} loading={saving} />
      </MSheet>
    </Screen>
  );
}
