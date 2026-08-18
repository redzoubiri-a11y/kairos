import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import { MBadge, MCard, KeyValue, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { formatDA } from '../../lib/format';
import * as api from '../../data';

const STATUS_TONE = { pending: 'warning', accepted: 'success', declined: 'danger' };

/**
 * Espace pro minimal pour traiteurs/halouadjis (§13) — pas de tab bar
 * (`ProTabs`, App.js, est spécifique aux salles : planning, réservations,
 * disponibilité par jour, aucun sens pour un devis). Un seul écran : la
 * fiche en lecture seule et les demandes de devis à traiter. L'édition de
 * fiche et les statistiques restent hors périmètre pour cette première
 * version — à ajouter une fois le volume réel connu.
 */
function DevisRow({ devis, onRespond }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();
  const [reply, setReply] = useState('');
  const [responding, setResponding] = useState(false);
  const [open, setOpen] = useState(false);

  const respond = async (status) => {
    setResponding(true);
    try {
      await onRespond(devis.id, status, reply);
    } finally {
      setResponding(false);
    }
  };

  return (
    <MCard style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2 }}>
          {devis.event_date ? <KeyValue label={t('devis.eventDate')} value={devis.event_date} /> : null}
          <KeyValue label={t('devis.guestCount')} value={t('proPartner.guestCount', { count: devis.guest_count })} />
        </View>
        <MBadge label={t(`devis.status${devis.status[0].toUpperCase()}${devis.status.slice(1)}`)} tone={STATUS_TONE[devis.status]} />
      </View>

      {devis.message ? (
        <Text style={[typography.secondary, { color: colors.dark, textAlign: 'left' }]}>{devis.message}</Text>
      ) : null}

      {devis.status !== 'pending' && devis.pro_reply ? (
        <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: radii.md, padding: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.warmGray }]}>{t('proPartner.yourReply')}</Text>
          <Text style={[typography.secondary, { color: colors.dark, textAlign: 'left' }]}>{devis.pro_reply}</Text>
        </View>
      ) : null}

      {devis.status === 'pending' ? (
        open ? (
          <View style={{ gap: spacing.sm }}>
            <MInput value={reply} onChangeText={setReply} placeholder={t('proPartner.replyPlaceholder')} multiline />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <MButton label={t('proPartner.decline')} variant="ghost" onPress={() => respond('declined')} loading={responding} style={{ flex: 1 }} />
              <MButton label={t('proPartner.accept')} onPress={() => respond('accepted')} loading={responding} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
            <Text style={[typography.secondary, { color: colors.primaryInk, textAlign: 'left' }]}>
              {t('proPartner.accept')} / {t('proPartner.decline')}
            </Text>
          </Pressable>
        )
      ) : null}
    </MCard>
  );
}

export default function ProPartnerScreen() {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { user, businessType, logout } = useAuth();

  const [partner, setPartner] = useState(null);
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [fiches] = await Promise.all([api.proListPartners(businessType)]);
      const mine = fiches[0] || null;
      setPartner(mine);
      if (mine) setDevis(await api.proListDevisRequests(businessType, mine.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [businessType]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const respond = async (id, status, reply) => {
    await api.respondDevisRequest(id, status, reply);
    await load();
  };

  if (loading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }
  if (error || !partner) {
    return (
      <Screen>
        <ErrorState message={error || 'NO_PARTNER'} onRetry={load} />
      </Screen>
    );
  }

  const pending = devis.filter((d) => d.status === 'pending');
  const answered = devis.filter((d) => d.status !== 'pending');

  return (
    <Screen>
      <Header
        title={partner.name}
        subtitle={t(`proPartner.status${partner.status[0].toUpperCase()}${partner.status.slice(1)}`)}
        right={
          <Pressable onPress={logout} accessibilityRole="button" accessibilityLabel={t('proPartner.logout')} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={colors.dark} />
          </Pressable>
        }
      />

      <Body>
        <MCard style={{ gap: spacing.xs }}>
          <Text style={[typography.title, { color: colors.dark }]}>{partner.name}</Text>
          <KeyValue label={t('partnerOnboarding.city')} value={partner.city} />
          {partner.prix_min != null && partner.prix_max != null ? (
            <KeyValue
              label={t('partnerOnboarding.priceRange')}
              value={`${formatDA(partner.prix_min, t('common.currency'))} – ${formatDA(partner.prix_max, t('common.currency'))}`}
            />
          ) : null}
        </MCard>

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.title, { fontSize: 15, color: colors.dark }]}>
            {t('proPartner.requestsTitle')}
          </Text>

          {devis.length === 0 ? (
            <Text style={[typography.secondary, { color: colors.warmGray }]}>{t('proPartner.noRequests')}</Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {pending.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={[typography.caption, { color: colors.warmGray }]}>{t('proPartner.pendingRequests')}</Text>
                  {pending.map((d) => (
                    <DevisRow key={d.id} devis={d} onRespond={respond} />
                  ))}
                </View>
              ) : null}
              {answered.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={[typography.caption, { color: colors.warmGray }]}>{t('proPartner.answeredRequests')}</Text>
                  {answered.map((d) => (
                    <DevisRow key={d.id} devis={d} onRespond={respond} />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </Body>
    </Screen>
  );
}
