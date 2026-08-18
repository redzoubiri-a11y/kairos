import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { missionApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { formatDateTime, formatPrice, formatVolume, formatWeight } from '../utils/format';
import { colors, radii, spacing, typography } from '../theme';

export default function MissionDetailScreen({ navigation, route }) {
  const { missionId } = route.params;
  const user = useAuthStore((s) => s.user);
  const upsert = useMissionStore((s) => s.upsert);

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setMission(await missionApi.getById(missionId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const isTransporter = user?.role === 'TRANSPORTER' && mission?.transporter?.user?.id === user?.id;
  const isClient = mission?.client?.id === user?.id;

  const changeStatus = async (status, reason) => {
    setActing(status);
    setError(null);
    try {
      const updated = await missionApi.updateStatus(missionId, status, reason);
      setMission(updated);
      upsert(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  const confirmReject = () => {
    Alert.prompt?.(
      'Refuser la mission',
      'Indiquez le motif du refus (optionnel)',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: (reason) => changeStatus('REJECTED', reason) },
      ],
      'plain-text'
    ) ?? changeStatus('REJECTED');
  };

  const confirmCancel = () => {
    Alert.alert('Annuler la mission', 'Cette action est definitive.', [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler la mission', style: 'destructive', onPress: () => changeStatus('CANCELLED') },
    ]);
  };

  if (loading && !mission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mission" onBack={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!mission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mission" onBack={() => navigation.goBack()} />
        <View style={styles.padded}>
          <ErrorBanner message={error ?? 'Mission introuvable'} onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  const counterpart = isTransporter
    ? { label: 'Client', name: mission.client?.fullName, phone: mission.client?.phone }
    : {
        label: 'Transporteur',
        name: mission.transporter?.companyName,
        phone: mission.transporter?.user?.phone,
      };

  const chatOpen = !['REJECTED', 'CANCELLED'].includes(mission.status);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={mission.goodsType} subtitle={`Mission #${mission.id.slice(0, 8)}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <ErrorBanner message={error} />

        <Card>
          <View style={styles.statusRow}>
            <Badge status={mission.status} />
            <Text style={styles.createdAt}>{formatDateTime(mission.createdAt)}</Text>
          </View>
          {mission.statusReason ? <Text style={styles.reason}>Motif : {mission.statusReason}</Text> : null}

          <View style={styles.route}>
            <RoutePoint icon="ellipse-outline" city={mission.pickupCity} date={formatDateTime(mission.pickupAt)} label="Chargement" />
            <View style={styles.routeLine} />
            <RoutePoint icon="location" city={mission.dropoffCity} label="Livraison" />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Marchandise</Text>
          <Row label="Type" value={mission.goodsType} />
          <Row label="Volume" value={formatVolume(mission.volumeM3)} />
          <Row label="Poids" value={formatWeight(mission.weightKg)} />
          <Row label="Budget" value={formatPrice(mission.budgetDzd)} />
          {mission.description ? <Text style={styles.description}>{mission.description}</Text> : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{counterpart.label}</Text>
          <Row label="Nom" value={counterpart.name ?? '—'} />
          <Row label="Telephone" value={counterpart.phone ?? '—'} />
          {mission.truck ? <Row label="Camion" value={`${mission.truck.plateNumber} • ${formatVolume(mission.truck.volumeM3)}`} /> : null}
          {mission.trip ? <Row label="Trajet" value={`${mission.trip.originCity} → ${mission.trip.destinationCity}`} /> : null}
        </Card>

        {chatOpen ? (
          <Button
            title="Ouvrir la conversation"
            icon="chatbubbles-outline"
            variant="secondary"
            onPress={() =>
              navigation.navigate('Chat', {
                missionId: mission.id,
                title: counterpart.name,
                subtitle: `${mission.pickupCity} → ${mission.dropoffCity}`,
              })
            }
            style={styles.action}
          />
        ) : null}

        {isTransporter && mission.status === 'PENDING' ? (
          <View style={styles.actions}>
            <Button
              title="Accepter"
              variant="success"
              icon="checkmark"
              loading={acting === 'ACCEPTED'}
              onPress={() => changeStatus('ACCEPTED')}
              style={styles.action}
            />
            <Button
              title="Refuser"
              variant="danger"
              icon="close"
              loading={acting === 'REJECTED'}
              onPress={confirmReject}
              style={styles.action}
            />
          </View>
        ) : null}

        {isTransporter && mission.status === 'ACCEPTED' ? (
          <Button
            title="Demarrer le transport"
            icon="play"
            loading={acting === 'IN_PROGRESS'}
            onPress={() => changeStatus('IN_PROGRESS')}
            style={styles.action}
          />
        ) : null}

        {isTransporter && mission.status === 'IN_PROGRESS' ? (
          <Button
            title="Marquer comme livree"
            variant="success"
            icon="checkmark-done"
            loading={acting === 'COMPLETED'}
            onPress={() => changeStatus('COMPLETED')}
            style={styles.action}
          />
        ) : null}

        {isClient && ['PENDING', 'ACCEPTED'].includes(mission.status) ? (
          <Button
            title="Annuler la mission"
            variant="danger"
            loading={acting === 'CANCELLED'}
            onPress={confirmCancel}
            style={styles.action}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function RoutePoint({ icon, city, date, label }) {
  return (
    <View style={styles.point}>
      <Ionicons name={icon} size={16} color={colors.primaryDark} />
      <View style={styles.pointText}>
        <Text style={styles.pointLabel}>{label}</Text>
        <Text style={styles.pointCity}>{city}</Text>
        {date ? <Text style={styles.pointDate}>{date}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  padded: { padding: spacing.lg },
  card: { marginTop: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createdAt: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
  reason: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  route: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  routeLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 7, marginVertical: 2 },
  point: { flexDirection: 'row', alignItems: 'flex-start' },
  pointText: { marginLeft: spacing.md, flex: 1 },
  pointLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
  pointCity: { ...typography.bodyStrong, color: colors.text },
  pointDate: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 2 },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { ...typography.small, color: colors.textMuted },
  rowValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
  description: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 20,
    backgroundColor: colors.cardMuted,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  actions: { flexDirection: 'row' },
  action: { marginTop: spacing.md, flex: 1, marginRight: spacing.sm },
});
