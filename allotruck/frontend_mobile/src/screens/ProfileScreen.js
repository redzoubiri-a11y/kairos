import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const isTransporter = user?.role === 'TRANSPORTER';
  const transporter = user?.transporter;

  const items = [
    ...(isTransporter
      ? [
          { icon: 'bus-outline', label: 'Ma flotte', screen: 'MyTrucks' },
          { icon: 'map-outline', label: 'Mes trajets', screen: 'MyTrips' },
          { icon: 'document-text-outline', label: 'Mes documents', screen: 'Documents' },
        ]
      : [{ icon: 'clipboard-outline', label: 'Mes missions', screen: 'Missions' }]),
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
    { icon: 'settings-outline', label: 'Parametres', screen: 'Settings' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profil" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.identity}>
          <Avatar name={user?.fullName} size={62} />
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}

          <Badge
            tone={
              isTransporter
                ? { bg: colors.primarySoft, fg: colors.primaryDark }
                : { bg: colors.infoSoft, fg: colors.info }
            }
            label={isTransporter ? 'Transporteur' : 'Client'}
            style={styles.roleBadge}
          />

          {isTransporter && transporter ? (
            <View style={styles.company}>
              <Text style={styles.companyName}>{transporter.companyName}</Text>
              <Text style={styles.companyCity}>{transporter.city}</Text>
              <Badge status={transporter.verificationStatus} style={styles.verifyBadge} />
            </View>
          ) : null}
        </Card>

        {isTransporter && transporter?.verificationStatus !== 'VERIFIED' ? (
          <Pressable style={styles.alert} onPress={() => navigation.navigate('Documents')}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.alertText}>
              {transporter?.verificationStatus === 'REJECTED'
                ? 'Votre dossier a ete refuse. Renvoyez vos documents.'
                : 'Envoyez vos documents pour activer votre compte.'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.warning} />
          </Pressable>
        ) : null}

        <Card style={styles.menu}>
          {items.map((item, index) => (
            <Pressable
              key={item.screen}
              style={[styles.menuItem, index < items.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={20} color={colors.textMuted} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  identity: { alignItems: 'center' },
  name: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  email: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  phone: { ...typography.small, color: colors.textMuted },
  roleBadge: { marginTop: spacing.md },
  company: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
  },
  companyName: { ...typography.bodyStrong, color: colors.text },
  companyCity: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  verifyBadge: { marginTop: spacing.sm },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  alertText: { ...typography.small, color: colors.warning, flex: 1, marginHorizontal: spacing.sm },
  menu: { marginTop: spacing.md, padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { ...typography.body, color: colors.text, flex: 1, marginLeft: spacing.md },
});
