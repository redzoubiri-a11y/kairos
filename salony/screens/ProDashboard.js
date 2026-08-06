import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import { useT } from '../src/i18n';

export default function ProDashboard({ route }) {
  const t = useT();
  const { salonId } = route.params;
  const [stats, setStats] = useState({ rdvAujourdhui: 0, caSemaine: 0, tauxNoShow: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const debutJour = new Date();
        debutJour.setHours(0, 0, 0, 0);
        const finJour = new Date();
        finJour.setHours(23, 59, 59, 999);

        const { count: rdvAujourdhui } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('salon_id', salonId)
          .gte('date_heure_debut', debutJour.toISOString())
          .lte('date_heure_debut', finJour.toISOString());

        setStats((prev) => ({ ...prev, rdvAujourdhui: rdvAujourdhui ?? 0 }));
      })();
    }, [salonId])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={styles.titre}>{t('dashboard.titre')}</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValeur}>{stats.rdvAujourdhui}</Text>
          <Text style={styles.statLabel}>{t('dashboard.rdvAujourdhui')}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValeur}>{t('commun.devise', { n: stats.caSemaine })}</Text>
          <Text style={styles.statLabel}>{t('dashboard.caSemaine')}</Text>
        </Card>
      </View>

      <Card style={styles.statCard}>
        <Text style={styles.statValeur}>{stats.tauxNoShow}%</Text>
        <Text style={styles.statLabel}>{t('dashboard.tauxAbsence')}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statValeur: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.primary },
  statLabel: { fontSize: typography.size.sm, color: colors.textSecondary },
});
